const { db } = require('../config/database');
const identityService = require('./identityService');
const consentService = require('./consentService');
const mappingService = require('./mappingService');
const validationService = require('./validationService');
const notificationService = require('./notificationService');
const auditService = require('./auditService');
const eventStream = require('./eventStreamService');

const revenueConnector = require('../connectors/revenueConnector');
const educationConnector = require('../connectors/educationConnector');
const welfareConnector = require('../connectors/welfareConnector');
const citizenRegistryConnector = require('../connectors/citizenRegistryConnector');

class WorkflowService {
  /**
   * Executes the full interoperability data synchronization pipeline
   */
  async executeInteroperabilitySync({ applicationId, citizenId, targetDepartment = 'REVENUE', actorId = 'SYSTEM', forceFailure = false }) {
    const citizen = identityService.resolveCitizen(citizenId);
    if (!citizen) throw new Error(`Citizen not found: ${citizenId}`);

    const application = db.get('SELECT * FROM applications WHERE id = ?', [applicationId]);
    if (!application) throw new Error(`Application not found: ${applicationId}`);

    // 1. Consent Verification
    const hasConsent = consentService.hasValidConsent(citizen.id, applicationId);
    if (!hasConsent) {
      throw new Error(`Citizen consent required before accessing ${targetDepartment} Department data.`);
    }

    // 2. Identity Resolution
    const externalDeptId = identityService.getDepartmentIdentifier(citizen.id, targetDepartment);
    if (!externalDeptId) {
      throw new Error(`No mapped identifier found for citizen in ${targetDepartment} Department.`);
    }

    const eventId = `EVT-INT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const createdAt = new Date().toISOString();

    const requestPayload = {
      sangamId: citizen.sangamId,
      citizenFullName: citizen.fullName,
      targetDepartment,
      externalRecordId: externalDeptId,
      purpose: application.serviceType,
      requestedFields: ['income_amount', 'land_holding_acres', 'issue_date', 'valid_until']
    };

    // Save initial Integration Event in database
    db.run(
      'INSERT INTO integrationEvents (id, applicationId, citizenId, sourceDepartment, targetDepartment, operation, status, requestPayload, responsePayload, mappingStatus, validationStatus, errorMessage, retryCount, createdAt, completedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [eventId, applicationId, citizen.id, application.department, targetDepartment, `SYNC_${targetDepartment}_RECORDS`, 'PROCESSING', JSON.stringify(requestPayload), null, 'PENDING', 'PENDING', null, 0, createdAt, null]
    );

    // Update Application stage
    db.run(
      "UPDATE applications SET status = 'DATA_REQUESTED', currentStage = 'REQUESTING_REVENUE_DATA', integrationStatus = 'PENDING', updatedAt = ? WHERE id = ?",
      [new Date().toISOString(), applicationId]
    );
    eventStream.broadcast('APPLICATION_UPDATED', { id: applicationId, status: 'DATA_REQUESTED', stage: 'REQUESTING_REVENUE_DATA' });

    auditService.log({
      actorId,
      action: 'INTEGRATION_INVOKED',
      entityType: 'INTEGRATION_EVENT',
      entityId: eventId,
      description: `Dispatched interoperability sync request to ${targetDepartment} for application ${application.applicationNumber}`,
      metadata: requestPayload
    });

    try {
      // 3. Department Connector Invocation (Simulated realistic network delay)
      await new Promise(resolve => setTimeout(resolve, 600));

      let connectorResponse = null;
      if (targetDepartment === 'REVENUE') {
        connectorResponse = await revenueConnector.fetchIncomeCertificate(externalDeptId, forceFailure);
      } else if (targetDepartment === 'EDUCATION') {
        connectorResponse = await educationConnector.fetchStudentRecord(externalDeptId);
      } else if (targetDepartment === 'WELFARE') {
        connectorResponse = await welfareConnector.fetchBeneficiaryProfile(externalDeptId);
      } else {
        connectorResponse = await citizenRegistryConnector.resolveCitizen(citizen.sangamId);
      }

      // 4. Canonical Data Mapping
      const mappingResult = mappingService.mapDepartmentData(targetDepartment, connectorResponse.rawPayload);

      // 5. Data Validation & Rules Evaluation
      const validationResult = validationService.validatePayload({
        canonicalData: mappingResult.canonicalData,
        serviceType: application.serviceType,
        integrationEventId: eventId,
        citizenName: citizen.fullName
      });

      const completedAt = new Date().toISOString();

      // 6. Update Integration Event in Database to SUCCESS
      db.run(
        "UPDATE integrationEvents SET status = 'SUCCESS', responsePayload = ?, mappingStatus = ?, validationStatus = ?, completedAt = ? WHERE id = ?",
        [JSON.stringify(connectorResponse), mappingResult.status, validationResult.status, completedAt, eventId]
      );

      // 7. Update Application with verified documents and status
      let verifiedDocs = [];
      try {
        verifiedDocs = JSON.parse(application.verifiedDocuments || '[]');
      } catch {
        verifiedDocs = [];
      }

      verifiedDocs.push({
        documentName: 'Income Certificate (Revenue Records)',
        department: targetDepartment,
        verifiedAt: completedAt,
        data: mappingResult.canonicalData
      });

      const newStatus = validationResult.status === 'INVALID' ? 'UNDER_REVIEW' : 'UNDER_REVIEW';
      const stageName = 'DATA_RECEIVED_VERIFIED';

      db.run(
        "UPDATE applications SET status = ?, currentStage = ?, verifiedDocuments = ?, integrationStatus = 'SUCCESS', updatedAt = ?, remarks = ? WHERE id = ?",
        [
          newStatus,
          stageName,
          JSON.stringify(verifiedDocs),
          completedAt,
          `Income data dynamically verified via Revenue Department Connector. Annual Income: ₹${mappingResult.canonicalData.annualIncome.toLocaleString('en-IN')}`,
          applicationId
        ]
      );

      // 8. Notifications & Audit
      notificationService.createNotification(
        citizen.userId,
        'Government Documents Verified',
        `Your Income Certificate was automatically retrieved and verified from the Revenue Department for ${application.serviceType}. No manual upload was required!`,
        'SUCCESS'
      );

      auditService.log({
        actorId: 'SANGAM_ENGINE',
        action: 'INTEGRATION_COMPLETED_SUCCESS',
        entityType: 'INTEGRATION_EVENT',
        entityId: eventId,
        description: `Successfully synchronized and mapped ${targetDepartment} data for ${citizen.fullName} (${citizen.sangamId})`,
        metadata: { validationStatus: validationResult.status, mappingStatus: mappingResult.status }
      });

      const updatedApplication = db.get('SELECT * FROM applications WHERE id = ?', [applicationId]);
      eventStream.broadcast('APPLICATION_UPDATED', updatedApplication);
      eventStream.broadcast('INTEGRATION_EVENT_UPDATED', { id: eventId, status: 'SUCCESS' });

      return {
        success: true,
        eventId,
        canonicalData: mappingResult.canonicalData,
        validation: validationResult,
        application: updatedApplication
      };
    } catch (error) {
      const completedAt = new Date().toISOString();
      const errorMessage = error.message || 'Department Connector execution failed';

      // Record Failure in Integration Event
      db.run(
        "UPDATE integrationEvents SET status = 'FAILED', responsePayload = ?, errorMessage = ?, completedAt = ? WHERE id = ?",
        [JSON.stringify({ error: errorMessage, statusCode: error.statusCode || 500 }), errorMessage, completedAt, eventId]
      );

      // Update Application
      db.run(
        "UPDATE applications SET status = 'FAILED', currentStage = 'INTEGRATION_FAILED', integrationStatus = 'FAILED', updatedAt = ?, remarks = ? WHERE id = ?",
        [completedAt, `Integration failure with ${targetDepartment}: ${errorMessage}`, applicationId]
      );

      // Record Data Quality Issue
      validationService.recordIssues(eventId, [
        {
          field: 'connection',
          issueType: 'UPSTREAM_GATEWAY_TIMEOUT',
          description: errorMessage,
          severity: 'HIGH'
        }
      ]);

      notificationService.createNotification(
        citizen.userId,
        'Data Sync Paused',
        `Verification with ${targetDepartment} is temporarily paused. Sangam integration administrators are reviewing the connector.`,
        'ALERT'
      );

      auditService.log({
        actorId: 'SANGAM_ENGINE',
        action: 'INTEGRATION_FAILED',
        entityType: 'INTEGRATION_EVENT',
        entityId: eventId,
        description: `Interoperability request to ${targetDepartment} failed: ${errorMessage}`,
        metadata: { error: errorMessage }
      });

      eventStream.broadcast('INTEGRATION_EVENT_UPDATED', { id: eventId, status: 'FAILED', error: errorMessage });
      eventStream.broadcast('APPLICATION_UPDATED', { id: applicationId, status: 'FAILED', stage: 'INTEGRATION_FAILED' });

      return {
        success: false,
        eventId,
        error: errorMessage
      };
    }
  }

  /**
   * Retries a failed integration event (Section 7 requirement)
   */
  async retryIntegration(eventId, actorId = 'INTEGRATION_ADMIN') {
    const event = db.get('SELECT * FROM integrationEvents WHERE id = ?', [eventId]);
    if (!event) throw new Error('Integration event not found');

    const newRetryCount = (event.retryCount || 0) + 1;

    // Set state to RETRYING
    db.run(
      "UPDATE integrationEvents SET status = 'RETRYING', retryCount = ?, errorMessage = null WHERE id = ?",
      [newRetryCount, eventId]
    );

    auditService.log({
      actorId,
      action: 'INTEGRATION_RETRY_INITIATED',
      entityType: 'INTEGRATION_EVENT',
      entityId: eventId,
      description: `Administrator triggered retry attempt #${newRetryCount} for event ${eventId}`,
      metadata: { retryCount: newRetryCount }
    });

    eventStream.broadcast('INTEGRATION_EVENT_UPDATED', { id: eventId, status: 'RETRYING', retryCount: newRetryCount });

    // Wait brief moment to simulate recovery connection
    await new Promise(res => setTimeout(res, 800));

    // Force failureMode off for recovery
    revenueConnector.setFailureMode(false);

    // Fetch record directly from department records (or target connector)
    const deptRecord = db.get(
      'SELECT * FROM departmentRecords WHERE citizenId = ? AND department = ?',
      [event.citizenId, event.targetDepartment]
    );

    if (!deptRecord) {
      db.run("UPDATE integrationEvents SET status = 'FAILED', errorMessage = 'Record still unreachable' WHERE id = ?", [eventId]);
      throw new Error('Department record unreachable during retry.');
    }

    const rawPayload = JSON.parse(deptRecord.data);
    const mappingResult = mappingService.mapDepartmentData(event.targetDepartment, rawPayload);
    const validationResult = validationService.validatePayload({
      canonicalData: mappingResult.canonicalData,
      serviceType: 'Scholarship',
      integrationEventId: eventId
    });

    const completedAt = new Date().toISOString();

    // Update event to SUCCESS
    db.run(
      "UPDATE integrationEvents SET status = 'SUCCESS', responsePayload = ?, mappingStatus = ?, validationStatus = ?, errorMessage = null, completedAt = ? WHERE id = ?",
      [JSON.stringify({ rawPayload, recoveredViaRetry: true }), mappingResult.status, validationResult.status, completedAt, eventId]
    );

    // Resolve any data quality issues
    db.run('UPDATE dataQualityIssues SET resolved = 1 WHERE integrationEventId = ?', [eventId]);

    // Update application
    if (event.applicationId) {
      const app = db.get('SELECT * FROM applications WHERE id = ?', [event.applicationId]);
      let verifiedDocs = [];
      try {
        verifiedDocs = JSON.parse(app.verifiedDocuments || '[]');
      } catch {
        verifiedDocs = [];
      }

      verifiedDocs.push({
        documentName: 'Income Certificate (Revenue Records - Recovered)',
        department: event.targetDepartment,
        verifiedAt: completedAt,
        data: mappingResult.canonicalData
      });

      db.run(
        "UPDATE applications SET status = 'UNDER_REVIEW', currentStage = 'DATA_RECEIVED_VERIFIED', verifiedDocuments = ?, integrationStatus = 'SUCCESS', updatedAt = ?, remarks = 'Integration recovered via Admin retry.' WHERE id = ?",
        [JSON.stringify(verifiedDocs), completedAt, event.applicationId]
      );
    }

    // Citizen notification
    const citizen = db.get('SELECT * FROM citizens WHERE id = ?', [event.citizenId]);
    if (citizen) {
      notificationService.createNotification(
        citizen.userId,
        'Verification Restored',
        `The data sync with ${event.targetDepartment} has been successfully completed by the integration admin. Your application is now Under Review.`,
        'SUCCESS'
      );
    }

    auditService.log({
      actorId,
      action: 'INTEGRATION_RETRY_SUCCESS',
      entityType: 'INTEGRATION_EVENT',
      entityId: eventId,
      description: `Integration event ${eventId} recovered and completed successfully on retry #${newRetryCount}`,
      metadata: { retryCount: newRetryCount }
    });

    eventStream.broadcast('INTEGRATION_EVENT_UPDATED', { id: eventId, status: 'SUCCESS', retryCount: newRetryCount });
    if (event.applicationId) {
      eventStream.broadcast('APPLICATION_UPDATED', { id: event.applicationId, status: 'UNDER_REVIEW', stage: 'DATA_RECEIVED_VERIFIED' });
    }

    return {
      success: true,
      eventId,
      retryCount: newRetryCount,
      status: 'SUCCESS'
    };
  }
}

module.exports = new WorkflowService();
