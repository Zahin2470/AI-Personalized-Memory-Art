from fastapi import APIRouter, HTTPException
from app.schemas import TimelineRequest, TimelineResponse
from app.services.grok_client import grok_client, GrokAPIError

router = APIRouter(prefix='/timeline', tags=['timeline'])

SYSTEM_PROMPT = """You are building a short connecting narrative across a
series of personal memories, ordered by date. Given a list of memories,
respond with STRICT JSON only, matching this shape:

{
  "narrative": "a warm 3-5 sentence story arc connecting these memories in order, written in second person"
}

Do not include any text outside the JSON object."""


@router.post('', response_model=TimelineResponse)
async def build_timeline(payload: TimelineRequest):
    # Sort chronologically where a date is present; undated entries go last, in original order.
    dated = [e for e in payload.entries if e.date]
    undated = [e for e in payload.entries if not e.date]
    ordered = sorted(dated, key=lambda e: e.date) + undated

    listing = '\n'.join(
        f'- {e.date or "undated"}: {e.label or ""} — {e.description}' for e in ordered
    )

    try:
        result = await grok_client.chat_json(SYSTEM_PROMPT, listing)
    except GrokAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return TimelineResponse(
        narrative=result.get('narrative', ''),
        ordered_entries=ordered,
    )
