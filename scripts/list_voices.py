import requests
import json
import os

API_KEY = "sk_e5a86bede19e1884dba82b5cda1279f39db749afc8d1380b"

def list_voices():
    url = "https://api.elevenlabs.io/v1/voices"
    headers = {"xi-api-key": API_KEY}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        voices = response.json().get("voices", [])
        for v in voices:
            print(f"Name: {v['name']}, ID: {v['voice_id']}")
        return voices
    else:
        print(f"Error listing voices: {response.status_code}")
        return []

if __name__ == "__main__":
    list_voices()
