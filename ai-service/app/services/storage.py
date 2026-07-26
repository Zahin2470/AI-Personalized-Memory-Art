import cloudinary
import cloudinary.uploader
from app.config import settings


def _configure():
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )


def rehost_image(source_url: str, folder: str = 'memory-art/artworks') -> dict:
    """
    Uploads an image to Cloudinary by fetching it from `source_url` (Cloudinary
    downloads it server-side - we never pull the bytes through this service).
    Returns {"url": ..., "thumbnail_url": ..., "public_id": ...}.

    If Cloudinary isn't configured yet, falls back to returning the original
    (temporary) source URL so local development still works end-to-end.
    """
    if not settings.cloudinary_configured:
        return {'url': source_url, 'thumbnail_url': source_url, 'public_id': None}

    _configure()
    result = cloudinary.uploader.upload(source_url, folder=folder)

    thumbnail_url, _ = cloudinary.utils.cloudinary_url(
        result['public_id'],
        format=result.get('format'),
        width=400,
        height=400,
        crop='fill',
        secure=True,
    )

    return {
        'url': result['secure_url'],
        'thumbnail_url': thumbnail_url,
        'public_id': result['public_id'],
    }
