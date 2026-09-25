const { db } = require('../config/database');
const eventStream = require('./eventStreamService');

class AuditService {
  log({ actorId = 'SYSTEM', action, entityType, entityId, description, metadata = {} }) {
    const id = `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();
    const metaString = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);

    db.run(
      'INSERT INTO auditLogs (id, actorId, action, entityType, entityId, description, metadata, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, actorId, action, entityType, entityId, description, metaString, timestamp]
    );

    const logEntry = { id, actorId, action, entityType, entityId, description, metadata: metaString, timestamp };
    eventStream.broadcast('AUDIT_LOG_CREATED', logEntry);

    return logEntry;
  }

  getRecentLogs(limit = 50) {
    return db.all('SELECT * FROM auditLogs ORDER BY timestamp DESC LIMIT ?', [limit]);
  }
}

module.exports = new AuditService();
