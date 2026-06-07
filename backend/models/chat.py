from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    answer: str

class HealthResponse(BaseModel):
    status: str

class ReloadResponse(BaseModel):
    status: str
    message: str
    document_count: int
