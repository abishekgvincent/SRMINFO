import os
import json
import logging
from pathlib import Path

# Configure logger
logger = logging.getLogger("srminfo.knowledge_loader")

class KnowledgeLoader:
    def __init__(self, base_dir: str | Path | None = None):
        """
        Initializes the knowledge loader.
        If base_dir is not provided, it attempts to resolve the 'knowledge_base'
        directory relative to the script location.
        """
        if base_dir:
            self.base_dir = Path(base_dir).resolve()
        else:
            # Default to root/knowledge_base relative to this file (backend/knowledge_loader.py)
            self.base_dir = Path(__file__).resolve().parent.parent / "knowledge_base"
            
        logger.info(f"KnowledgeLoader initialized with base directory: {self.base_dir}")

    def load_all(self) -> list[dict]:
        """
        Recursively finds and loads all valid JSON files under the base directory.
        Returns a list of dicts conforming to {"id": ..., "title": ..., "content": ...}.
        """
        documents = []
        seen_ids = set()

        if not self.base_dir.exists() or not self.base_dir.is_dir():
            logger.error(f"Knowledge base directory does not exist or is not a directory: {self.base_dir}")
            return documents

        # Walk the directory
        for root, _, files in os.walk(self.base_dir):
            for file in files:
                if file.endswith(".json"):
                    file_path = Path(root) / file
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            data = json.load(f)

                        # Validate schema
                        if not isinstance(data, dict):
                            logger.warning(f"Skipping {file_path}: root element must be a JSON object.")
                            continue

                        required_keys = {"id", "title", "content"}
                        missing_keys = required_keys - data.keys()
                        if missing_keys:
                            logger.warning(f"Skipping {file_path}: missing required keys: {missing_keys}")
                            continue

                        doc_id = data["id"]
                        if doc_id in seen_ids:
                            logger.warning(f"Duplicate document ID found: '{doc_id}' in {file_path}. Skipping duplicates.")
                            continue

                        seen_ids.add(doc_id)
                        
                        # Store structural metadata alongside content (could be useful for future PGVector)
                        documents.append({
                            "id": doc_id,
                            "title": data["title"],
                            "content": data["content"],
                            "file_path": str(file_path),
                            "category": file_path.parent.name
                        })

                    except json.JSONDecodeError as e:
                        logger.error(f"Error decoding JSON in {file_path}: {e}")
                    except Exception as e:
                        logger.error(f"Unexpected error loading {file_path}: {e}")

        logger.info(f"Successfully loaded {len(documents)} knowledge documents.")
        return documents
