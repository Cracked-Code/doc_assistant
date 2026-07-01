from bs4 import BeautifulSoup
import requests
from dotenv import load_dotenv
import os
import google.genai as genai
from google.genai import types
from supabase import create_client
from fastapi import APIRouter
from pydantic import BaseModel
import nltk


try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt_tab')
from nltk.tokenize import sent_tokenize



router1 = APIRouter()

# Used to determind if chunk_text_v2 can be used/ AKA is it local or hosted.

#Loading in the GEMINI API key from .env 
load_dotenv()
USE_JS_SCRAPER = os.getenv("USE_JS_SCRAPER", "false").lower() == "true"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
model = "gemini-embedding-001"
client = genai.Client(api_key = GEMINI_API_KEY)

# Creating the client setup for Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# This function scrapes a URL and returns the web-pages content via bs4
def scrape_url(url) :
    text =  requests.get(url).text
    parse_text = BeautifulSoup(text,'html.parser')
    main = parse_text.find("main")
    article = parse_text.find("article")
    if main:
        parse_text = main.get_text()
    elif article :
        parse_text = article.get_text()
    else:
        parse_text = parse_text.get_text() 

    return parse_text

# This is a different scraper for web-pages that arent html friendly.
def scrape_url_js(url):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(url)
        page.wait_for_load_state("domcontentloaded")
        html = page.content()
        browser.close()
    
    soup = BeautifulSoup(html, 'html.parser')
    main = soup.find("main")
    if main:
        return main.get_text()
    return soup.get_text()


# This function takes in a string of html content and chunkifes it via a fixed length of 150 characters.
def chunk_text(text, chunk_size = 300) :
    chunks = []
    for chunk in range(0, len(text), chunk_size) :
        chunks.append(text[chunk:chunk+chunk_size])
    
    return chunks

def chunk_text_v2(text,max_chunk_size = 600) :
    paragraph_chunks = []
    final_chunks = []
    current = ""
    paragraph_chunks = text.split("\n\n")

    for chunk in paragraph_chunks :
        if len(chunk) > max_chunk_size :
            sentence_chunks=sent_tokenize(chunk)
            for sentence in sentence_chunks:
                if len(current) + len(sentence) > max_chunk_size:
                    final_chunks.append(current)
                    current = sentence
                else:
                    current += " " + sentence        
            if current:
                final_chunks.append(current)
                current = ""
        else :
            final_chunks.append(chunk)
    return [chunk for chunk in final_chunks if len(chunk.strip()) > 50]

# This function embeds a single chunk via genai.
def embed_chunk(chunk) :
    result = client.models.embed_content(
        model=model,
        contents = chunk,
        config = types.EmbedContentConfig(output_dimensionality=768 )
    )

    return result.embeddings[0].values


def store_chunk(url,chunk, embed_value) :
    supabase.table("documents").insert(
        {"url" : url,
        "chunk_text" : chunk,
        "embedding" : embed_value}
        ).execute()

# Puts all the previous functions together to store the chunks in a Supabase db.
def ingest_url(url) : 
    check = supabase.table("documents").select("url").eq("url", url).execute() 
    if len(check.data) > 0 :
        return {"status": "error-> already ingested."}
    
    if USE_JS_SCRAPER:
        text = scrape_url_js(url)
    else:
        text = scrape_url(url)
    chunks = chunk_text_v2(text)
    for chunk in chunks :
        embed_chunk_val = embed_chunk(chunk)
        store_chunk(url, chunk, embed_chunk_val)
 
#-----------------------------------------------------------------------------------------------------

class IngestRequest(BaseModel) :
    url : str

@router1.post("/ingest") 
def ingest(request:IngestRequest) :
    try:
        result = ingest_url(request.url)
        if result :
            return result
        return {"status" : "success"}
    except Exception as e :
        return {"status" : f"error_code 01 : {e}" ,}
