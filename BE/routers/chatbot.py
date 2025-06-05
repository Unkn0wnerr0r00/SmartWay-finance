from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, List
import os, json, boto3
from datetime import datetime, timedelta, timezone

from openai import OpenAI
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone, ServerlessSpec

router = APIRouter()

# ==== 설정 ====
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
sbert = SentenceTransformer("snunlp/KR-SBERT-V40K-klueNLI-augSTS")
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"), serverless=ServerlessSpec(cloud="aws", region="us-east-1"))
index = pc.Index("finance-news")

# ==== 입력 모델 ====
class ChatInput(BaseModel):
    question: str

# ==== 유틸 함수들 ====

def classify_question(prompt: str) -> str:
    classification_prompt = f"""
사용자 질문: "{prompt}"

이 질문은 최신 금융 뉴스 문서를 참고해야 하나요?
아니면 일반적인 금융 지식(예: ETF가 뭐야?)만으로도 충분한가요?

아래 중 하나만 정확하게 출력하세요. 
- 뉴스 기반
- 일반 지식
"""
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": classification_prompt}],
        temperature=0,
    )
    return response.choices[0].message.content.strip()

def search_news(question: str, top_k=7, days=14):
    query_vector = sbert.encode(question).tolist()
    result = index.query(vector=query_vector, top_k=top_k, include_metadata=True)

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

def load_news_from_s3(date: str) -> List[Dict]:
    s3 = boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
    )
    bucket = os.getenv("AWS_S3_BUCKET")
    key = f"news_data/cleaned_news_{date}.json"
    try:
        response = s3.get_object(Bucket=bucket, Key=key)
        return json.loads(response["Body"].read().decode("utf-8"))
    except Exception as e:
        print(f"[S3 LOAD ERROR] {e}")
        return []

def get_news_context(metadata: List[Dict]) -> str:
    news_by_date = {m['date'][:10]: load_news_from_s3(m['date'][:10]) for m in metadata}
    matched_news = []
    for item in metadata:
        date = item["date"][:10]
        title = item["title"]
        for news in news_by_date.get(date, []):
            if news.get("title") == title:
                matched_news.append({
                    "date": news.get("time", item["date"]),
                    "title": news["title"],
                    "content": news["cleaned_content"],
                })
                break
    return "\n\n".join([f"[{n['date']}] {n['content']}" for n in matched_news if n["content"]])

# ==== 스트리밍 응답 생성기 ====
def stream_answer(question: str):
    qtype = classify_question(question)

    if "일반" in qtype:
        prompt = f"""
당신은 신뢰할 수 있는 금융 전문가입니다.
사용자의 질문에 대해 금융 지식과 경험을 바탕으로 명확하고 이해하기 쉬운 방식으로 설명해주세요.
질문: {question}
"""
    elif "뉴스" in qtype:
        metadata = search_news(question)
        context = get_news_context(metadata)
        if not context:
            yield "관련된 뉴스가 없어 분석을 진행할 수 없습니다."
            return
        prompt = f"""
당신은 신뢰할 수 있는 금융 전문가입니다.
다음은 사용자 질문과 관련된 뉴스들입니다.

[질문]
{question}

[뉴스 문서]
{context}

[요청]
- 위 뉴스들을 분석하여 질문에 대해 명확히 답변해 주세요.
- 단순 요약이 아닌, 뉴스 흐름속에서 의미 있는 변화나 주요 포인트를 중심으로 설명해 주세요.
- 5~10줄 이내로, 흐름과 맥락을 담아 설명해 주세요.
"""
    else:
        yield "질문 분류에 실패했습니다."
        return

    # Streaming LLM 호출
    stream = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        stream=True
    )

    for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield delta.content



# API 라우터 설정
@router.post("/ask")
def ask_chatbot(input: ChatInput):
    return StreamingResponse(stream_answer(input.question), media_type="text/plain")
