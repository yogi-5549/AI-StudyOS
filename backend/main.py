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
# 🎥 4️⃣ YOUTUBE AI SUMMARIZER (Production Safe Version)
# =====================================================

@app.post("/summarize-youtube")
def summarize_youtube(data: YoutubeRequest):

    # ----------------------------
    # 1️⃣ Extract Video ID
    # ----------------------------
    video_id_match = re.search(r"(?:v=|youtu\.be/)([a-zA-Z0-9_-]{11})", data.url)
    if not video_id_match:
        return {"error": "Invalid YouTube URL"}

    video_id = video_id_match.group(1)

    # ----------------------------
    # 2️⃣ Fetch Transcript
    # ----------------------------
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

        # Try English transcript first
        try:
            transcript = transcript_list.find_transcript(['en'])
        except:
            # Fallback to auto-generated English transcript
            transcript = transcript_list.find_generated_transcript(['en'])

        transcript_data = transcript.fetch()
        transcript_text = " ".join([item['text'] for item in transcript_data])

        # Limit text length to avoid token overflow
        transcript_text = transcript_text[:8000]

    except Exception as e:
        return {
            "error": "No captions available for this video. Please try another video that has subtitles enabled."
        }

    # ----------------------------
    # 3️⃣ Summarize with LLM
    # ----------------------------
    prompt = f"""
You are an intelligent academic assistant.

Summarize the following YouTube transcript clearly and concisely.

Transcript:
{transcript_text}

Respond ONLY in valid JSON format:

{{
  "summary": "Clear summary of the video",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "takeaways": ["Takeaway 1", "Takeaway 2"]
}}

Rules:
- Always fill all fields.
- Do NOT include any text outside JSON.
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

    return structured_output