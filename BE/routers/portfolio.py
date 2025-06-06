from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Union, List
from openai import OpenAI
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone, ServerlessSpec
from datetime import datetime, timedelta, timezone
import os
import boto3
import json

from dotenv import load_dotenv
load_dotenv()


client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
sbert = SentenceTransformer("snunlp/KR-SBERT-V40K-klueNLI-augSTS")
pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"], serverless=ServerlessSpec(cloud="aws", region="us-east-1"))
index = pc.Index("finance-news")

router = APIRouter()

class SurveyRequest(BaseModel):
    responses: Dict[str, Union[str, List[str]]]

def generate_prompt(responses):
    return f"""
당신은 금융 전문가입니다. 아래 사용자의 재무 상태와 금융 니즈를 바탕으로, 실현 가능한 금융 전략을 추천해 주세요.
전략은 포트폴리오 형태로 제시하고, 상품 유형, 비중, 이유, 운용 팁 등을 포함해 주세요.

[사용자 정보]
- 연령대: {responses['Q1. 귀하의 연령대는 어떻게 되시나요?']}
- 직업: {responses['Q2. 귀하의 직업 유형은 무엇인가요?']}
- 자산 운용 목적: {responses['Q3. 이번 자산 운용의 주요 목적은 무엇인가요?']}
- 월 평균 소득: {responses['Q4. 월 평균 소득 수준은 어느 정도인가요?']}
- 투자 가능 자금 규모: {responses['Q5. 현재 투자에 활용 가능한 자금 규모는 어느 정도인가요?']}
- 투자 가능 기간: {responses['Q6. 해당 자금의 투자 가능 기간은?']}
- 투자 비중: {responses['Q7. 전체 자산 중 투자에 활용 가능한 비중은?']}
- 감내 가능한 위험 수준: {responses['Q8. 감내할 수 있는 투자 위험 수준은 어느 정도인가요?']}
- 금융 지식 및 경험: {responses['Q9. 본인의 금융 지식 및 투자 경험 수준은 어느 정도인가요?']}
- 중요하게 여기는 요소: {responses['Q10. 금융 상품에서 가장 중요하게 여기는 요소는 무엇인가요?']}
- 전략 변경 가능 여부: {responses['Q11. 시장 변화에 따라 전략을 변경할 수 있나요?']}
- 해외 투자 관심: {responses['Q12. 외화 자산이나 해외 투자에도 관심이 있나요?']}
- 부채 수준: {responses['Q13. 현재 부채 수준은 어느 정도인가요?']}
- 선호 투자 상품 유형: {', '.join(responses['Q14. 선호하는 투자 상품 유형을 모두 선택해주세요. (복수 선택 가능)'])}
- 투자 전략 기간: {responses['Q15. 현재 관심 있는 투자 전략 기간은?']}

[요청]
위 정보를 기반으로 포트폴리오를 추천해 주세요. 단순 상품 나열이 아닌 전략적인 자산 구성과 그 이유, 비중, 운용 팁을 포함해 주세요.
""".strip()


def get_strategy(prompt):
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "당신은 금융 전략 추천 전문가입니다."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.6,
        max_tokens=2000
    )
    return response.choices[0].message.content


def extract_keywords(strategy_text, top_k=5):
    prompt = f"""
당신은 금융 검색 전문가입니다.

아래는 어떤 사용자의 재무 상태와 니즈를 바탕으로 작성된 자산 포트폴리오 전략입니다.
이 전략과 관련된 최근 금융 뉴스 검색에 유용한 핵심 키워드 {top_k}개를 제시해 주세요.

- 각 키워드는 2~4단어로 구성해 주세요.
- 너무 포괄적인 단어(예: "경제", "금융") 대신 구체적인 주제어를 사용해 주세요.
- 키워드만 리스트로 반환해 주세요.

[전략 본문]
{strategy_text}
""".strip()

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
        max_tokens=300
    )
    text = response.choices[0].message.content.strip()
    keywords = [line.lstrip("0123456789.-•·● ").strip() for line in text.splitlines() if line.strip()]
    return keywords[:top_k]


