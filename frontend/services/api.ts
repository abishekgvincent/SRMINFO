const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ChatResponse {
  answer: string;
}

export interface HealthResponse {
  status: string;
}

export interface ReloadResponse {
  status: string;
  message: string;
  document_count: number;
}

export const chatService = {
  /**
   * Sends a chat message to the FastAPI backend and returns the response.
   */
  async sendMessage(message: string): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server responded with status ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      return data.answer;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  },

  /**
   * Triggers a knowledge base reload on the backend.
   */
  async reloadKnowledge(): Promise<ReloadResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/reload-knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to reload knowledge base`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in reloadKnowledge:', error);
      throw error;
    }
  },

  /**
   * Performs a health check on the backend API.
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) return false;
      const data: HealthResponse = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      console.warn('Backend health check failed:', error);
      return false;
    }
  }
};
