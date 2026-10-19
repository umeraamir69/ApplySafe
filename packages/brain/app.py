"""HTTP entry for the internal brain service.

Local scans still call predict() directly. On Vercel the web service posts
here through the BRAIN_URL binding.
"""

from fastapi import FastAPI
from pydantic import BaseModel, Field

from brain import VERSION, predict

app = FastAPI()


class ScoreBody(BaseModel):
    text: str = Field(default="", max_length=20_000)


@app.get("/health")
def health() -> dict:
    return {"ok": True, "version": VERSION}


@app.post("/score")
def score(body: ScoreBody) -> dict:
    return predict(body.text)
