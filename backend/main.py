from fastapi import FastAPI
from pydantic import BaseModel
from groq import Groq
import os
from dotenv import load_dotenv
import json
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from youtube_transcript_api import YouTubeTranscriptApi
import re

# Load environment variables
load_dotenv()

app = FastAPI()

# -----------------------------
# CORS (Allow frontend connection)
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# -----------------------------
# REQUEST MODELS
# -----------------------------

class Question(BaseModel):
    question: str

class PlannerRequest(BaseModel):
    subjects: str
    syllabus: str
    exam_date: str
    hours_per_day: int

class NotesRequest(BaseModel):
    topic: str
    content: str = ""

class YoutubeRequest(BaseModel):
    url: str


# -----------------------------
# ROOT
# -----------------------------

@app.get("/")
def home():
    return {"message": "AI StudyOS Backend Running 🚀"}


# =====================================================
# 🧠 1️⃣ DOUBT SOLVER
# =====================================================

@app.post("/solve-doubt")
def solve_doubt(data: Question):

    prompt = f"""
You are an expert academic tutor.

Explain the following topic or question in a clear, structured, and educational way.

Topic:
{data.question}

You MUST respond strictly in valid JSON format:

{{
  "summary": "Concise explanation of the topic",
  "step_by_step": "Logical breakdown of the concept in steps (even for theoretical topics)",
  "example": "Give one clear practical or real-world example",
  "key_takeaway": "Main core idea or concept students must remember"
}}

Rules:
- ALWAYS fill all four fields.
- Even if the topic is theoretical, create logical step-by-step explanation.
- Always include an example.
- Do NOT leave any field empty.
- Do NOT include any text outside the JSON.
"""

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.6,
    )

    raw_output = completion.choices[0].message.content

    try:
        structured_output = json.loads(raw_output)
    except:
        structured_output = {
            "summary": raw_output,
            "step_by_step": "",
            "example": "",
            "key_takeaway": ""
        }

    return {"explanation": structured_output}


# =====================================================
# 📅 2️⃣ SMART EXAM PLANNER
# =====================================================

@app.post("/generate-plan")
def generate_plan(data: PlannerRequest):

    today = datetime.today()
    exam = datetime.strptime(data.exam_date, "%Y-%m-%d")
    remaining_days = (exam - today).days

    if remaining_days <= 0:
        return {"error": "Exam date must be in the future"}

    prompt = f"""
You are an intelligent academic planner.

Subjects: {data.subjects}
Syllabus Topics: {data.syllabus}
Remaining Days: {remaining_days}
Study Hours Per Day: {data.hours_per_day}

Create a smart, balanced study plan.

Respond ONLY in valid JSON format:

{{
  "plan": [
    {{ "day": 1, "task": "Study Algebra" }},
    {{ "day": 2, "task": "Practice Calculus" }}
  ]
}}
"""

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.6,
    )

    raw_output = completion.choices[0].message.content

    try:
        return json.loads(raw_output)
    except:
        return {"plan": [{"day": 1, "task": raw_output}]}


# =====================================================
# 📝 3️⃣ SMART REVISION NOTES
# =====================================================

@app.post("/generate-notes-ai")
def generate_notes_ai(data: NotesRequest):

    prompt = f"""
You are an expert academic assistant.

Topic: {data.topic}

Additional Content:
{data.content}

Generate structured revision notes.

Respond ONLY in valid JSON format:

{{
  "notes": {{
    "summary": "Short paragraph summary",
    "key_points": ["Point 1", "Point 2", "Point 3"],
    "formulas": ["Formula 1 (if applicable)", "Formula 2 (if applicable)"]
  }}
}}
"""

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
    )

    raw_output = completion.choices[0].message.content

    try:
        structured_output = json.loads(raw_output)
    except:
        structured_output = {
            "notes": {
                "summary": raw_output,
                "key_points": [],
                "formulas": []
            }
        }

    return structured_output


# =====================================================
# 🎥 4️⃣ YOUTUBE AI SUMMARIZER
# =====================================================

@app.post("/summarize-youtube")
def summarize_youtube(data: YoutubeRequest):

    import glob
    import yt_dlp

    video_id_match = re.search(r"(?:v=|youtu\.be/)([a-zA-Z0-9_-]{11})", data.url)
    if not video_id_match:
        return {"error": "Invalid YouTube URL"}

    video_id = video_id_match.group(1)

    # ----------------------------
    # 1️⃣ Download Audio
    # ----------------------------
    try:
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': f'{video_id}.%(ext)s',
            'quiet': True,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '128',  # Lower quality to reduce size
            }],
            'postprocessor_args': [
                '-t', '600'  # Limit to first 600 seconds (10 minutes)
            ]
    }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([data.url])

    except Exception as e:
        return {"error": f"Audio download failed: {str(e)}"}

    # ----------------------------
    # 2️⃣ Find Generated MP3
    # ----------------------------
    audio_files = glob.glob(f"{video_id}*.mp3")

    if not audio_files:
        return {"error": "Audio file not found after download"}

    audio_filename = audio_files[0]

    # ----------------------------
    # 3️⃣ Transcribe
    # ----------------------------
    try:
        with open(audio_filename, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                file=audio_file,
                model="whisper-large-v3-turbo"
            )

        transcript_text = transcription.text[:8000]

    except Exception as e:
        return {"error": f"Transcription failed: {str(e)}"}

    # ----------------------------
    # 4️⃣ Summarize
    # ----------------------------
    prompt = f"""
Summarize this transcript clearly.

{transcript_text}

Respond ONLY in JSON:

{{
  "summary": "...",
  "key_points": ["Point 1"],
  "takeaways": ["Takeaway 1"]
}}
"""

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
    )

    raw_output = completion.choices[0].message.content

    try:
        structured_output = json.loads(raw_output)
    except:
        structured_output = {
            "summary": raw_output,
            "key_points": [],
            "takeaways": []
        }

    # ----------------------------
    # 5️⃣ Cleanup
    # ----------------------------
    try:
        os.remove(audio_filename)
    except:
        pass

    return structured_output