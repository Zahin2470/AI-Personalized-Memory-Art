STYLE_DESCRIPTORS: dict[str, str] = {
    'watercolor': 'a soft watercolor painting with visible brush texture and gentle color bleed',
    'minimalist': 'a clean minimalist illustration with simple shapes, generous negative space, and a limited color palette',
    'oil_painting': 'a rich oil painting with visible brushstrokes and warm layered light',
    'pencil_sketch': 'a detailed graphite pencil sketch with fine linework and soft shading',
    'vintage_poster': 'a vintage travel-poster illustration with bold flat colors and retro typography-friendly composition',
    'pop_art': 'a bold pop-art illustration with high contrast colors and graphic outlines',
    'abstract_collage': 'an abstract mixed-media collage with layered textures and expressive shapes',
}


def build_artwork_prompt(description: str, style: str, emotion: str | None, location: str | None) -> str:
    style_desc = STYLE_DESCRIPTORS.get(style, STYLE_DESCRIPTORS['watercolor'])
    parts = [f'Create {style_desc}, illustrating this memory: {description.strip()}']

    if location:
        parts.append(f'Setting/location cues: {location.strip()}')
    if emotion:
        parts.append(f'Overall mood to convey: {emotion.strip()}')

    parts.append('No text, no watermark, no logos in the image. Focus on evocative scene composition.')
    return ' '.join(parts)
