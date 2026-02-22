import os
import uuid
import shutil
from typing import List, Dict, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings 
from langchain_community.chat_models import ChatOllama
from langchain_community.vectorstores import FAISS 
from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from youtube_transcript_api import YouTubeTranscriptApi

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIG ---
DB_FAISS_PATH = "vectorstore/db_faiss"
EMBEDDING_MODEL = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vector_store = None
chat_sessions: Dict[str, Dict] = {}

# --- MODELS ---
class QueryRequest(BaseModel):
    session_id: str
    question: str
    mode: str = "syllabus" # 'syllabus' or 'internet'
    style: str = "concise"

class YouTubeRequest(BaseModel):
    url: str

class RenameRequest(BaseModel):
    session_id: str
    new_title: str

class ExamRequest(BaseModel):
    topic: str

# --- LOAD DB ---
def load_vector_store():
    global vector_store
    if os.path.exists(DB_FAISS_PATH):
        vector_store = FAISS.load_local(DB_FAISS_PATH, EMBEDDING_MODEL, allow_dangerous_deserialization=True)
        return True
    return False

@app.on_event("startup")
async def startup_event():
    load_vector_store()

# --- HISTORY ---
@app.get("/sessions/")
def get_sessions():
    return [{"id": k, "title": v["title"]} for k, v in reversed(chat_sessions.items())]

@app.post("/sessions/new/")
def create_session():
    session_id = str(uuid.uuid4())
    chat_sessions[session_id] = {"title": "New Chat", "messages": []}
    return {"session_id": session_id, "title": "New Chat", "messages": []}

@app.get("/sessions/{session_id}")
def get_session_history(session_id: str):
    if session_id not in chat_sessions: raise HTTPException(status_code=404)
    return chat_sessions[session_id]

@app.post("/sessions/rename/")
def rename_session(req: RenameRequest):
    if req.session_id in chat_sessions:
        chat_sessions[req.session_id]["title"] = req.new_title
        return {"status": "success"}
    raise HTTPException(status_code=404)

@app.delete("/sessions/clear/")
def clear_sessions():
    global chat_sessions
    chat_sessions = {}
    return {"status": "cleared"}

