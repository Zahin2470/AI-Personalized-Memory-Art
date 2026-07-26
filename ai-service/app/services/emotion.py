# Curated hex palettes per emotion. We ask Grok to classify the memory into
# one of these labels rather than freehand hex codes, so the result is always
# a designed, coherent palette instead of whatever the model improvises.

EMOTION_PALETTES: dict[str, list[str]] = {
    'joy': ['#FFC93C', '#FF9F45', '#FFD93D', '#FF6B6B'],
    'nostalgia': ['#D8C3A5', '#8E8D8A', '#E98074', '#E85A4F'],
    'celebration': ['#F72585', '#7209B7', '#3A0CA3', '#4CC9F0'],
    'peace': ['#A8DADC', '#457B9D', '#1D3557', '#F1FAEE'],
    'love': ['#FF758F', '#FF8FA3', '#FFB3C1', '#FFCAD4'],
    'adventure': ['#264653', '#2A9D8F', '#E9C46A', '#F4A261'],
    'gratitude': ['#606C38', '#283618', '#DDA15E', '#BC6C25'],
    'bittersweet': ['#6D6875', '#B5838D', '#E5989B', '#FFB4A2'],
}

DEFAULT_EMOTION = 'nostalgia'


def palette_for(emotion: str) -> list[str]:
    return EMOTION_PALETTES.get(emotion.lower().strip(), EMOTION_PALETTES[DEFAULT_EMOTION])


def allowed_emotions() -> list[str]:
    return list(EMOTION_PALETTES.keys())
