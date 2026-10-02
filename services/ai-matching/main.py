from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import re
import json

app = FastAPI(title="HireFlow AI Matching Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Skills Dictionary ─────────────────────────────────────────────────────────
SKILLS_DB = [
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust",
    "ruby", "php", "swift", "kotlin", "dart", "scala", "r",
    "react", "angular", "vue", "svelte", "nextjs", "nuxt", "gatsby",
    "nodejs", "express", "fastapi", "django", "flask", "spring", "rails",
    "nestjs", "fastify",
    "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
    "opensearch", "cassandra", "dynamodb", "firebase",
    "docker", "kubernetes", "aws", "gcp", "azure", "terraform",
    "ci/cd", "jenkins", "github actions", "gitlab",
    "git", "linux", "rest", "graphql", "grpc", "websocket",
    "machine learning", "deep learning", "nlp", "computer vision",
    "tensorflow", "pytorch", "pandas", "numpy", "scikit-learn",
    "figma", "sketch", "photoshop", "illustrator",
    "agile", "scrum", "kanban", "jira",
    "html", "css", "sass", "tailwind",
    "flutter", "react native", "ionic",
]

# ─── Models ────────────────────────────────────────────────────────────────────

class MatchRequest(BaseModel):
    resume_text: str
    job_description: str

class ResumeParseRequest(BaseModel):
    resume_text: str

class ParsedResume(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = []
    experience_years: int = 0
    education: Optional[str] = None
    headline: Optional[str] = None

# ─── Utility Functions ─────────────────────────────────────────────────────────

def extract_email(text: str) -> Optional[str]:
    match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    return match.group(0) if match else None

def extract_phone(text: str) -> Optional[str]:
    match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
    return match.group(0) if match else None

def extract_name(text: str) -> Optional[str]:
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines[:3]:
        words = line.split()
        if 2 <= len(words) <= 4 and all(w[0].isupper() for w in words if w.isalpha()):
            email_in_line = re.search(r'@', line)
            if not email_in_line:
                return line
    return None

def extract_skills(text: str) -> List[str]:
    lower = text.lower()
    found = []
    for skill in SKILLS_DB:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, lower):
            found.append(skill)
    return found

def extract_experience_years(text: str) -> int:
    patterns = [
        r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)',
        r'experience\s*:?\s*(\d+)\+?\s*(?:years?|yrs?)',
    ]
    for pat in patterns:
        match = re.search(pat, text.lower())
        if match:
            return int(match.group(1))
    return 0

def extract_education(text: str) -> Optional[str]:
    edu_keywords = ['b.tech', 'btech', 'b.e', 'b.sc', 'bsc', 'm.tech', 'mtech',
                    'm.sc', 'msc', 'mba', 'bca', 'mca', 'phd', 'bachelor',
                    'master', 'diploma', 'b.com', 'bcom']
    lower = text.lower()
    for kw in edu_keywords:
        if kw in lower:
            return kw.upper()
    return None

def compute_skill_match(resume_skills: List[str], job_skills: List[str]) -> float:
    if not job_skills:
        return 0.0
    rs = set(s.lower() for s in resume_skills)
    js = set(s.lower() for s in job_skills)
    overlap = rs & js
    return round(len(overlap) / len(js), 2) if js else 0.0

# ─── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "hireflow-ai-matching"}

@app.post("/parse-resume", response_model=ParsedResume)
def parse_resume(req: ResumeParseRequest):
    text = req.resume_text
    return ParsedResume(
        name=extract_name(text),
        email=extract_email(text),
        phone=extract_phone(text),
        skills=extract_skills(text),
        experience_years=extract_experience_years(text),
        education=extract_education(text),
        headline=None,
    )

@app.post("/match")
def compute_match(req: MatchRequest):
    resume_skills = extract_skills(req.resume_text)
    job_skills = extract_skills(req.job_description)

    skill_score = compute_skill_match(resume_skills, job_skills)
    resume_yoe = extract_experience_years(req.resume_text)

    # Simple composite score — weighted: 70% skill match + 30% experience signal
    exp_signal = min(resume_yoe / 10.0, 1.0) * 0.3
    score = round(skill_score * 0.7 + exp_signal, 2)

    return {
        "score": score,
        "skill_score": skill_score,
        "resume_skills": resume_skills,
        "job_skills": job_skills,
        "skills_overlap": list(set(s.lower() for s in resume_skills) & set(s.lower() for s in job_skills)),
        "experience_years": resume_yoe,
        "match": score >= 0.3,
    }

