from fastapi import APIRouter, Depends, Request


router = APIRouter()

@router.api_route("/health", methods=["GET", "HEAD"])
def health():
    return {"status": "ok"}