const bcrypt = require('bcryptjs');
const { db } = require('../config/database');

async function seedData(force = false) {
  const existingUsers = db.all('SELECT * FROM users LIMIT 1');
  if (existingUsers.length > 0 && !force) {
    console.log('Database already seeded. Skipping initial seed.');
    return;
  }

  console.log('Seeding fresh demo data for SIH 2026 SANGAM Prototype...');

  // Clear existing records if force
  if (force) {
    db.run('DELETE FROM dataQualityIssues');
    db.run('DELETE FROM connectors');
    db.run('DELETE FROM auditLogs');
    db.run('DELETE FROM notifications');
    db.run('DELETE FROM departmentRecords');
    db.run('DELETE FROM integrationEvents');
    db.run('DELETE FROM consents');
    db.run('DELETE FROM applications');
    db.run('DELETE FROM citizens');
    db.run('DELETE FROM users');
  }

  const salt = bcrypt.genSaltSync(10);
  const citizenPass = bcrypt.hashSync('citizen123', salt);
  const officerPass = bcrypt.hashSync('officer123', salt);
  const adminPass = bcrypt.hashSync('admin123', salt);

  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();

  // 1. Users
  const users = [
    {
      id: 'USR-CITIZEN-001',
      name: 'Ananya Ramesh Patil',
      email: 'citizen@sangam.gov.in',
      phone: '+91 98230 45678',
      password: citizenPass,
      role: 'CITIZEN',
      preferredLanguage: 'en',
      createdAt: twoDaysAgo,
      updatedAt: now
    },
    {
      id: 'USR-CITIZEN-002',
      name: 'Rahul Vilas Shinde',
      email: 'rahul.shinde@example.com',
      phone: '+91 98451 90812',
      password: citizenPass,
      role: 'CITIZEN',
      preferredLanguage: 'mr',
      createdAt: twoDaysAgo,
      updatedAt: now
    },
    {
      id: 'USR-OFFICER-001',
      name: 'Suresh Deshmukh',
      email: 'officer@sangam.gov.in',
      phone: '+91 94220 12345',
      password: officerPass,
      role: 'DEPARTMENT_OFFICER',
      preferredLanguage: 'en',
      createdAt: twoDaysAgo,
      updatedAt: now
    },
    {
      id: 'USR-ADMIN-001',
      name: 'Dr. Neha Kulkarni',
      email: 'admin@sangam.gov.in',
      phone: '+91 98221 67890',
      password: adminPass,
      role: 'INTEGRATION_ADMIN',
      preferredLanguage: 'en',
      createdAt: twoDaysAgo,
      updatedAt: now
    }
  ];

  for (const u of users) {
    db.run(
      'INSERT INTO users (id, name, email, phone, password, role, preferredLanguage, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [u.id, u.name, u.email, u.phone, u.password, u.role, u.preferredLanguage, u.createdAt, u.updatedAt]
    );
  }

  // 2. Citizens
  const citizens = [
    {
      id: 'CIT-001',
      userId: 'USR-CITIZEN-001',
      sangamId: 'SGM-MH-102934',
      fullName: 'Ananya Ramesh Patil',
      mobile: '+91 98230 45678',
      email: 'citizen@sangam.gov.in',
      address: 'Plot 42, Anand Nagar, Ring Road',
      district: 'Pune',
      taluka: 'Haveli',
      village: 'Manjri',
      identityMappings: JSON.stringify({
        sangamId: 'SGM-MH-102934',
        educationId: 'EDU-92831',
        revenueId: 'REV-44921',
        welfareId: 'WEL-77182',
        aadhaarRef: 'VID-9921-4820-1923'
      }),
      createdAt: twoDaysAgo,
      updatedAt: now
    },
    {
      id: 'CIT-002',
      userId: 'USR-CITIZEN-002',
      sangamId: 'SGM-MH-552109',
      fullName: 'Rahul Vilas Shinde',
      mobile: '+91 98451 90812',
      email: 'rahul.shinde@example.com',
      address: 'House 14, Gaothan, Baramati',
      district: 'Pune',
      taluka: 'Baramati',
      village: 'Supa',
      identityMappings: JSON.stringify({
        sangamId: 'SGM-MH-552109',
        educationId: 'EDU-11029',
        revenueId: 'REV-88102',
        welfareId: 'WEL-33019',
        aadhaarRef: 'VID-3849-1029-4411'
      }),
      createdAt: twoDaysAgo,
      updatedAt: now
    }
  ];

  for (const c of citizens) {
    db.run(
      'INSERT INTO citizens (id, userId, sangamId, fullName, mobile, email, address, district, taluka, village, identityMappings, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [c.id, c.userId, c.sangamId, c.fullName, c.mobile, c.email, c.address, c.district, c.taluka, c.village, c.identityMappings, c.createdAt, c.updatedAt]
    );
  }

  // 3. Connectors
  const connectors = [
    {
      id: 'CONN-EDU-01',
      name: 'Higher & Technical Education Portal (MahaDBT)',
      department: 'EDUCATION',
      connectorType: 'REST/JSON Webhook',
      endpoint: 'https://api.internal.mahadbt.gov.in/v2/students',
      status: 'ACTIVE',
      lastSync: new Date(Date.now() - 3600000).toISOString(),
      successCount: 1420,
      failureCount: 4,
      averageResponseTime: 145,
      enabled: 1
    },
    {
      id: 'CONN-REV-01',
      name: 'Revenue & Land Records Gateway (MahaBhumi/AapleSarkar)',
      department: 'REVENUE',
      connectorType: 'SOAP/REST Interoperability Adapter',
      endpoint: 'https://api.internal.revenue.maharashtra.gov.in/v1/certificates',
      status: 'ACTIVE',
      lastSync: new Date(Date.now() - 1800000).toISOString(),
      successCount: 3892,
      failureCount: 18,
      averageResponseTime: 230,
      enabled: 1
    },
    {
      id: 'CONN-WEL-01',
      name: 'Social Justice & Special Assistance Directorate',
      department: 'WELFARE',
      connectorType: 'REST/OAuth2 Enterprise Service',
      endpoint: 'https://api.internal.sjsa.maharashtra.gov.in/beneficiaries',
      status: 'ACTIVE',
      lastSync: new Date(Date.now() - 7200000).toISOString(),
      successCount: 940,
      failureCount: 2,
      averageResponseTime: 110,
      enabled: 1
    },
    {
      id: 'CONN-REG-01',
      name: 'Maharashtra Citizen Unified Registry (MCUR)',
      department: 'CITIZEN_REGISTRY',
      connectorType: 'e-Pramaan ID Connector',
      endpoint: 'https://api.internal.epramaan.gov.in/id-resolve',
      status: 'ACTIVE',
      lastSync: new Date(Date.now() - 600000).toISOString(),
      successCount: 7850,
      failureCount: 1,
      averageResponseTime: 85,
      enabled: 1
    }
  ];

  for (const conn of connectors) {
    db.run(
      'INSERT INTO connectors (id, name, department, connectorType, endpoint, status, lastSync, successCount, failureCount, averageResponseTime, enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [conn.id, conn.name, conn.department, conn.connectorType, conn.endpoint, conn.status, conn.lastSync, conn.successCount, conn.failureCount, conn.averageResponseTime, conn.enabled]
    );
  }

  // 4. Department Records (Simulated backend departmental data stores)
  const deptRecords = [
    // Ananya Patil's records
    {
      id: 'REC-REV-001',
      citizenId: 'CIT-001',
      department: 'REVENUE',
      externalRecordId: 'REV-44921',
      recordType: 'INCOME_CERTIFICATE',
      data: JSON.stringify({
        certificate_number: 'MH-REV-2025-098124',
        applicant_name: 'Ananya Ramesh Patil',
        father_name: 'Ramesh Vithal Patil',
        income_amount: 180000,
        currency: 'INR',
        financial_year: '2024-2025',
        issuing_authority: 'Tehsildar Office, Haveli, Pune',
        issue_date: '2025-05-14',
        valid_until: '2028-03-31',
        land_holding_acres: 1.5,
        ration_card_type: 'Orange (BPL Category B)',
        verification_status: 'VERIFIED_LEGITIMATE'
      }),
      lastSyncedAt: yesterday,
      sourceSystem: 'MahaBhumi e-Records Engine v3.4'
    },
    {
      id: 'REC-EDU-001',
      citizenId: 'CIT-001',
      department: 'EDUCATION',
      externalRecordId: 'EDU-92831',
      recordType: 'STUDENT_ENROLLMENT',
      data: JSON.stringify({
        enrollment_no: 'COEP-ENG-2023-441',
        institution: 'Government College of Engineering, Pune (COEP Tech)',
        course: 'B.Tech Computer Engineering',
        academic_year: '3rd Year (2025-2026)',
        current_cgpa: 8.74,
        attendance_percentage: 92.5,
        fee_structure_annual: 85000,
        admission_category: 'OBC General'
      }),
      lastSyncedAt: yesterday,
      sourceSystem: 'DTE Maharashtra MIS'
    },
    {
      id: 'REC-WEL-001',
      citizenId: 'CIT-001',
      department: 'WELFARE',
      externalRecordId: 'WEL-77182',
      recordType: 'BENEFICIARY_PROFILE',
      data: JSON.stringify({
        category: 'OBC',
        caste_name: 'Kunbi Maratha',
        caste_cert_no: 'CST-MH-2020-5512',
        non_creamy_layer_cert: 'NCL-2024-88912',
        ncl_valid_until: '2027-03-31',
        prior_benefits_availed: ['State Merit Matric Scholarship 2023'],
        bank_account_seeded: true
      }),
      lastSyncedAt: yesterday,
      sourceSystem: 'Social Justice Mahashiksha v2'
    },
    {
      id: 'REC-CR-001',
      citizenId: 'CIT-001',
      department: 'CITIZEN_REGISTRY',
      externalRecordId: 'CR-MH-33891',
      recordType: 'DEMOGRAPHIC_VERIFICATION',
      data: JSON.stringify({
        sangam_uid: 'SGM-MH-102934',
        full_legal_name: 'Ananya Ramesh Patil',
        dob: '2004-08-19',
        gender: 'Female',
        domicile_state: 'Maharashtra',
        district: 'Pune',
        residence_status: 'Permanent Resident'
      }),
      lastSyncedAt: yesterday,
      sourceSystem: 'Maharashtra e-Pramaan Engine'
    },
    // Rahul Shinde's records
    {
      id: 'REC-REV-002',
      citizenId: 'CIT-002',
      department: 'REVENUE',
      externalRecordId: 'REV-88102',
      recordType: 'INCOME_CERTIFICATE',
      data: JSON.stringify({
        certificate_number: 'MH-REV-2025-014902',
        applicant_name: 'Rahul Vilas Shinde',
        father_name: 'Vilas Shinde',
        income_amount: 140000,
        currency: 'INR',
        financial_year: '2024-2025',
        issuing_authority: 'Sub-Divisional Office, Baramati',
        issue_date: '2025-04-10',
        valid_until: '2028-03-31',
        land_holding_acres: 0.8,
        ration_card_type: 'Yellow (BPL)',
        verification_status: 'VERIFIED_LEGITIMATE'
      }),
      lastSyncedAt: twoDaysAgo,
      sourceSystem: 'MahaBhumi e-Records Engine v3.4'
    }
  ];

  for (const r of deptRecords) {
    db.run(
      'INSERT INTO departmentRecords (id, citizenId, department, externalRecordId, recordType, data, lastSyncedAt, sourceSystem) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [r.id, r.citizenId, r.department, r.externalRecordId, r.recordType, r.data, r.lastSyncedAt, r.sourceSystem]
    );
  }

  // 5. Initial Applications (One active for Rahul to demonstrate failure scenario, Ananya starts clean or ready for demo)
  const applications = [
    {
      id: 'APP-2026-EDU-8812',
      applicationNumber: 'APP-2026-EDU-8812',
      citizenId: 'CIT-002',
      serviceType: 'Maharashtra Post-Matric Scholarship (Higher Education)',
      department: 'EDUCATION',
      status: 'FAILED',
      submittedAt: yesterday,
      updatedAt: yesterday,
      currentStage: 'REVENUE_DATA_SYNC_FAILED',
      remarks: 'Automated Revenue connector timeout during income verification step.',
      requiredDocuments: JSON.stringify(['Income Certificate', 'Domicile Certificate', 'Admission Proof']),
      verifiedDocuments: JSON.stringify([]),
      integrationStatus: 'FAILED'
    }
  ];

  for (const app of applications) {
    db.run(
      'INSERT INTO applications (id, applicationNumber, citizenId, serviceType, department, status, submittedAt, updatedAt, currentStage, remarks, requiredDocuments, verifiedDocuments, integrationStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [app.id, app.applicationNumber, app.citizenId, app.serviceType, app.department, app.status, app.submittedAt, app.updatedAt, app.currentStage, app.remarks, app.requiredDocuments, app.verifiedDocuments, app.integrationStatus]
    );
  }

  // 6. Integration Events
  const integrationEvents = [
    {
      id: 'EVT-INT-8801',
      applicationId: 'APP-2026-EDU-8812',
      citizenId: 'CIT-002',
      sourceDepartment: 'EDUCATION',
      targetDepartment: 'REVENUE',
      operation: 'SYNC_INCOME_CERTIFICATE',
      status: 'FAILED',
      requestPayload: JSON.stringify({
        sangamId: 'SGM-MH-552109',
        targetDeptId: 'REV-88102',
        requiredField: 'income_amount',
        purpose: 'Higher Education Scholarship scheme income ceiling validation'
      }),
      responsePayload: JSON.stringify({
        errorCode: 'CONN_TIMEOUT_504',
        message: 'Revenue Department gateway node cluster 3 temporarily unresponsive.'
      }),
      mappingStatus: 'PENDING',
      validationStatus: 'WARNING',
      errorMessage: 'Revenue Department temporarily unavailable (Gateway Timeout 504). Ready for Admin Retry.',
      retryCount: 0,
      createdAt: yesterday,
      completedAt: null
    }
  ];

  for (const evt of integrationEvents) {
    db.run(
      'INSERT INTO integrationEvents (id, applicationId, citizenId, sourceDepartment, targetDepartment, operation, status, requestPayload, responsePayload, mappingStatus, validationStatus, errorMessage, retryCount, createdAt, completedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [evt.id, evt.applicationId, evt.citizenId, evt.sourceDepartment, evt.targetDepartment, evt.operation, evt.status, evt.requestPayload, evt.responsePayload, evt.mappingStatus, evt.validationStatus, evt.errorMessage, evt.retryCount, evt.createdAt, evt.completedAt]
    );
  }

  // 7. Data Quality Issues
  db.run(
    'INSERT INTO dataQualityIssues (id, integrationEventId, field, issueType, description, severity, resolved, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ['DQI-001', 'EVT-INT-8801', 'income_amount', 'CONNECTOR_UNREACHABLE', 'Upstream Revenue API node unresponsive during real-time sync query.', 'HIGH', 0, yesterday]
  );

  // 8. Notifications
  const notifications = [
    {
      id: 'NOTIF-001',
      userId: 'USR-CITIZEN-001',
      title: 'Welcome to SANGAM Interoperability Platform',
      message: 'Your Sangam Unified Citizen Identity (SGM-MH-102934) is active and securely mapped to 4 Maharashtra state departments.',
      type: 'INFO',
      read: 0,
      createdAt: twoDaysAgo
    },
    {
      id: 'NOTIF-002',
      userId: 'USR-CITIZEN-002',
      title: 'Application Sync Paused',
      message: 'Revenue Department data verification for APP-2026-EDU-8812 experienced a network timeout. Our integration administrators are resolving it.',
      type: 'ALERT',
      read: 0,
      createdAt: yesterday
    }
  ];

  for (const n of notifications) {
    db.run(
      'INSERT INTO notifications (id, userId, title, message, type, read, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [n.id, n.userId, n.title, n.message, n.type, n.read, n.createdAt]
    );
  }

  // 9. Audit Logs
  const auditLogs = [
    {
      id: 'AUDIT-001',
      actorId: 'SYSTEM',
      action: 'IDENTITY_MAPPING_INITIALIZED',
      entityType: 'CITIZEN',
      entityId: 'CIT-001',
      description: 'Unified Sangam ID SGM-MH-102934 linked with Education (EDU-92831), Revenue (REV-44921) & Welfare (WEL-77182).',
      metadata: JSON.stringify({ ip: '127.0.0.1', protocol: 'TLS_1_3' }),
      timestamp: twoDaysAgo
    },
    {
      id: 'AUDIT-002',
      actorId: 'USR-CITIZEN-002',
      action: 'APPLICATION_SUBMITTED',
      entityType: 'APPLICATION',
      entityId: 'APP-2026-EDU-8812',
      description: 'Citizen Rahul Vilas Shinde submitted Post-Matric Scholarship application.',
      metadata: JSON.stringify({ device: 'Mobile Browser', channel: 'Sangam Web Portal' }),
      timestamp: yesterday
    },
    {
      id: 'AUDIT-003',
      actorId: 'CONNECTOR_ENGINE',
      action: 'CONNECTOR_FAULT_DETECTED',
      entityType: 'INTEGRATION_EVENT',
      entityId: 'EVT-INT-8801',
      description: 'Revenue Gateway timeout during income validation for application APP-2026-EDU-8812.',
      metadata: JSON.stringify({ retryCount: 0, upstreamCode: 504 }),
      timestamp: yesterday
    }
  ];

  for (const log of auditLogs) {
    db.run(
      'INSERT INTO auditLogs (id, actorId, action, entityType, entityId, description, metadata, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [log.id, log.actorId, log.action, log.entityType, log.entityId, log.description, log.metadata, log.timestamp]
    );
  }

  console.log('Seed data successfully committed to database.');
}

module.exports = { seedData };
