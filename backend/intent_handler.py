import re
import random

class IntentHandler:
    def __init__(self):
        # Compiled regex patterns for intent classification
        self.intents = {
            "greeting": {
                "patterns": [
                    r"\bhi\b",
                    r"\bhello\b",
                    r"\bhey\b",
                    r"\bgood\s+morning\b",
                    r"\bgood\s+afternoon\b",
                    r"\bgood\s+evening\b",
                    r"\byo\b"
                ],
                "responses": [
                    "Hello! Welcome to SRMINFO, your college information assistant. How can I help you today?",
                    "Hi there! I am here to help you with any questions about admissions, placements, academic regulations, scholarships, hostel, or events at SRM. What would you like to know?",
                    "Greetings! How can I assist you with SRM university information today?"
                ]
            },
            "thanks": {
                "patterns": [
                    r"\bthanks\b",
                    r"\bthank\s+you\b",
                    r"\bappreciate\s+it\b",
                    r"\bthank\s+u\b",
                    r"\bthx\b"
                ],
                "responses": [
                    "You're very welcome! If you have any other questions, feel free to ask.",
                    "Happy to help! Let me know if there's anything else you need.",
                    "Glad I could assist. Have a wonderful day!"
                ]
            },
            "goodbye": {
                "patterns": [
                    r"\bbye\b",
                    r"\bgoodbye\b",
                    r"\bsee\s+you\b",
                    r"\bsee\s+u\b",
                    r"\btalk\s+to\s+you\s+later\b"
                ],
                "responses": [
                    "Goodbye! Have a great day ahead. Feel free to reach out again whenever you have questions.",
                    "Bye! Take care and feel free to ask more questions whenever you need information.",
                    "Farewell! Wishing you the best. See you soon!"
                ]
            },
            "identity": {
                "patterns": [
                    r"\bwho\s+are\s+you\b",
                    r"\bwhat\s+is\s+your\s+name\b",
                    r"\btell\s+me\s+about\s+yourself\b",
                    r"\bwhat\s+should\s+i\s+call\s+you\b"
                ],
                "responses": [
                    "I am SRMINFO, your college information assistant."
                ]
            }
        }

    def check_intent(self, message: str) -> str | None:
        """
        Check if the input message matches any of the classified intents.
        Returns a response string if matched, otherwise None.
        """
        cleaned_message = message.lower().strip()
        
        # Remove common punctuation for cleaner matching
        cleaned_message = re.sub(r"[^\w\s]", "", cleaned_message)
        
        for intent_name, intent_data in self.intents.items():
            for pattern in intent_data["patterns"]:
                if re.search(pattern, cleaned_message):
                    return random.choice(intent_data["responses"])
                    
        return None
