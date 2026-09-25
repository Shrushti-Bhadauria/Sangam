const { db } = require('../config/database');
const identityService = require('../services/identityService');

class CitizenController {
  async getProfile(req, res) {
    try {
      const citizen = identityService.resolveCitizen(req.user.id);
      if (!citizen) return res.status(404).json({ error: 'Citizen profile not found.' });
      res.json(citizen);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async listCitizens(req, res) {
    try {
      const { search } = req.query;
      let query = 'SELECT * FROM citizens';
      let params = [];

      if (search) {
        query += ' WHERE fullName LIKE ? OR sangamId LIKE ? OR email LIKE ? OR district LIKE ?';
        const s = `%${search}%`;
        params = [s, s, s, s];
      }

      query += ' ORDER BY createdAt DESC';
      const citizens = db.all(query, params).map(c => {
        try {
          return { ...c, identityMappings: JSON.parse(c.identityMappings) };
        } catch {
          return c;
        }
      });

      res.json(citizens);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Citizen 360: Aggregated unified view of all departmental records, applications, consents, and audit logs
   */
  async getCitizen360(req, res) {
    try {
      const { id } = req.params;
      const citizen = identityService.resolveCitizen(id);
      if (!citizen) return res.status(404).json({ error: 'Citizen not found' });

      // If requester is a CITIZEN, make sure they only view their own 360 profile!
      if (req.user.role === 'CITIZEN' && citizen.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied. You can only view your own Citizen 360 profile.' });
      }

      // Department Records
      const rawDeptRecords = db.all('SELECT * FROM departmentRecords WHERE citizenId = ?', [citizen.id]);
      const departmentRecords = rawDeptRecords.map(r => {
        try {
          return { ...r, data: JSON.parse(r.data) };
        } catch {
          return r;
        }
      });

      // Applications
      const applications = db.all('SELECT * FROM applications WHERE citizenId = ? ORDER BY updatedAt DESC', [citizen.id]);

      // Consents
      const consents = db.all('SELECT * FROM consents WHERE citizenId = ? ORDER BY createdAt DESC', [citizen.id]);

      // Integration Events
      const integrationEvents = db.all('SELECT * FROM integrationEvents WHERE citizenId = ? ORDER BY createdAt DESC', [citizen.id]);

      // Audit logs relating to this citizen
      const auditLogs = db.all(
        "SELECT * FROM auditLogs WHERE entityId = ? OR metadata LIKE ? ORDER BY timestamp DESC LIMIT 30",
        [citizen.id, `%${citizen.sangamId}%`]
      );

      res.json({
        citizen,
        departmentRecords,
        applications,
        consents,
        integrationEvents,
        auditLogs
      });
    } catch (err) {
      console.error('Citizen 360 error:', err);
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new CitizenController();
