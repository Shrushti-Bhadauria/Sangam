class SSEClient {
  constructor() {
    this.eventSource = null;
    this.listeners = new Set();
  }

  connect() {
    if (this.eventSource) return;

    try {
      this.eventSource = new EventSource('/api/events/stream');

      this.eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          for (const listener of this.listeners) {
            listener(payload);
          }
        } catch (e) {
          console.error('Error parsing SSE event payload:', e);
        }
      };

      this.eventSource.onerror = () => {
        // Automatically reconnect after delay
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        setTimeout(() => this.connect(), 4000);
      };
    } catch (err) {
      console.warn('SSE connection initialization error:', err);
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    if (!this.eventSource) {
      this.connect();
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

export const sseClient = new SSEClient();
