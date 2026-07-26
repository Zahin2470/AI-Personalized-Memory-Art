from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

    xai_api_key: str = ''
    xai_base_url: str = 'https://api.x.ai/v1'
    grok_text_model: str = 'grok-4.5'
    grok_image_model: str = 'grok-imagine-image-quality'

    cloudinary_cloud_name: str = ''
    cloudinary_api_key: str = ''
    cloudinary_api_secret: str = ''

    port: int = 8000
    allowed_origins: str = 'http://localhost:5000'

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(',') if o.strip()]

    @property
    def cloudinary_configured(self) -> bool:
        return bool(self.cloudinary_cloud_name and self.cloudinary_api_key and self.cloudinary_api_secret)


settings = Settings()
