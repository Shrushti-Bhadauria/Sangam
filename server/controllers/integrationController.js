const { db } = require('../config/database');
const workflowService = require('../services/workflowService');
const revenueConnector = require('../connectors/revenueConnector');

class IntegrationController {
  async executeSync(req, res) {
    try {
      const { applicationId, citizenId, targetDepartment = 'REVENUE', forceFailure = false } = req.body;
      if (!applicationId || !citizenId) {
        return res.status(400).json({ error: 'applicationId and citizenId are required' });
      }

      const result = await workflowService.executeInteroperabilitySync({
        applicationId,
        citizenId,
        targetDepartment,
        actorId: req.user ? req.user.id : 'SYSTEM',
        forceFailure
      });

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getEvents(req, res) {
    try {
      const { status, department, search } = req.query;
      let query = `
        SELECT ie.*, c.fullName as citizenName, c.sangamId
        FROM integrationEvents ie
        LEFT JOIN citizens c ON ie.citizenId = c.id
      `;
      const conditions = [];
      const params = [];

      if (status && status !== 'ALL') {
        conditions.push('ie.status = ?');
        params.push(status);
      }

      if (department && department !== 'ALL') {
        conditions.push('(ie.sourceDepartment = ? OR ie.targetDepartment = ?)');
        params.push(department, department);
      }

      if (search) {
        conditions.push('(ie.id LIKE ? OR c.fullName LIKE ? OR c.sangamId LIKE ? OR ie.operation LIKE ?)');
        const s = `%${search}%`;
        params.push(s, s, s, s);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY ie.createdAt DESC';
      const events = db.all(query, params).map(evt => {
        try {
          return {
            ...evt,
            requestPayload: evt.requestPayload ? JSON.parse(evt.requestPayload) : null,
            responsePayload: evt.responsePayload ? JSON.parse(evt.responsePayload) : null
          };
        } catch {
          return evt;
        }
      });

      res.json(events);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getEventById(req, res) {
    try {
      const { id } = req.params;
      const evt = db.get(
        `SELECT ie.*, c.fullName as citizenName, c.sangamId, c.email as citizenEmail
         FROM integrationEvents ie
         LEFT JOIN citizens c ON ie.citizenId = c.id
         WHERE ie.id = ?`,
        [id]
      );

      if (!evt) return res.status(404).json({ error: 'Integration event not found.' });

      // Find any related data quality issues
      const issues = db.all('SELECT * FROM dataQualityIssues WHERE integrationEventId = ?', [id]);

      // Associated application if present
      let application = null;
      if (evt.applicationId) {
        application = db.get('SELECT * FROM applications WHERE id = ?', [evt.applicationId]);
      }

      res.json({
        ...evt,
        requestPayload: evt.requestPayload ? JSON.parse(evt.requestPayload) : null,
        responsePayload: evt.responsePayload ? JSON.parse(evt.responsePayload) : null,
        issues,
        application
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async retryEvent(req, res) {
    try {
      const { id } = req.params;
      const result = await workflowService.retryIntegration(id, req.user ? req.user.id : 'INTEGRATION_ADMIN');
      res.json(result);
    } catch (err) {
      console.error('Retry event error:', err);
      res.status(500).json({ error: 'Retry failed: ' + err.message });
    }
  }

  async toggleFailureMode(req, res) {
    try {
      const { failureMode } = req.body;
      revenueConnector.setFailureMode(failureMode);
      res.json({ success: true, failureMode: revenueConnector.failureMode });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new IntegrationController();
