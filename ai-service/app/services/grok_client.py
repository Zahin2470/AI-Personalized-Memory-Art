import json
import httpx
from app.config import settings


class GrokAPIError(Exception):
    pass


class GrokClient:
    """
    Wraps the two Grok endpoints we use:
      - POST /chat/completions  -> text + vision (emotion detection, stories, titles)
      - POST /images/generations -> text-to-image

    Both are OpenAI-SDK-compatible, but this uses raw httpx so the service
    has no hard dependency on the openai package.
    """

    def __init__(self):
        if not settings.xai_api_key:
            # We don't raise here so the service can still boot (e.g. for
            # local frontend/backend development before a key is set), but
            # every call below will fail fast with a clear message.
            pass
        self._client = httpx.AsyncClient(
            base_url=settings.xai_base_url,
            headers={
                'Authorization': f'Bearer {settings.xai_api_key}',
                'Content-Type': 'application/json',
            },
            timeout=60.0,
        )

    async def close(self):
        await self._client.aclose()

    async def chat_json(self, system_prompt: str, user_content, model: str | None = None) -> dict:
        """
        Calls chat/completions and asks the model to return strict JSON.
        `user_content` can be a plain string, or a list of OpenAI-style
        content parts (for multimodal requests with image_url entries).
        Returns the parsed JSON dict.
        """
        if not settings.xai_api_key:
            raise GrokAPIError('XAI_API_KEY is not set. Add it to ai-service/.env')

        payload = {
            'model': model or settings.grok_text_model,
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_content},
            ],
            'temperature': 0.7,
            'response_format': {'type': 'json_object'},
        }

        resp = await self._client.post('/chat/completions', json=payload)
        if resp.status_code != 200:
            raise GrokAPIError(f'Grok chat completion failed ({resp.status_code}): {resp.text}')

        data = resp.json()
        raw_text = data['choices'][0]['message']['content']

        try:
            return json.loads(raw_text)
        except json.JSONDecodeError as exc:
            raise GrokAPIError(f'Grok did not return valid JSON: {raw_text[:500]}') from exc

    async def generate_image(self, prompt: str, model: str | None = None) -> str:
        """Returns the xAI-hosted URL of the generated image."""
        if not settings.xai_api_key:
            raise GrokAPIError('XAI_API_KEY is not set. Add it to ai-service/.env')

        payload = {
            'model': model or settings.grok_image_model,
            'prompt': prompt,
        }

        resp = await self._client.post('/images/generations', json=payload)
        if resp.status_code != 200:
            raise GrokAPIError(f'Grok image generation failed ({resp.status_code}): {resp.text}')

        data = resp.json()
        try:
            return data['data'][0]['url']
        except (KeyError, IndexError) as exc:
            raise GrokAPIError(f'Unexpected image generation response shape: {data}') from exc


    async def transcribe(self, audio_bytes: bytes, filename: str, language: str = 'en') -> dict:
        """
        Calls xAI's Speech-to-Text endpoint. Unlike chat/images, this is a
        plain multipart/form-data upload (not JSON), and per xAI's docs the
        `file` field must be the last part in the form - httpx satisfies
        that automatically when `data` and `files` are passed together.
        """
        if not settings.xai_api_key:
            raise GrokAPIError('XAI_API_KEY is not set. Add it to ai-service/.env')

        # A separate client without the JSON content-type default header,
        # since multipart needs its own boundary-bearing content-type.
        async with httpx.AsyncClient(
            base_url=settings.xai_base_url,
            headers={'Authorization': f'Bearer {settings.xai_api_key}'},
            timeout=120.0,
        ) as client:
            resp = await client.post(
                '/stt',
                data={'format': 'true', 'language': language},
                files={'file': (filename, audio_bytes)},
            )

        if resp.status_code != 200:
            raise GrokAPIError(f'Grok transcription failed ({resp.status_code}): {resp.text}')

        return resp.json()


grok_client = GrokClient()
