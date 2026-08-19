# Spidy AI - Superhero Production AI Assistant Platform 🕷️⚡

**Spidy** is an enterprise-ready, superhero-inspired AI assistant platform built with a high-performance **Next.js 14** frontend, **FastAPI** Python backend, dual **SQLite/PostgreSQL** database support, multi-provider LLM intelligence (Gemini, OpenAI, Claude, Ollama), vector memory, document RAG, vision OCR, voice speech capabilities, and specialized productivity suites (ATS Resume Reviewer, Python Debugger, SQL Generator, Educational Investment Assistant, and News Feed).

![Spidy Logo Avatar](./frontend/public/spidy_avatar.jpg)

---

## Key Features & Highlights

- 🎨 **Red & Black Superhero Aesthetics**: Glassmorphism, translucent red neon accents, spider-web matrix pattern background, dynamic Framer Motion animations, dark mode theme.
- 🤖 **Spidy Superhero Persona**: Friendly, witty, encouraging, and intelligent assistant specializing in Python coding, SQL optimization, data science, career guidance, and study planning.
- ⚡ **Multi-LLM Provider Engine**:
  - Google Gemini 1.5 Flash
  - OpenAI GPT-4o
  - Anthropic Claude 3.5 Sonnet
  - Offline Ollama Local LLM fallback
- 💬 **Advanced Chat Experience**:
  - Real-time streaming token response (WebSockets & REST)
  - Rich Markdown rendering with code block syntax highlighting & copy buttons
  - Chat thread history management, pinning, search, and deletion
- 📄 **Document AI & RAG**: Upload `.pdf`, `.docx`, `.csv`, `.xlsx`, `.pptx`, `.txt` for automatic text/table parsing and instant AI summaries.
- 👁️ **Vision Studio & OCR**: Generate AI superhero artwork, perform pytesseract OCR text extraction, and analyze uploaded image elements.
- 🎤 **Voice Speech Interface**: Real-time STT (Speech-To-Text) and TTS (Text-To-Speech) voice mode with glowing audio indicator.
- 🛠️ **Special AI Productivity Tools Suite**:
  - **ATS Resume Reviewer & Scoring**
  - **Interview Simulator (STAR model answers)**
  - **Python Debugger & Refactoring Engine**
  - **SQL Query Generator & Index Optimizer**
  - **Study Planner & Flashcard Generator**
  - **Educational Investment & Portfolio Diversification Assistant**
- 📰 **Daily Intelligence Feed**: Aggregated news on AI, Programming, Science, Crypto, and Weather.
- 🔒 **Enterprise Security**: JWT Authentication, Bcrypt Password Hashing, Input Sanitization, Rate Limiting, and CORS protection.

---

## One-Command Local Docker Setup

Run the full platform (Frontend, FastAPI Backend, PostgreSQL DB, Redis Cache) with Docker Compose:

```bash
docker-compose up --build
```

Access the applications:
- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Interactive Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Quick Manual Local Setup (Zero-Config)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

---

## Project Structure Overview

```
spidy-app/
├── frontend/                     # Next.js 14 Web Application
│   ├── app/                      # App Router (Dashboard, Login, Signup)
│   ├── components/               # Navbar, Sidebar, ChatArea, ToolsArea, DocStudio, ImageStudio, NewsFeed, ProfileModal
│   ├── hooks/ & lib/             # Axios API Client & State Hooks
│   └── public/                   # Spidy Superhero Avatar Logo
├── backend/                      # FastAPI Python Backend
│   ├── app/
│   │   ├── api/                  # Auth, Chat, Tools, Docs, Images, News Routers
│   │   ├── core/                 # Config & Security
│   │   ├── db/                   # Async SQLAlchemy Session & Models
│   │   ├── models/ & schemas/    # Database Models & Pydantic Validation
│   │   └── services/             # LLM Router, Document Service, Image Service, Tools Engine
│   ├── requirements.txt
│   └── Dockerfile
├── database/
├── tests/                        # Backend PyTest Test Suite
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## License

Built with ❤️ for superhero developers worldwide.
