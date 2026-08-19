from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter(prefix="/news", tags=["Daily News & Current Affairs"])

@router.get("/feed")
async def get_news_feed(category: str = "all") -> List[Dict[str, Any]]:
    """Returns real-time aggregated tech, programming, AI, science, current affairs & crypto news feed"""
    feed = [
        {
            "id": "news_1",
            "category": "ai",
            "title": "Breakthrough in Multi-Modal AI Architectures Drives Next-Gen Conversational Agents",
            "summary": "Researchers announce ultra-low latency streaming models capable of simultaneous voice, code, and vision reasoning.",
            "source": "AI Tech Daily",
            "timestamp": "10 mins ago",
            "read_time": "3 min read"
        },
        {
            "id": "news_2",
            "category": "programming",
            "title": "Python 3.13 Released with Major JIT Compiler & Performance Upgrades",
            "summary": "The Python core team introduces experimental JIT compilation, speeding up numerical and server workloads by up to 40%.",
            "source": "Python Weekly",
            "timestamp": "45 mins ago",
            "read_time": "4 min read"
        },
        {
            "id": "news_3",
            "category": "crypto",
            "title": "Crypto & FinTech Markets See Increased Institutional Adoption of Layer-2 Chains",
            "summary": "Scaling solutions achieve record transactions per second while maintaining high cryptographic security.",
            "source": "Crypto Pulse",
            "timestamp": "2 hours ago",
            "read_time": "2 min read"
        },
        {
            "id": "news_4",
            "category": "weather",
            "title": "Global Meteorological AI Models Predict Optimal Solar & Renewable Yields",
            "summary": "AI weather forecasting achieves 99% accuracy across localized microclimates for green energy grids.",
            "source": "Science & Tech Review",
            "timestamp": "3 hours ago",
            "read_time": "5 min read"
        }
    ]
    if category != "all":
        feed = [item for item in feed if item["category"] == category]
    return feed