# ─── Interview Question Generation ─────────────────────────────────────────────

class InterviewQRequest(BaseModel):
    job_title: str
    skills: List[str] = []
    seniority: Optional[str] = None
    candidate_skills: List[str] = []
    focus_areas: List[str] = []

QUESTION_TEMPLATES = {
    "technical": [
        "Walk me through how you would design a {skill}-based system at scale.",
        "What are the key trade-offs when choosing {skill} over alternatives?",
        "Describe a challenging bug you've encountered with {skill}. How did you debug it?",
        "How would you implement a CI/CD pipeline for a {skill} project?",
        "Can you explain the architecture of a system you built using {skill}?",
        "What best practices do you follow when working with {skill}?",
        "How do you handle testing in {skill}? What coverage strategy do you use?",
        "Describe your experience with {skill} performance optimization.",
    ],
    "behavioral": [
        "Tell me about a time you had to learn {skill} quickly for a project.",
        "Describe a situation where you disagreed with your team on a technical decision.",
        "How do you prioritize tasks when working on multiple features simultaneously?",
        "Tell me about a project that failed and what you learned from it.",
        "How do you mentor junior developers on your team?",
        "Describe a time when you had to make a difficult trade-off between speed and quality.",
        "How do you stay current with new developments in {skill}?",
    ],
    "system_design": [
        "Design a real-time notification system using {skill}.",
        "How would you architect a multi-tenant SaaS platform?",
        "Design an API rate limiter that handles 100K+ requests per second.",
        "How would you design a search system similar to Elasticsearch?",
        "Walk me through designing a distributed cache layer.",
        "Design a job queue system that handles retries and dead letters.",
    ],
    "culture_fit": [
        "What does an ideal engineering culture look like to you?",
        "How do you handle receiving critical feedback on your code?",
        "What's your approach to documentation? How important is it?",
        "Tell me about a time you went above and beyond for a teammate.",
        "What motivates you most in your work?",
    ],
}

SENIORITY_CATEGORIES = {
    "INTERN": ["technical", "behavioral"],
    "JUNIOR": ["technical", "behavioral"],
    "MID": ["technical", "behavioral", "system_design"],
    "SENIOR": ["technical", "system_design", "behavioral", "culture_fit"],
    "LEAD": ["system_design", "behavioral", "culture_fit", "technical"],
    "PRINCIPAL": ["system_design", "culture_fit", "technical", "behavioral"],
}

@app.post("/generate-questions")
def generate_interview_questions(req: InterviewQRequest):
    import random

    seniority = (req.seniority or "MID").upper()
    categories = SENIORITY_CATEGORIES.get(seniority, ["technical", "behavioral"])
    skills = req.skills or ["the relevant technology"]

    questions = []
    used = set()

    # Generate questions per category
    for category in categories:
        templates = QUESTION_TEMPLATES.get(category, [])
        count = 3 if category == categories[0] else 2
        available = [t for t in templates if t not in used]
        random.shuffle(available)
        for template in available[:count]:
            skill = random.choice(skills) if skills else "the technology"
            q = template.replace("{skill}", skill)
            questions.append({
                "question": q,
                "category": category.replace("_", " ").title(),
                "difficulty": {"INTERN": "Easy", "JUNIOR": "Easy", "MID": "Medium", "SENIOR": "Hard", "LEAD": "Hard", "PRINCIPAL": "Expert"}.get(seniority, "Medium"),
                "time_estimate": "3-5 min" if category == "behavioral" else "5-10 min",
                "follow_ups": [
                    f"How would the approach differ at 10x scale?",
                    f"What metrics would you track to measure success?",
                ],
            })
            used.add(template)

    # Add a skill-gap question if candidate skills don't cover all job skills
    if req.candidate_skills:
        gaps = [s for s in req.skills if s.lower() not in [c.lower() for c in req.candidate_skills]]
        for gap in gaps[:2]:
            questions.append({
                "question": f"Your resume doesn't mention {gap}. How would you approach ramping up on {gap} quickly?",
                "category": "Skill Gap",
                "difficulty": "Medium",
                "time_estimate": "3-5 min",
                "follow_ups": [f"What transferable skills do you have that would help with {gap}?"],
            })

    return {
        "job_title": req.job_title,
        "seniority": seniority,
        "total_questions": len(questions),
        "estimated_duration": f"{len(questions) * 5}-{len(questions) * 8} min",
        "questions": questions,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

