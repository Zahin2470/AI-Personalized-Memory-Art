from fastapi import APIRouter, HTTPException
from app.schemas import MemoryAnalysisRequest, MemoryAnalysisResponse
from app.services.grok_client import grok_client, GrokAPIError
from app.services.emotion import palette_for, allowed_emotions

router = APIRouter(prefix='/analyze', tags=['analyze'])

SYSTEM_PROMPT = f"""You are the memory-analysis engine for a personalized memory-art
platform. Given a description of a personal memory (and optionally photos and
important dates), respond with STRICT JSON only, matching this exact shape:

{{
  "emotion": one of {allowed_emotions()},
  "story": "a warm, 2-4 sentence narrative capturing this memory, written in second person",
  "suggested_titles": ["3 short evocative title options, each under 6 words"],
  "tags": ["4-6 short lowercase keyword tags"]
}}

Pick the single closest emotion from the allowed list. Do not include any text
outside the JSON object."""


@router.post('', response_model=MemoryAnalysisResponse)
async def analyze_memory(payload: MemoryAnalysisRequest):
    # Build multimodal content: text description + optional images.
    # Grok's vision-capable chat models accept OpenAI-style image_url parts.
    content: list[dict] = [
        {
            'type': 'text',
            'text': (
                f'Memory description: {payload.description}\n'
                f'Location: {payload.location or "not specified"}\n'
                f'Dates: {[d.model_dump() for d in payload.dates] or "not specified"}'
            ),
        }
    ]
    for url in payload.photo_urls[:6]:  # cap to keep the request reasonably sized
        content.append({'type': 'image_url', 'image_url': {'url': url}})

    try:
        result = await grok_client.chat_json(SYSTEM_PROMPT, content)
    except GrokAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    emotion = result.get('emotion', 'nostalgia')

    return MemoryAnalysisResponse(
        emotion=emotion,
        color_palette=palette_for(emotion),
        suggested_titles=result.get('suggested_titles', []),
        story=result.get('story', ''),
        tags=result.get('tags', []),
    )
