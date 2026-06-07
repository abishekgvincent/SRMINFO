import logging
from fastapi import APIRouter, Request, HTTPException, status
from models.chat import ChatRequest, ChatResponse, ReloadResponse

# Configure logger
logger = logging.getLogger("srminfo.routes.chat")

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: Request, payload: ChatRequest):
    """
    Evaluates the input query.
    1. Checks rule-based intent classification (greeting, goodbye, thanks, identity).
    2. If no intent matches, performs semantic search over the document base.
    """
    message = payload.message.strip()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message field cannot be empty."
        )

    try:
        # Access shared instances from app state
        intent_handler = request.app.state.intent_handler
        search_engine = request.app.state.search_engine

        # Step 1: Check intent handler (greetings, thanks, goodbye, bot identity)
        intent_response = intent_handler.check_intent(message)
        if intent_response:
            logger.debug(f"Query matched intent. Returning pre-defined response.")
            return ChatResponse(answer=intent_response)

        # Step 2: Semantic search
        search_result = search_engine.search(message)
        return ChatResponse(answer=search_result["answer"])

    except AttributeError as e:
        logger.error(f"Application state dependencies not loaded properly: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chat services are currently unavailable."
        )
    except Exception as e:
        logger.error(f"Error handling chat request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing your query."
        )

@router.post("/reload-knowledge", response_model=ReloadResponse)
async def reload_knowledge_endpoint(request: Request):
    """
    Reloads all knowledge files, updates the semantic search index,
    and regenerates embeddings on the fly without restarting the server.
    """
    try:
        loader = request.app.state.knowledge_loader
        search_engine = request.app.state.search_engine

        logger.info("Manual reload triggered. Reloading knowledge base documents...")
        documents = loader.load_all()
        
        logger.info("Re-indexing documents and updating search embeddings...")
        search_engine.index_documents(documents)

        return ReloadResponse(
            status="success",
            message="Knowledge base successfully reloaded and embeddings updated.",
            document_count=len(documents)
        )
    except Exception as e:
        logger.error(f"Failed to reload knowledge base: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reload knowledge: {str(e)}"
        )
