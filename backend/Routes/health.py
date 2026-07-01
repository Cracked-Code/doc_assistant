from fastapi import APIRouter, Depends, Request


router = APIRouter()

@router.get("/health", methods=["GET", "HEAD"])
def health():
    return {"status":"ok"}