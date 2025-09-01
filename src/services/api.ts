// Jema Remote Desktop - API Service
// This service manages all communications with the REST API server
// Features:
// - Session creation
// - Session information retrieval
// - Server health checking
// - HTTP error handling
// - Fetch request configuration with timeout
// Author: Jema Technology
// Date: 2025
// GitHub: https://github.com/JemaOS/RemoteDesktop

const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export interface SessionResponse {
  sessionId: string;
  sessionCode: string;
  expiresAt: string;
}

export interface SessionInfo {
  sessionId: string;
  status: string;
  expiresAt: string;
}

class ApiService {
  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async createSession(): Promise<SessionResponse> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/session`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Session créée:', data.sessionCode);
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de la création de session:', error);
      throw new Error('Impossible de créer une session. Vérifiez que le serveur est démarré.');
    }
  }

  async getSessionInfo(sessionCode: string): Promise<SessionInfo> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/session/${sessionCode}`);

      if (response.status === 404) {
        throw new Error('Session non trouvée. Vérifiez le code de session.');
      }

      if (response.status === 410) {
        throw new Error('Session expirée. Demandez un nouveau code.');
      }

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Informations de session récupérées:', data);
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des informations de session:', error);
      throw error;
    }
  }

  async checkServerHealth(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/health`, {}, 5000);
      return response.ok;
    } catch (error) {
      console.error('❌ Serveur non accessible:', error);
      return false;
    }
  }
}

export const apiService = new ApiService();
export default apiService;