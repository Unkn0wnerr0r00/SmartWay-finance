from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def home():
    return {"message": "금융 정보 서비스 백엔드 정상 작동 중"}
