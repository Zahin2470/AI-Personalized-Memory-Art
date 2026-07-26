from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.services.grok_client import grok_client
from app.routers import analyze, artwork, timeline, transcribe


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await grok_client.close()


app = FastAPI(
    title='Memory Art - AI Service',
    description='Grok-powered emotion detection, story/title generation, and artwork generation.',
    version='1.0.0',
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(analyze.router)
app.include_router(artwork.router)
app.include_router(timeline.router)
app.include_router(transcribe.router)


@app.get('/health')
async def health():
    return {
        'success': True,
        'message': 'AI service is running',
        'xai_key_configured': bool(settings.xai_api_key),
        'cloudinary_configured': settings.cloudinary_configured,
    }
