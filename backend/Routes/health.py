from fastapi import APIRouter, Depends, Request


router = APIRouter()

@router.get("/health")
def health():
    return {"status":"ok"}