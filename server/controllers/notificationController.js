const notificationService = require('../services/notificationService');

class NotificationController {
  async getNotifications(req, res) {
    try {
      const notifications = notificationService.getUserNotifications(req.user.id);
      res.json(notifications);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      notificationService.markAsRead(id, req.user.id);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async markAllAsRead(req, res) {
    try {
      notificationService.markAllAsRead(req.user.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new NotificationController();
