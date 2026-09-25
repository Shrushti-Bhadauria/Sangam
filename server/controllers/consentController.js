const consentService = require('../services/consentService');
const identityService = require('../services/identityService');
const workflowService = require('../services/workflowService');

class ConsentController {
  async getConsents(req, res) {
    try {
      const citizen = identityService.resolveCitizen(req.user.id);
      if (!citizen) return res.status(404).json({ error: 'Citizen not found' });

      const consents = consentService.getCitizenConsents(citizen.id);
      res.json(consents.map(c => {
        try {
          return { ...c, dataFields: JSON.parse(c.dataFields) };
        } catch {
          return c;
        }
      }));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async approveConsent(req, res) {
    try {
      const { id } = req.params;
      const citizen = identityService.resolveCitizen(req.user.id);
      if (!citizen) return res.status(404).json({ error: 'Citizen not found' });

      const updatedConsent = consentService.approveConsent(id, req.user.id);

      // Auto-trigger the interoperability synchronization for the associated application
      let syncResult = null;
      if (updatedConsent.applicationId) {
        try {
          syncResult = await workflowService.executeInteroperabilitySync({
            applicationId: updatedConsent.applicationId,
            citizenId: citizen.id,
            targetDepartment: 'REVENUE',
            actorId: req.user.id
          });
        } catch (syncErr) {
          console.warn('Interoperability sync during consent approval encountered error:', syncErr.message);
        }
      }

      res.json({
        consent: updatedConsent,
        syncResult
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async rejectConsent(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const citizen = identityService.resolveCitizen(req.user.id);
      if (!citizen) return res.status(404).json({ error: 'Citizen not found' });

      const updated = consentService.rejectConsent(id, req.user.id, reason);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async revokeConsent(req, res) {
    try {
      const { id } = req.params;
      const citizen = identityService.resolveCitizen(req.user.id);
      if (!citizen) return res.status(404).json({ error: 'Citizen not found' });

      const updated = consentService.revokeConsent(id, req.user.id);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new ConsentController();