def search_news_from_keywords(keywords, top_k=10, days=30):
    query_vector = sbert.encode(" ".join(keywords)).tolist()
    result = index.query(vector=query_vector, top_k=top_k * 5, include_metadata=True)

    date_limit = datetime.now(timezone.utc) - timedelta(days=days)
    filtered, seen = [], set()
    for match in result["matches"]:
        meta = match["metadata"]
        title = meta["title"]
        dt = datetime.strptime(meta["date"], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)

        if dt >= date_limit and title not in seen:
            filtered.append(meta)
            seen.add(title)

        if len(filtered) >= top_k:
            break

    return filtered


def load_news_from_s3(date):
    session = boto3.Session(
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"]
    )
    s3 = session.client("s3")

    key = f"news_data/cleaned_news_{date}.json"
    bucket = os.environ["AWS_S3_BUCKET"]

    try:
        response = s3.get_object(Bucket=bucket, Key=key)
        content = response["Body"].read().decode("utf-8")
        return json.loads(content)
    except Exception:
        return []


def match_news_and_summarize(metadata):
    news_by_date = {date[:10]: load_news_from_s3(date[:10]) for date in {m['date'][:10] for m in metadata}}

    matched_news = []
    for item in metadata:
        date = item["date"][:10]
        title = item["title"]
        for news in news_by_date.get(date, []):
            if news.get("title") == title:
                matched_news.append({
                    "date": news.get("time"),
                    "title": news.get("title"),
                    "content": news.get("cleaned_content")
                })
                break

    context = "\n\n".join([n["content"] for n in matched_news])
    if not context:
        return "", matched_news

    prompt = PromptTemplate.from_template("""
아래는 최근 금융 뉴스 기사 본문입니다. 다음 조건에 맞게 요약해 주세요:

[요약 조건]
- 금융시장의 주요 흐름을 최대 5줄 이내로 정리해 주세요. 
- 투자 판단에 중요한 내용만 포함하고, 불필요한 설명은 생략해 주세요.
- 각 줄은 핵심 단위로 끊어서 정리해 주세요.

{context}
""")
    llm = ChatOpenAI(model_name="gpt-4o", temperature=0.3)
    summary = llm.invoke(prompt.format(context=context))
    return summary.content, matched_news


strategy_refine_prompt = PromptTemplate.from_template("""
당신은 숙련된 금융 전략가입니다. 아래의 사용자의 초기 전략을 바탕으로,
최근 시장 뉴스 흐름을 반영하여 전략을 보완하거나 수정해 주세요.

[초기 전략]
{strategy}

[뉴스 요약]
{news_summary}

[요청]
- 초기 전략을 바탕으로 포트폴리오 형태로 정리하고, 상품 유형/비중/이유/운용 팁을 포함해 주세요.
- 투자 판단에 중요한 변경이 있다면, 그 이유를 명확히 설명해 주세요.
- 뉴스에서 언급된 사항이 초기 전략에서 어떠한 영향을 미쳤는지도 설명해주세요
- 10~15줄 이내로 간결하고 실제 적용 가능한 전략을 제시해 주세요.
""")

def refine_strategy_with_news(strategy, news_summary):
    prompt = strategy_refine_prompt.format(strategy=strategy, news_summary=news_summary)
    llm = ChatOpenAI(model_name="gpt-4o", temperature=0.4)
    return llm.invoke(prompt).content


@router.post("/recommend")
def portfolio_recommend(request: SurveyRequest):
    prompt = generate_prompt(request.responses)
    initial_strategy = get_strategy(prompt)
    keywords = extract_keywords(initial_strategy)
    metadata = search_news_from_keywords(keywords)
    news_summary, matched_news = match_news_and_summarize(metadata)
    final_strategy = refine_strategy_with_news(initial_strategy, news_summary)

    return {
        "strategy": final_strategy
    }
