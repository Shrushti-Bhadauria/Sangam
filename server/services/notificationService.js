const { db } = require('../config/database');
const eventStream = require('./eventStreamService');

class NotificationService {
  createNotification(userId, title, message, type = 'INFO') {
    const id = `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const createdAt = new Date().toISOString();

    db.run(
      'INSERT INTO notifications (id, userId, title, message, type, read, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, userId, title, message, type, 0, createdAt]
    );

    const notification = { id, userId, title, message, type, read: 0, createdAt };
    eventStream.broadcast('NOTIFICATION_CREATED', notification);

    return notification;
  }

  getUserNotifications(userId) {
    return db.all('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC', [userId]);
  }

  markAsRead(notificationId, userId) {
    db.run('UPDATE notifications SET read = 1 WHERE id = ? AND userId = ?', [notificationId, userId]);
    return { success: true };
  }

  markAllAsRead(userId) {
    db.run('UPDATE notifications SET read = 1 WHERE userId = ?', [userId]);
    return { success: true };
  }
}

module.exports = new NotificationService();
