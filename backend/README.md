# HelpDeskGenie – Backend API

FastAPI service powering the conversational IT Service Desk layer with LangGraph orchestration, RAG grounded responses, and human-in-the-loop checkpoints.

## Setup & Running Locally

1. Create a Python virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Launch the FastAPI server:
   ```bash
   uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. Interactive Swagger API documentation:
   Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser.
