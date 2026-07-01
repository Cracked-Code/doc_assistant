from Routes.health import router
from Routes.query import router2
from Routes.ingest import router1
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)
app.include_router(router1)
app.include_router(router2)
