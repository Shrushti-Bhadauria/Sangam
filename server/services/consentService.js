const { db } = require('../config/database');
const auditService = require('./auditService');
const notificationService = require('./notificationService');
const eventStream = require('./eventStreamService');

class ConsentService {
  createConsentRequest({ citizenId, applicationId, requestedBy, purpose, dataFields }) {
    const id = `CSN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString(); // 30 days validity
    const fieldsString = Array.isArray(dataFields) ? JSON.stringify(dataFields) : dataFields;

    db.run(
      'INSERT INTO consents (id, citizenId, applicationId, requestedBy, purpose, dataFields, status, grantedAt, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, citizenId, applicationId, requestedBy, purpose, fieldsString, 'PENDING', null, expiresAt, createdAt]
    );

    // Notify citizen
    const citizen = db.get('SELECT * FROM citizens WHERE id = ?', [citizenId]);
    if (citizen) {
      notificationService.createNotification(
        citizen.userId,
        'Action Required: Consent Requested',
        `${requestedBy} has requested access to verify your documents for application ${applicationId}.`,
        'ACTION_REQUIRED'
      );
    }

    auditService.log({
      actorId: 'SYSTEM',
      action: 'CONSENT_REQUESTED',
      entityType: 'CONSENT',
      entityId: id,
      description: `Consent request issued to citizen ${citizenId} for ${requestedBy}`,
      metadata: { applicationId, purpose, fields: dataFields }
    });

    const consent = { id, citizenId, applicationId, requestedBy, purpose, dataFields: fieldsString, status: 'PENDING', grantedAt: null, expiresAt, createdAt };
    eventStream.broadcast('CONSENT_UPDATED', consent);
    return consent;
  }

  approveConsent(consentId, actorId) {
    const consent = db.get('SELECT * FROM consents WHERE id = ?', [consentId]);
    if (!consent) throw new Error('Consent record not found');

    const grantedAt = new Date().toISOString();
    db.run("UPDATE consents SET status = 'APPROVED', grantedAt = ? WHERE id = ?", [grantedAt, consentId]);

    // Update application stage if applicable
    db.run(
      "UPDATE applications SET status = 'IDENTITY_VERIFICATION', currentStage = 'CONSENT_GRANTED' WHERE id = ?",
      [consent.applicationId]
    );

    auditService.log({
      actorId,
      action: 'CONSENT_APPROVED',
      entityType: 'CONSENT',
      entityId: consentId,
      description: `Citizen granted consent for data sharing to ${consent.requestedBy}`,
      metadata: { applicationId: consent.applicationId }
    });

    const updated = { ...consent, status: 'APPROVED', grantedAt };
    eventStream.broadcast('CONSENT_UPDATED', updated);
    eventStream.broadcast('APPLICATION_UPDATED', { id: consent.applicationId, status: 'IDENTITY_VERIFICATION', stage: 'CONSENT_GRANTED' });

    return updated;
  }

  rejectConsent(consentId, actorId, reason = 'Citizen declined consent') {
    const consent = db.get('SELECT * FROM consents WHERE id = ?', [consentId]);
    if (!consent) throw new Error('Consent record not found');

    db.run("UPDATE consents SET status = 'REJECTED' WHERE id = ?", [consentId]);
    db.run(
      "UPDATE applications SET status = 'CONSENT_REQUIRED', currentStage = 'CONSENT_REJECTED', remarks = ? WHERE id = ?",
      [reason, consent.applicationId]
    );

    auditService.log({
      actorId,
      action: 'CONSENT_REJECTED',
      entityType: 'CONSENT',
      entityId: consentId,
      description: `Citizen rejected consent for ${consent.requestedBy}`,
      metadata: { reason }
    });

    const updated = { ...consent, status: 'REJECTED' };
    eventStream.broadcast('CONSENT_UPDATED', updated);
    return updated;
  }

  revokeConsent(consentId, actorId) {
    const consent = db.get('SELECT * FROM consents WHERE id = ?', [consentId]);
    if (!consent) throw new Error('Consent record not found');

    db.run("UPDATE consents SET status = 'REVOKED' WHERE id = ?", [consentId]);

    auditService.log({
      actorId,
      action: 'CONSENT_REVOKED',
      entityType: 'CONSENT',
      entityId: consentId,
      description: `Citizen revoked previously granted consent for ${consent.requestedBy}`,
      metadata: { consentId }
    });

    const updated = { ...consent, status: 'REVOKED' };
    eventStream.broadcast('CONSENT_UPDATED', updated);
    return updated;
  }

  getCitizenConsents(citizenId) {
    return db.all('SELECT * FROM consents WHERE citizenId = ? ORDER BY createdAt DESC', [citizenId]);
  }

  hasValidConsent(citizenId, applicationId) {
    const consent = db.get(
      "SELECT * FROM consents WHERE citizenId = ? AND applicationId = ? AND status = 'APPROVED'",
      [citizenId, applicationId]
    );
    if (!consent) return false;

    // Check expiration
    if (consent.expiresAt && new Date(consent.expiresAt) < new Date()) {
      return false;
    }
    return true;
  }
}

module.exports = new ConsentService();
