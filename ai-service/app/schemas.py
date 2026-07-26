from typing import List, Optional
from pydantic import BaseModel, Field


class DateEntry(BaseModel):
    label: Optional[str] = None
    date: Optional[str] = None


class MemoryAnalysisRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=2000)
    photo_urls: List[str] = Field(default_factory=list, description='Must be publicly reachable URLs')
    location: Optional[str] = None
    dates: List[DateEntry] = Field(default_factory=list)


class MemoryAnalysisResponse(BaseModel):
    emotion: str
    color_palette: List[str]
    suggested_titles: List[str]
    story: str
    tags: List[str]


class ArtworkGenerationRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=2000)
    style: str = Field(..., description='watercolor | minimalist | oil_painting | pencil_sketch | vintage_poster | pop_art | abstract_collage')
    emotion: Optional[str] = None
    location: Optional[str] = None
    title: Optional[str] = None


class ArtworkGenerationResponse(BaseModel):
    image_url: str
    thumbnail_url: Optional[str] = None
    prompt_used: str
    model: str


class StoryTimelineEntry(BaseModel):
    label: Optional[str] = None
    date: Optional[str] = None
    description: str


class TimelineRequest(BaseModel):
    entries: List[StoryTimelineEntry] = Field(..., min_length=1)


class TimelineResponse(BaseModel):
    narrative: str
    ordered_entries: List[StoryTimelineEntry]


class TranscribeRequest(BaseModel):
    audio_url: str = Field(..., description='Publicly reachable URL to the voice note (Cloudinary etc.)')
    language: str = Field(default='en', description='ISO language code; Grok STT auto-detects if unsure')


class TranscribeResponse(BaseModel):
    text: str
    language: Optional[str] = None
    duration: Optional[float] = None
