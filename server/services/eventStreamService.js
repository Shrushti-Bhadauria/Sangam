// Server-Sent Events (SSE) broadcaster for real-time updates
class EventStreamService {
  constructor() {
    this.clients = new Set();
  }

  addClient(res) {
    this.clients.add(res);
    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  broadcast(eventType, payload) {
    const data = JSON.stringify({ type: eventType, data: payload, timestamp: new Date().toISOString() });
    for (const client of this.clients) {
      try {
        client.write(`event: message\ndata: ${data}\n\n`);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }
}

module.exports = new EventStreamService();
