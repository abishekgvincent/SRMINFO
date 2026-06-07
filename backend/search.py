import logging
import numpy as np
from embeddings import EmbeddingGenerator
from knowledge_loader import KnowledgeLoader

# Configure logger
logger = logging.getLogger("srminfo.search")

class SemanticSearchEngine:
    def __init__(self, embedding_generator: EmbeddingGenerator, threshold: float = 0.45):
        """
        Initializes the semantic search engine.
        :param embedding_generator: Instance of EmbeddingGenerator to compute query embeddings.
        :param threshold: Minimum cosine similarity score required to return an answer.
        """
        self.embedding_generator = embedding_generator
        self.threshold = threshold
        self.documents = []
        self.embeddings = None  # NumPy array of shape (num_documents, embedding_dimension)
        
        self.fallback_message = (
            "I couldn't find relevant information for that question. "
            "Please contact the college administration or try rephrasing your question."
        )

    def index_documents(self, documents: list[dict]):
        """
        Indices a list of documents by generating and storing their embeddings in memory.
        """
        if not documents:
            logger.warning("No documents provided to index.")
            self.documents = []
            self.embeddings = None
            return

        self.documents = documents
        
        # Concatenate title and content to make embeddings more context-rich
        # You can customize this concatenation logic if needed
        texts_to_embed = [f"Title: {doc['title']}\nContent: {doc['content']}" for doc in documents]
        
        logger.info(f"Generating embeddings for {len(texts_to_embed)} documents...")
        raw_embeddings = self.embedding_generator.get_embeddings(texts_to_embed)
        self.embeddings = np.array(raw_embeddings, dtype=np.float32)
        logger.info("Indexing completed successfully.")

    def search(self, query: str, top_k: int = 3) -> dict:
        """
        Performs semantic search to find the most relevant document for a query.
        Returns a dictionary containing the answer and matching metadata.
        """
        if not self.documents or self.embeddings is None:
            logger.warning("Search query received but index is empty.")
            return {"answer": self.fallback_message, "score": 0.0, "matches": []}

        # 1. Generate normalized query embedding
        query_embedding = np.array(self.embedding_generator.get_embedding(query), dtype=np.float32)

        # 2. Compute cosine similarity (dot product since embeddings are normalized)
        # Cosine similarity range is [-1, 1]
        similarities = np.dot(self.embeddings, query_embedding)

        # 3. Get top K matches
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        matches = []
        for idx in top_indices:
            score = float(similarities[idx])
            doc = self.documents[idx]
            matches.append({
                "id": doc["id"],
                "title": doc["title"],
                "content": doc["content"],
                "score": score,
                "category": doc.get("category", "general")
            })

        if not matches:
            return {"answer": self.fallback_message, "score": 0.0, "matches": []}

        best_match = matches[0]
        logger.info(f"Query: '{query}' | Best match ID: '{best_match['id']}' | Similarity: {best_match['score']:.4f}")

        # 4. Check against similarity threshold
        if best_match["score"] < self.threshold:
            logger.info(f"Best match score {best_match['score']:.4f} is below threshold {self.threshold}. Returning fallback.")
            return {
                "answer": self.fallback_message,
                "score": best_match["score"],
                "matches": matches
            }

        # Return the content of the best match
        return {
            "answer": best_match["content"],
            "score": best_match["score"],
            "matches": matches
        }
