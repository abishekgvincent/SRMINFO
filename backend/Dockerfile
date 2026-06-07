FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system utilities needed for building packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies first to optimize docker caching
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy source code and knowledge files
COPY backend/ ./backend/
COPY knowledge_base/ ./knowledge_base/

# Expose port
EXPOSE 8000

# Run FastAPI app using uvicorn
CMD ["python", "-m", "uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