# --- UPLOAD ---
@app.post("/upload-pdfs/")
async def upload_pdfs(files: List[UploadFile] = File(...)):
    global vector_store
    documents = []
    os.makedirs("temp_uploads", exist_ok=True)
    try:
        for file in files:
            file_path = f"temp_uploads/{file.filename}"
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            loader = PyPDFLoader(file_path)
            documents.extend(loader.load())
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        splits = text_splitter.split_documents(documents)
        vector_store = FAISS.from_documents(documents=splits, embedding=EMBEDDING_MODEL)
        vector_store.save_local(DB_FAISS_PATH)
        return {"status": "success", "message": "Syllabus processed!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- MAIN CHAT ---
@app.post("/chat/")
async def chat(request: QueryRequest):
    global vector_store
    
    # Session Handling
    if request.session_id not in chat_sessions:
        chat_sessions[request.session_id] = {"title": "New Chat", "messages": []}
    if len(chat_sessions[request.session_id]["messages"]) == 0:
        chat_sessions[request.session_id]["title"] = " ".join(request.question.split()[:4])

    if request.mode == "syllabus":
        chat_sessions[request.session_id]["messages"].append({"role": "user", "content": request.question})

    llm = ChatOllama(model="phi3", temperature=0) # Strict
    final_answer = ""
    source = "internet" # Default

    # SCENARIO 1: SYLLABUS MODE
    if request.mode == "syllabus":
        if not vector_store:
            return {"status": "no_syllabus", "answer": "No syllabus uploaded."}

        retriever = vector_store.as_retriever()
        prompt = ChatPromptTemplate.from_messages([
            ("system", f"You are a strict Syllabus Bot. Style: {request.style}. Check Context. If answer is present, explain it. If NOT present, output ONLY: '@@EXTERNAL@@'."),
            ("human", "{input}"),
            ("human", "Context: {context}")
        ])
        chain = create_stuff_documents_chain(llm, prompt)
        rag_chain = create_retrieval_chain(retriever, chain)
        res = rag_chain.invoke({"input": request.question})
        
        if "@@EXTERNAL@@" in res["answer"]:
            # Logic: Tell Frontend to ask user permission
            return {"status": "missing", "answer": "Topic not found in Syllabus."}
        else:
            final_answer = res["answer"]
            source = "syllabus"

    # SCENARIO 2: INTERNET MODE
    elif request.mode == "internet":
        internet_llm = ChatOllama(model="phi3", temperature=0.7)
        prompt = ChatPromptTemplate.from_messages([
            ("system", f"You are a helpful expert. Answer using general knowledge. Style: {request.style}"),
            ("human", "{input}")
        ])
        chain = prompt | internet_llm
        final_answer = chain.invoke({"input": request.question}).content
        source = "internet"

    chat_sessions[request.session_id]["messages"].append({"role": "ai", "content": final_answer, "source": source})
    return {"status": "success", "answer": final_answer, "source": source}

# --- EXAM ---
@app.post("/generate-exam/")
async def generate_exam(request: ExamRequest):
    if not vector_store: raise HTTPException(status_code=400, detail="Upload PDF first")
    llm = ChatOllama(model="phi3", format="json") 
    retriever = vector_store.as_retriever()
    system_prompt = """
    Create a unique exam. Output strictly JSON:
    {{
        "mcqs": [ {{ "id": 1, "question": "...", "options": ["A)", "B)", "C)", "D)"], "correct_answer": "A)" }} ],
        "theory_2_marks": [ {{ "id": 1, "question": "...", "answer": "..." }} ],
        "theory_5_marks": [ {{ "id": 1, "question": "...", "answer": "..." }} ]
    }}
    Generate: 2 MCQs, 1 Short (2 Marks), 1 Long (5 Marks).
    """
    prompt = ChatPromptTemplate.from_messages([("system", system_prompt), ("human", "Context: {context}"), ("human", "Topic: {input}")])
    chain = create_stuff_documents_chain(llm, prompt)
    rag = create_retrieval_chain(retriever, chain)
    response = rag.invoke({"input": request.topic})
    
    # Simple cleaner for JSON
    raw = response["answer"]
    if "```json" in raw: raw = raw.split("```json")[1].split("```")[0]
    return {"quiz_json": raw}

# --- PYQ SOLVER ---
@app.post("/solve-pyq/")
async def solve_pyq(files: List[UploadFile] = File(...)):
    if not vector_store: raise HTTPException(status_code=400, detail="Upload Syllabus first")
    os.makedirs("temp_uploads", exist_ok=True)
    pyq_text = ""
    for file in files:
        file_path = f"temp_uploads/pyq_{file.filename}"
        with open(file_path, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
        loader = PyPDFLoader(file_path)
        for page in loader.load(): pyq_text += page.page_content
    
    llm = ChatOllama(model="phi3")
    extract_prompt = ChatPromptTemplate.from_messages([("system", "Extract 3 main questions."), ("human", f"Text: {pyq_text[:2000]}")])
    questions_raw = (extract_prompt | llm).invoke({}).content
    questions = [q for q in questions_raw.split('\n') if "?" in q][:3]
    
    solutions = []
    retriever = vector_store.as_retriever()
    # Strict Solve
    solve_chain = create_stuff_documents_chain(llm, ChatPromptTemplate.from_messages([
        ("system", "Answer strictly from context. If not found, output '@@MISSING@@'."), 
        ("human", "{input}"), ("human", "Context: {context}")
    ]))
    rag = create_retrieval_chain(retriever, solve_chain)
    
    for q in questions:
        ans = rag.invoke({"input": q})["answer"]
        if "@@MISSING@@" in ans:
            solutions.append({"question": q, "answer": "This question is OUT OF SYLLABUS (Not found in notes).", "tag": "⚠️ Out of Syllabus"})
        else:
            solutions.append({"question": q, "answer": ans, "tag": "✅ Syllabus Verified"})
        
    return {"pyq_solutions": solutions}

# --- YOUTUBE ---
@app.post("/analyze-youtube/")
async def analyze_youtube(req: YouTubeRequest):
    if not vector_store: raise HTTPException(status_code=400, detail="Upload Syllabus first")
    try:
        if "v=" in req.url: video_id = req.url.split("v=")[1].split("&")[0]
        else: video_id = req.url.split("/")[-1]
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        full_text = " ".join([t['text'] for t in transcript_list])
    except:
        return {"answer": "Error: Could not fetch subtitles or video ID is invalid.", "source": "error"}

    llm = ChatOllama(model="phi3")
    retriever = vector_store.as_retriever()
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Compare Video Transcript with Syllabus Context.
        1. Summarize parts of the video that match the syllabus.
        2. If unrelated, say 'Video content is not in syllabus'."""),
        ("human", f"Video: {full_text[:4000]}"), ("human", "Syllabus: {context}")
    ])
    chain = create_stuff_documents_chain(llm, prompt)
    rag = create_retrieval_chain(retriever, chain)
    res = rag.invoke({"input": "Analyze Video"})
    return {"answer": res["answer"], "source": "youtube"}