from fastapi import FastAPI
from dotenv import load_dotenv
from routers import home, summary, portfolio, chatbot
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000",
                   "http://13.125.217.65",               # 배포된 FE 주소
                   "http://13.125.217.65:80"],  # React 개발 서버 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(home.router, prefix="/api", tags=["Home"])
app.include_router(summary.router, prefix="/api/summary", tags=["Summary"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["Portfolio"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["Chatbot"])