import logging
import torch
from sentence_transformers import SentenceTransformer

# Configure logger
logger = logging.getLogger("srminfo.embeddings")

class EmbeddingGenerator:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self._model = None
        # Auto-detect hardware acceleration
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"EmbeddingGenerator initialized. Device preference: {self.device}")

    @property
    def model(self):
        """
        Lazily loads the SentenceTransformer model when first accessed.
        """
        if self._model is None:
            logger.info(f"Loading SentenceTransformer model '{self.model_name}' on {self.device}...")
            try:
                self._model = SentenceTransformer(self.model_name, device=self.device)
                logger.info("SentenceTransformer model loaded successfully.")
            except Exception as e:
                logger.critical(f"Failed to load SentenceTransformer model: {e}")
                raise e
        return self._model

    def get_embeddings(self, texts: list[str]) -> list:
        """
        Generates normalized embeddings for a list of strings.
        Returns a list of list of floats (embeddings).
        """
        if not texts:
            return []
        
        # Calculate embeddings and normalize them (allows simple dot product or cosine similarity)
        embeddings = self.model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        return embeddings.tolist()

    def get_embedding(self, text: str) -> list[float]:
        """
        Generates normalized embedding for a single text string.
        Returns a list of floats.
        """
        return self.get_embeddings([text])[0]
