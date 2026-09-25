const aiService = require('../services/aiService');

class AIController {
  async chat(req, res) {
    try {
      const { message, language = 'en' } = req.body;
      const user = req.user || null;

      const result = await aiService.chat({ message, user, language });
      res.json(result);
    } catch (err) {
      console.error('AI Chatbot error:', err);
      res.status(500).json({ error: 'AI Assistant temporarily unavailable: ' + err.message });
    }
  }
}

module.exports = new AIController();
