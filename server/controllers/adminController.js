const { db } = require('../config/database');
const { seedData } = require('../seed/seedData');
const educationConnector = require('../connectors/educationConnector');
const revenueConnector = require('../connectors/revenueConnector');
const welfareConnector = require('../connectors/welfareConnector');
const citizenRegistryConnector = require('../connectors/citizenRegistryConnector');
const auditService = require('../services/auditService');

class AdminController {
  async getStats(req, res) {
    try {
      // 1. Integration stats
      const totalIntegrations = db.get('SELECT COUNT(*) as count FROM integrationEvents').count;
      const successfulIntegrations = db.get("SELECT COUNT(*) as count FROM integrationEvents WHERE status = 'SUCCESS'").count;
      const failedIntegrations = db.get("SELECT COUNT(*) as count FROM integrationEvents WHERE status = 'FAILED'").count;
      const pendingIntegrations = db.get("SELECT COUNT(*) as count FROM integrationEvents WHERE status IN ('PENDING', 'PROCESSING', 'RETRYING')").count;

      // 2. Connectors stats
      const totalConnectors = db.get('SELECT COUNT(*) as count FROM connectors').count;
      const activeConnectors = db.get("SELECT COUNT(*) as count FROM connectors WHERE status = 'ACTIVE' AND enabled = 1").count;

      // 3. Data Quality Issues stats
      const totalDataQualityIssues = db.get('SELECT COUNT(*) as count FROM dataQualityIssues').count;
      const unresolvedDataQualityIssues = db.get('SELECT COUNT(*) as count FROM dataQualityIssues WHERE resolved = 0').count;

      // 4. Applications stats
      const totalApplications = db.get('SELECT COUNT(*) as count FROM applications').count;
      const approvedApplications = db.get("SELECT COUNT(*) as count FROM applications WHERE status = 'APPROVED'").count;
      const underReviewApplications = db.get("SELECT COUNT(*) as count FROM applications WHERE status = 'UNDER_REVIEW'").count;
      const pendingConsentApplications = db.get("SELECT COUNT(*) as count FROM applications WHERE status = 'CONSENT_REQUIRED'").count;

      // 5. Citizens count
      const totalCitizens = db.get('SELECT COUNT(*) as count FROM citizens').count;

      // 6. Connectors list
      const connectors = db.all('SELECT * FROM connectors');

      // 7. Applications by department
      const deptBreakdown = db.all('SELECT department, COUNT(*) as count FROM applications GROUP BY department');

      // 8. Integrations by status breakdown
      const statusBreakdown = db.all('SELECT status, COUNT(*) as count FROM integrationEvents GROUP BY status');

      // 9. Failure mode state
      const isRevenueFailureSimulated = revenueConnector.failureMode;

      res.json({
        totalIntegrations,
        successfulIntegrations,
        failedIntegrations,
        pendingIntegrations,
        totalConnectors,
        activeConnectors,
        totalDataQualityIssues,
        unresolvedDataQualityIssues,
        totalApplications,
        approvedApplications,
        underReviewApplications,
        pendingConsentApplications,
        totalCitizens,
        connectors,
        deptBreakdown,
        statusBreakdown,
        isRevenueFailureSimulated
      });
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async getConnectors(req, res) {
    try {
      const connectors = db.all('SELECT * FROM connectors ORDER BY department ASC');
      res.json(connectors);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async toggleConnector(req, res) {
    try {
      const { id } = req.params;
      const { enabled } = req.body;

      db.run('UPDATE connectors SET enabled = ? WHERE id = ?', [enabled ? 1 : 0, id]);

      auditService.log({
        actorId: req.user ? req.user.id : 'ADMIN',
        action: 'CONNECTOR_STATUS_TOGGLED',
        entityType: 'CONNECTOR',
        entityId: id,
        description: `Connector ${id} was ${enabled ? 'ENABLED' : 'DISABLED'}`,
        metadata: { enabled }
      });

      const updated = db.get('SELECT * FROM connectors WHERE id = ?', [id]);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async testConnector(req, res) {
    try {
      const { id } = req.params;
      const connector = db.get('SELECT * FROM connectors WHERE id = ?', [id]);
      if (!connector) return res.status(404).json({ error: 'Connector not found' });

      let pingResult = null;
      if (connector.department === 'EDUCATION') {
        pingResult = await educationConnector.testConnection();
      } else if (connector.department === 'REVENUE') {
        pingResult = await revenueConnector.testConnection();
      } else if (connector.department === 'WELFARE') {
        pingResult = await welfareConnector.testConnection();
      } else {
        pingResult = await citizenRegistryConnector.testConnection();
      }

      auditService.log({
        actorId: req.user ? req.user.id : 'ADMIN',
        action: 'CONNECTOR_PING_TEST',
        entityType: 'CONNECTOR',
        entityId: id,
        description: `Ping test run on ${connector.name}: ${pingResult.success ? 'HEALTHY' : 'UNHEALTHY'}`,
        metadata: pingResult
      });

      res.json(pingResult);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getAuditLogs(req, res) {
    try {
      const { limit = 50, action, entityType } = req.query;
      let query = 'SELECT * FROM auditLogs';
      const conditions = [];
      const params = [];

      if (action) {
        conditions.push('action = ?');
        params.push(action);
      }
      if (entityType) {
        conditions.push('entityType = ?');
        params.push(entityType);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY timestamp DESC LIMIT ?';
      params.push(Number(limit));

      const logs = db.all(query, params).map(log => {
        try {
          return { ...log, metadata: JSON.parse(log.metadata || '{}') };
        } catch {
          return log;
        }
      });

      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getDataQualityIssues(req, res) {
    try {
      const { resolved } = req.query;
      let query = 'SELECT * FROM dataQualityIssues';
      const params = [];

      if (resolved !== undefined) {
        query += ' WHERE resolved = ?';
        params.push(resolved === 'true' ? 1 : 0);
      }

      query += ' ORDER BY createdAt DESC';
      const issues = db.all(query, params);
      res.json(issues);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async resolveDataQualityIssue(req, res) {
    try {
      const { id } = req.params;
      db.run('UPDATE dataQualityIssues SET resolved = 1 WHERE id = ?', [id]);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async resetData(req, res) {
    try {
      await seedData(true);
      res.json({ success: true, message: 'Database reset and re-seeded with demo records successfully.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new AdminController();
