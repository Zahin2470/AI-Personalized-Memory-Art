from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException
import httpx

from app.schemas import TranscribeRequest, TranscribeResponse
from app.services.grok_client import grok_client, GrokAPIError

router = APIRouter(prefix='/transcribe', tags=['transcribe'])


@router.post('', response_model=TranscribeResponse)
async def transcribe_voice_note(payload: TranscribeRequest):
    # Grok STT takes raw audio bytes (multipart), not a URL, so fetch the
    # file first - it must already be publicly reachable (Cloudinary etc.).
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            audio_resp = await client.get(payload.audio_url)
            audio_resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=400, detail=f'Could not fetch audio_url: {exc}') from exc

    filename = urlparse(payload.audio_url).path.rsplit('/', 1)[-1] or 'voice-note.mp3'

    try:
        result = await grok_client.transcribe(audio_resp.content, filename, payload.language)
    except GrokAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return TranscribeResponse(
        text=result.get('text', ''),
        language=result.get('language'),
        duration=result.get('duration'),
    )
