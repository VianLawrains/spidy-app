from typing import Dict, Any
from app.services.llm_router import llm_router

class ToolsService:
    async def process_tool(self, tool_type: str, input_text: str, extra_params: Dict[str, Any] = None) -> str:
        if extra_params is None:
            extra_params = {}

        prompts = {
            "ats": f"Act as an expert ATS Resume Reviewer and recruiter. Perform a thorough evaluation of the following resume text. Provide an overall score out of 100, list top 3 strengths, 3 critical missing keywords, and 3 actionable formatting recommendations:\n\n{input_text}",
            "interview": f"Act as a Senior Principal Engineering Interviewer. Based on the topic/job description below, generate 3 challenging interview questions along with model STAR method answers:\n\n{input_text}",
            "python_debug": f"Act as a Python Expert Debugger. Inspect the code below, identify any bugs or memory/performance bottlenecks, and provide a fully refactored, production-ready Python solution:\n\n{input_text}",
            "sql_gen": f"Act as a Principal Database Engineer. Generate an optimized PostgreSQL/MySQL query based on the following requirement. Include EXPLAIN ANALYZE notes and index creation statements:\n\n{input_text}",
            "grammar": f"Act as a Senior Technical Editor. Proofread and polish the text below. Provide the corrected version and highlight key improvements made:\n\n{input_text}",
            "translate": f"Act as an expert translator. Translate the text below to {extra_params.get('target_lang', 'Spanish')} with native fluency and natural phrasing:\n\n{input_text}",
            "email": f"Act as a professional executive assistant. Draft a polished, concise business email regarding:\n\n{input_text}",
            "flashcards": f"Act as an educational coach. Create 4 study flashcards (Question & Answer format) for the topic below:\n\n{input_text}",
            "study_planner": f"Act as a master study mentor. Create a detailed 4-week learning plan with daily actionable milestones for:\n\n{input_text}",
            "investment": f"Act as an Educational Financial Analyst. Provide an educational analysis of asset classes, ETF diversification, risk management, and market trends for the query below. DO NOT guarantee profits or give licensed financial advice. Explicitly state that this is educational analysis:\n\n{input_text}",
        }

        system_instruction = prompts.get(tool_type, f"Process the following query as Spidy AI: {input_text}")
        messages = [{"role": "user", "content": system_instruction}]

        return await llm_router.generate_response(messages, model="gemini-flash")

tools_service = ToolsService()
