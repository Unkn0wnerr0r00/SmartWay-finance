from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from typing import Optional
import os
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
import json
import boto3
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

def get_news_filename(date: str = None) -> str:
    
    if date is None:
        date = datetime.today().strftime("%Y-%m-%d")
    return f"{os.environ['AWS_S3_PREFIX']}/cleaned_news_{date}.json"

def load_news_from_s3(date: str = None) -> list:
    
    s3 = boto3.client(
        "s3",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"]
    )

    key = get_news_filename(date)

    try:
        response = s3.get_object(Bucket=os.environ["AWS_S3_BUCKET"], Key=key)
        content = response["Body"].read().decode("utf-8")
        return json.loads(content)
    except Exception as e:
        print(f"[ERROR] S3 로딩 실패 ({key}): {e}")
        return []

def build_context(news_list, max_items=100):
    chunks = []
    for news in news_list[:max_items]:
        title = news.get("title", "")
        content = news.get("cleaned_content", "")
        chunks.append(f"- 제목: {title}\n  본문: {content}")
    return "\n\n".join(chunks)

summary_prompt = PromptTemplate.from_template("""
다음은 오늘의 한국 금융 관련 뉴스들입니다.  
중복되거나 중요하지 않은 것은 제거하고,  
가장 중요한 내용 5가지 항목으로 요약해주세요.

{context}
""")

def summarize_with_gpt(context):
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)
    prompt = summary_prompt.format(context=context)
    result = llm.predict(prompt)
    return result

def summarize_today_news(date:str = None):
    news_list = load_news_from_s3(date)
    if not news_list:
        print(len(news_list))
        return ["해당 날짜에 대한 뉴스 데이터가 없습니다"]

    context = build_context(news_list[:20])
    summary_text = summarize_with_gpt(context)

    # 줄바꿈 제거 + 번호 기준 나누기
    lines = summary_text.split("\n")
    cleaned = [line.strip() for line in lines if line.strip()]
    return cleaned




@router.get("/summary")
def get_summary(date: Optional[str] = Query(default=None, description="요약할 날짜 (YYYY-MM-DD)")):
    try:
        result = summarize_today_news(date)
        return {"summary": result}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
