import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from knowledge_loader import KnowledgeLoader
from embeddings import EmbeddingGenerator
from intent_handler import IntentHandler
from search import SemanticSearchEngine
from routes.chat import router as chat_router
from models.chat import HealthResponse

# Setup logger configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("srminfo.app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle manager that initializes resources on startup and cleanups on shutdown.
    """
    logger.info("Starting up SRMINFO Backend...")
    try:
        # Initialize dependencies
        intent_handler = IntentHandler()
        knowledge_loader = KnowledgeLoader()
        embedding_generator = EmbeddingGenerator()
        search_engine = SemanticSearchEngine(embedding_generator=embedding_generator)
        
        # Load and index initial knowledge base
        logger.info("Performing initial loading of knowledge base...")
        documents = knowledge_loader.load_all()
        search_engine.index_documents(documents)
        
        # Save resources in app state for access in endpoints
        app.state.intent_handler = intent_handler
        app.state.knowledge_loader = knowledge_loader
        app.state.embedding_generator = embedding_generator
        app.state.search_engine = search_engine
        
        logger.info("SRMINFO Backend initialization complete.")
    except Exception as e:
        logger.critical(f"Failed to initialize chatbot dependencies: {e}", exc_info=True)
        # We don't crash the server startup, but let the health check flag the error.
        
    yield
    logger.info("Shutting down SRMINFO Backend...")

app = FastAPI(
    title="SRMINFO Backend",
    description="AI-Powered College Information Assistant API",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production (e.g. ['https://srminfo.vercel.app'])
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoints router
app.include_router(chat_router)

@app.get("/health", response_model=HealthResponse)
def health_endpoint():
    """
    Checks the system health by verifying if the search index is loaded.
    """
    try:
        # Check if app state and search engine index are healthy
        if hasattr(app.state, "search_engine") and app.state.search_engine.embeddings is not None:
            return HealthResponse(status="healthy")
        return HealthResponse(status="degraded - search index not loaded")
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthResponse(status="unhealthy")

if __name__ == "__main__":
    import uvicorn
    # Start ASGI server on port 8000
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
