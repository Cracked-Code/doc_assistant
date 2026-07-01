# Documentation Assistant

A full-stack RAG (Retrieval-Augmented Generation) pipeline that ingests any documentation URL or PDF and answers natural language questions grounded in the source content.

**Live Demo:** [doc-assistant-seven.vercel.app](https://doc-assistant-seven.vercel.app)

---

## What it does

1. Paste any documentation URL (e.g. React docs, FastAPI docs, Python docs) or upload a PDF
2. The backend scrapes/extracts, chunks, embeds, and stores the content in a vector database
3. Ask questions in plain English — the app retrieves the most relevant chunks and generates a grounded answer using Gemini

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python |
| LLM | Google Gemini (`gemini-2.5-flash`) |
| Embeddings | Google Gemini (`gemini-embedding-001`, 768 dimensions) |
| Vector DB | Supabase + pgvector |
| Scraping | BeautifulSoup, Requests, Playwright (local JS-rendered pages) |
| PDF Extraction | pdfplumber |
| Chunking | Paragraph + sentence hybrid (NLTK) |
| Deployment | Render (backend), Vercel (frontend) |

---

## Architecture

```
INDEXING (POST /ingest):
URL → Scrape → Chunk → Embed → Store in Supabase/pgvector

PDF INDEXING (POST /upload):
PDF File → Extract Text → Chunk → Embed → Store in Supabase/pgvector

QUERYING (POST /query):
Question → Embed → Similarity Search → Retrieved Chunks → Gemini → Answer
```

---

## API Endpoints

### `POST /ingest`
Scrapes a documentation URL and indexes its content.

**Request:**
```json
{ "url": "https://fastapi.tiangolo.com/tutorial/first-steps/" }
```

**Response:**
```json
{ "status": "success" }
```

### `POST /upload`
Accepts a PDF file upload, extracts text, and indexes its content.

**Request:** multipart/form-data with a `file` field containing the PDF.

**Response:**
```json
{ "status": "success" }
```

### `POST /query`
Answers a natural language question using retrieved documentation chunks.

**Request:**
```json
{ "query": "How do I create a FastAPI route?" }
```

**Response:**
```json
"To create a route in FastAPI, use a path operation decorator..."
```

### `GET /health`
Returns `{ "status": "ok" }`.

---

## Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase account
- Google Gemini API key

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:
```
GEMINI_API_KEY=your_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
ALLOWED_ORIGINS=http://localhost:3000
USE_JS_SCRAPER=false  # set to true to enable Playwright for JS-rendered pages
```

Run the server:
```bash
uvicorn main:app --reload
```

### Supabase Setup

Run this in your Supabase SQL editor:
```sql
create extension if not exists vector;

create table documents (
  id uuid primary key default gen_random_uuid(),
  url text,
  chunk_text text,
  embedding vector(768)
);

create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  url text,
  chunk_text text,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.url,
    documents.chunk_text,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
```

### Frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file in `frontend/`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Key Implementation Details

- **Hybrid chunking** — splits on paragraph boundaries first, then falls back to sentence-level splitting (via NLTK) for large paragraphs, with a minimum chunk size of 50 characters to filter noise
- **Dual ingestion** — supports both URL scraping and direct PDF upload via `pdfplumber` text extraction
- **URL deduplication** — checks if a URL has already been ingested before processing to avoid duplicate embeddings
- **Semantic similarity search** — uses pgvector's cosine distance operator (`<=>`) via a Supabase RPC function
- **Grounded generation** — LLM is explicitly instructed to answer only from retrieved context and respond in plain text

---

## Project Structure

```
doc-assistant/
├── backend/
│   ├── main.py              # FastAPI app, CORS config
│   ├── requirements.txt
│   └── Routes/
│       ├── health.py        # GET /health
│       ├── ingest.py        # POST /ingest, POST /upload — scrape/extract, chunk, embed, store
│       └── query.py         # POST /query — retrieve, generate
└── frontend/
    └── src/
        └── app/
            └── page.tsx     # Main UI — URL input, PDF upload, query input, answer display
```
