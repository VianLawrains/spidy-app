import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.main import app
from app.services.llm_router import llm_router

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "Spidy" in data["app"]

def test_news_feed():
    response = client.get("/api/v1/news/feed?category=all")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

@pytest.mark.asyncio
async def test_prompts_dynamic_ai_answers():
    # Test 1: Math calculation
    res1 = await llm_router.generate_response([{"role": "user", "content": "What is 2+2?"}])
    assert "4" in res1

    # Test 2: Python decorators
    res2 = await llm_router.generate_response([{"role": "user", "content": "Explain Python decorators."}])
    assert "decorator" in res2.lower()

    # Test 3: Joke prompt
    res3 = await llm_router.generate_response([{"role": "user", "content": "Tell me a joke."}])
    assert "web development" in res3.lower() or "joke" in res3.lower()
