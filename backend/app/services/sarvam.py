import os
import httpx
import base64

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
SARVAM_URL = "https://api.sarvam.ai/text-to-speech" # Verify correct endpoint

import asyncio

async def generate_line_audio(client, line, headers, semaphore):
    async with semaphore:
        line = line.strip()
        if not line: return None
        
        # Determine Speaker
        speaker = "anushka" # Default (Alice)
        text_to_speak = line
        
        if line.startswith("Bob:"):
            speaker = "abhilash"
            text_to_speak = line.replace("Bob:", "").strip()
        elif line.startswith("Alice:"):
            speaker = "anushka"
            text_to_speak = line.replace("Alice:", "").strip()
        else:
            return None
        
        # Clean text
        text_to_speak = text_to_speak.replace("**", "").replace("*", "")
        if not text_to_speak: return None
        
        if len(text_to_speak) > 490:
            text_to_speak = text_to_speak[:490]

        payload = {
            "inputs": [text_to_speak],
            "target_language_code": "hi-IN",
            "speaker": speaker,
            "pitch": 0,
            "pace": 1.0,
            "loudness": 1.5,
            "speech_sample_rate": 8000,
            "enable_preprocessing": True,
            "model": "bulbul:v2"
        }

        for attempt in range(3):
            try:
                response = await client.post(SARVAM_URL, json=payload, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    if "audios" in data and len(data["audios"]) > 0:
                        return base64.b64decode(data["audios"][0])
                elif response.status_code == 429:
                    print(f"Rate limit hit for '{text_to_speak[:20]}...', retrying in 2s...")
                    await asyncio.sleep(2)
                    continue
                else:
                    print(f"Sarvam API Error: {response.status_code} - {response.text}")
                    return None
            except Exception as e:
                print(f"Request error: {e}")
                return None
        return None

async def generate_audio(script: str) -> bytes:
    if not SARVAM_API_KEY:
        print("Sarvam API Key not found.")
        return None

    try:
        lines = script.split('\n')
        
        headers = {
            "Content-Type": "application/json",
            "api-subscription-key": SARVAM_API_KEY
        }
        
        # Limit concurrency to 3 requests at a time to avoid rate limits
        semaphore = asyncio.Semaphore(3)

        async with httpx.AsyncClient(timeout=60.0) as client:
            tasks = [generate_line_audio(client, line, headers, semaphore) for line in lines if line.strip()]
            results = await asyncio.gather(*tasks)
            
        audio_segments = [res for res in results if res]

        if not audio_segments:
            return None

        # 3. Merge WAV files
        if len(audio_segments) == 1:
            return audio_segments[0]
            
        combined_audio = audio_segments[0]
        for segment in audio_segments[1:]:
            if len(segment) > 44:
                combined_audio += segment[44:]
        
        return combined_audio

    except Exception as e:
        print(f"Error generating audio with Sarvam: {e}")
        return None
