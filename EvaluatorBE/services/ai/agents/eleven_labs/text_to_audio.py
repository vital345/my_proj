import requests
import os
from dotenv import load_dotenv
load_dotenv()


def convert_text_to_audio(text):
    BASE_URL = "https://api.elevenlabs.io/v1"
    api_key = os.getenv("ELEVEN_LABS_API_KEY")
    voice_id = os.getenv("ELEVEN_LABS_VOICE_ID")
    
    headers = {
        "Content-Type": "application/json",
        "xi-api-key": api_key
    }
    
    payload = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0.75,
            "similarity_boost": 0.75
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/text-to-speech/{voice_id}",
        headers=headers,
        json=payload
    )
    
    if response.status_code == 200:
        return response.content
    else:
        raise Exception(f"Error: {response.status_code} - {response.text}")
