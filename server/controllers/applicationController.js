const { db } = require('../config/database');
const identityService = require('../services/identityService');
const consentService = require('../services/consentService');
const auditService = require('../services/auditService');
const notificationService = require('../services/notificationService');
const eventStream = require('../services/eventStreamService');

class ApplicationController {
  async createApplication(req, res) {
    try {
      const { serviceType = 'Maharashtra Post-Matric Scholarship (Higher Education)', department = 'EDUCATION', remarks } = req.body;

      const citizen = identityService.resolveCitizen(req.user.id);
      if (!citizen) {
        return res.status(404).json({ error: 'Citizen record not found for this account.' });
      }

      const applicationId = `APP-2026-${department.substring(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const applicationNumber = applicationId;
      const now = new Date().toISOString();

      const requiredDocuments = [
        'Income Certificate (Revenue Department)',
        'Student Enrollment Record (Education Department)',
        'Domicile / Citizen Registry Proof'
      ];

      // Save application with initial status: CONSENT_REQUIRED
      db.run(
        'INSERT INTO applications (id, applicationNumber, citizenId, serviceType, department, status, submittedAt, updatedAt, currentStage, remarks, requiredDocuments, verifiedDocuments, integrationStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          applicationId,
          applicationNumber,
          citizen.id,
          serviceType,
          department,
          'CONSENT_REQUIRED',
          now,
          now,
          'APPLICATION_SUBMITTED',
          remarks || 'Application initiated. Awaiting citizen consent for automated inter-departmental verification.',
          JSON.stringify(requiredDocuments),
          JSON.stringify([]),
          'PENDING'
        ]
      );

      // Automatically create a Consent Request for Revenue Department verification!
      const consent = consentService.createConsentRequest({
        citizenId: citizen.id,
        applicationId,
        requestedBy: `${department} Department (Scholarship Directorate)`,
        purpose: 'Automated retrieval & verification of Income Certificate from Revenue Department to assess scholarship eligibility',
        dataFields: ['annualIncome', 'landHoldingAcres', 'incomeCertificateDate', 'rationCardCategory', 'verificationStatus']
      });

      // Audit log
      auditService.log({
        actorId: req.user.id,
        action: 'APPLICATION_SUBMITTED',
        entityType: 'APPLICATION',
        entityId: applicationId,
        description: `Citizen ${citizen.fullName} submitted application ${applicationNumber} for ${serviceType}`,
        metadata: { citizenId: citizen.id, sangamId: citizen.sangamId, serviceType }
      });

      // Citizen notification
      notificationService.createNotification(
        req.user.id,
        'Application Submitted: Action Required',
        `Your application ${applicationNumber} is received. Please approve the consent request to automatically fetch your Revenue documents.`,
        'ACTION_REQUIRED'
      );

      const createdApp = db.get('SELECT * FROM applications WHERE id = ?', [applicationId]);
      eventStream.broadcast('APPLICATION_CREATED', createdApp);

      res.status(201).json({
        application: createdApp,
        consent
      });
    } catch (err) {
      console.error('Error creating application:', err);
      res.status(500).json({ error: 'Failed to create application: ' + err.message });
    }
  }

  async listApplications(req, res) {
    try {
      const { status, department, search } = req.query;
      let query = `
        SELECT a.*, c.fullName as citizenName, c.sangamId, c.district, c.mobile, c.email as citizenEmail
        FROM applications a
        JOIN citizens c ON a.citizenId = c.id
      `;
      const conditions = [];
      const params = [];

      // If citizen, filter to only their own applications
      if (req.user.role === 'CITIZEN') {
        const citizen = identityService.resolveCitizen(req.user.id);
        if (!citizen) return res.json([]);
        conditions.push('a.citizenId = ?');
        params.push(citizen.id);
      }

      if (status && status !== 'ALL') {
        conditions.push('a.status = ?');
        params.push(status);
      }

      if (department && department !== 'ALL') {
        conditions.push('a.department = ?');
        params.push(department);
      }

      if (search) {
        conditions.push('(a.applicationNumber LIKE ? OR c.fullName LIKE ? OR c.sangamId LIKE ? OR a.serviceType LIKE ?)');
        const s = `%${search}%`;
        params.push(s, s, s, s);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY a.updatedAt DESC';
      const applications = db.all(query, params).map(app => {
        try {
          return {
            ...app,
            requiredDocuments: JSON.parse(app.requiredDocuments || '[]'),
            verifiedDocuments: JSON.parse(app.verifiedDocuments || '[]')
          };
        } catch {
          return app;
        }
      });

      res.json(applications);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getApplicationById(req, res) {
    try {
      const { id } = req.params;
      const app = db.get(
        `SELECT a.*, c.fullName as citizenName, c.sangamId, c.district, c.taluka, c.village, c.address, c.mobile, c.email as citizenEmail, c.identityMappings
         FROM applications a
         JOIN citizens c ON a.citizenId = c.id
         WHERE a.id = ?`,
        [id]
      );

      if (!app) return res.status(404).json({ error: 'Application not found.' });

      // Privacy check: citizen can only view their own
      if (req.user.role === 'CITIZEN') {
        const citizen = identityService.resolveCitizen(req.user.id);
        if (!citizen || citizen.id !== app.citizenId) {
          return res.status(403).json({ error: 'Unauthorized to view this application.' });
        }
      }

      // Associated Consents
      const consents = db.all('SELECT * FROM consents WHERE applicationId = ?', [app.id]);

      // Associated Integration Events
      const integrationEvents = db.all('SELECT * FROM integrationEvents WHERE applicationId = ? ORDER BY createdAt DESC', [app.id]);

      res.json({
        ...app,
        requiredDocuments: JSON.parse(app.requiredDocuments || '[]'),
        verifiedDocuments: JSON.parse(app.verifiedDocuments || '[]'),
        identityMappings: JSON.parse(app.identityMappings || '{}'),
        consents,
        integrationEvents
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateApplicationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;

      if (!['UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be UNDER_REVIEW, APPROVED, or REJECTED.' });
      }

      const app = db.get('SELECT * FROM applications WHERE id = ?', [id]);
      if (!app) return res.status(404).json({ error: 'Application not found.' });

      const updatedAt = new Date().toISOString();
      const stage = status === 'APPROVED' ? 'SANCTIONED_APPROVED' : status === 'REJECTED' ? 'APPLICATION_REJECTED' : 'OFFICER_REVIEW';

      db.run(
        'UPDATE applications SET status = ?, currentStage = ?, remarks = ?, updatedAt = ? WHERE id = ?',
        [status, stage, remarks || `Status updated to ${status} by department officer`, updatedAt, id]
      );

      // Audit log
      auditService.log({
        actorId: req.user.id,
        action: `APPLICATION_${status}`,
        entityType: 'APPLICATION',
        entityId: id,
        description: `Department Officer ${req.user.name} changed status of application ${app.applicationNumber} to ${status}`,
        metadata: { previousStatus: app.status, newStatus: status, remarks }
      });

      // Citizen notification
      const citizen = db.get('SELECT * FROM citizens WHERE id = ?', [app.citizenId]);
      if (citizen) {
        notificationService.createNotification(
          citizen.userId,
          `Application Update: ${status}`,
          `Your application ${app.applicationNumber} has been updated to "${status}". Officer Remarks: "${remarks || 'None'}"`,
          status === 'APPROVED' ? 'SUCCESS' : status === 'REJECTED' ? 'ALERT' : 'INFO'
        );
      }

      const updated = db.get('SELECT * FROM applications WHERE id = ?', [id]);
      eventStream.broadcast('APPLICATION_UPDATED', updated);

      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new ApplicationController();
