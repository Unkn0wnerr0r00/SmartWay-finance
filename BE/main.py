from fastapi import FastAPI
from dotenv import load_dotenv
from routers import home, summary, portfolio, chatbot
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 개발 서버 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(home.router, tags=["Home"])
app.include_router(summary.router, prefix="/summary", tags=["Summary"])
app.include_router(portfolio.router, prefix="/portfolio", tags=["Portfolio"])
app.include_router(chatbot.router, prefix="/chatbot", tags=["Chatbot"])
