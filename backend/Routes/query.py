from dotenv import load_dotenv
import os
import google.genai as genai
from google.genai import types
from supabase import create_client
from fastapi import APIRouter
from pydantic import BaseModel

router2 = APIRouter()

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
model = "gemini-embedding-001"
client = genai.Client(api_key = GEMINI_API_KEY)

# Creating the client setup for Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def query_embed(query) :
    result = client.models.embed_content(
        model=model,
        contents = query,
        config = types.EmbedContentConfig(output_dimensionality=768 )
    )
    return result.embeddings[0].values

def answer(query_embeded) :
    db_embed_values= supabase.rpc("match_documents", 
                                  {
        "query_embedding": query_embeded,
        "match_threshold": 0, # Only return highly similar vectors
        "match_count": 5         # Return top 5 matches
    }).execute()
    
    return db_embed_values

def refine_answer(value) :
    refined_answer = []
    for index,chunk in enumerate(value) :
        refined_answer.append( f"[{index + 1}] Source : {chunk['url']}\nContent : {chunk['chunk_text']}" )
    
    return "\n\n".join(refined_answer)

def llm_answer(query) :
    try :
        embed = query_embed(query)
        solution = answer(embed)
        clean_solution = refine_answer(solution.data)
        prompt = f""" Your job is to answer the users question to your best abilites using additonal information provided. Respond in plain text only. Do not use markdown, asterisks, or any special formatting.
        At the end of your answer, cite your sources with the full URL like: "Sources: https://..." If they all come from the same source then just list it once.
        Here is the additonal info : {clean_solution}.
        Here is the user's query : {query}
        """
        response = client.models.generate_content(
            model = "gemini-2.5-flash",
            contents = prompt
        )
    except Exception as e :
        print(f"Error: {e}")
        return {"status": "error", "detail": {e}}
    
    return response.text

#-----------------------------------------------------------------------------------------------------

class QueryRequest(BaseModel) :
    query : str

@router2.post("/query")
def query_request(query : QueryRequest) :
    print("Recieved Query")
    return(llm_answer(query.query))


# if __name__ == "__main__":
#     query = "What are the Rules of React"
#     x = llm_answer(query)
#     print(f"\n\nHere is Gemini 2.5 Response: \n\n\n {x} \n\n\n")