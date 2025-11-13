# SRMINFO — Intelligent College Chatbot

SRMINFO is an AI-powered, intent-based chatbot designed for SRM College to answer common student queries instantly.  
It uses Natural Language Processing (NLP) with PyTorch to classify user messages into predefined intents — without needing any database.

This chatbot is lightweight, easy to integrate, and capable of handling queries related to:

- 🎓 Admissions  
- 📚 Courses  
- 💼 Placements  
- 🎓 Scholarships  
- 🏫 Campus Life  
- And more...

---

## Features

- 🔹 **Intent-Based Chatbot** — fast and accurate responses  
- 🔹 **ML Model using PyTorch**  
- 🔹 **Tokenization, Lemmatization & Bag-of-Words**  
- 🔹 **Flask Backend API (/predict)**  
- 🔹 **No Database Required**  
- 🔹 **Simple to Train and Deploy**  

---

## Tech Stack

**Backend & ML**
- Python  
- PyTorch  
- NLTK  
- Flask  
- NumPy  

**Frontend (if integrated)**  
- HTML / CSS / JavaScript  
- Fetch API / Axios  

---

## Project Structure

```
SRMINFO/
│── app.py
│── chat.py
│── model.py
│── nltk_utils.py
│── train.py
│── intents.json
│── data.pth
│── static/ # (Frontend files - optional)
│── templates/ # (HTML files - optional)
│── README.md
```

---

## How to Run the Project

### 1️⃣ Clone the repository  
```bash
git clone https://github.com/your-username/SRMINFO.git
cd SRMINFO
```
2️⃣ Install dependencies
```bash
pip install -r requirements.txt
```
3️⃣ Run the Flask backend
```bash
python app.py
```
4️⃣ Test the API endpoint
POST request to:

```bash
http://localhost:5000/predict
```
```
Example body:

json
Copy code
{
  "message": "Tell me about SRM admissions"
}
```

