from fastapi import APIRouter, HTTPException
from app.schemas import ArtworkGenerationRequest, ArtworkGenerationResponse
from app.services.grok_client import grok_client, GrokAPIError
from app.services.image import build_artwork_prompt
from app.services.storage import rehost_image
from app.config import settings

router = APIRouter(prefix='/artwork', tags=['artwork'])


@router.post('/generate', response_model=ArtworkGenerationResponse)
async def generate_artwork(payload: ArtworkGenerationRequest):
    prompt = build_artwork_prompt(payload.description, payload.style, payload.emotion, payload.location)

    try:
        temp_url = await grok_client.generate_image(prompt)
    except GrokAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    hosted = rehost_image(temp_url)

    return ArtworkGenerationResponse(
        image_url=hosted['url'],
        thumbnail_url=hosted['thumbnail_url'],
        prompt_used=prompt,
        model=settings.grok_image_model,
    )
