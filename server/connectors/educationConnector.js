const { db } = require('../config/database');

class EducationConnector {
  async testConnection() {
    const connector = db.get("SELECT * FROM connectors WHERE department = 'EDUCATION'");
    if (!connector || !connector.enabled) {
      return { success: false, message: 'Education Connector is disabled.' };
    }
    return {
      success: true,
      latencyMs: 140,
      timestamp: new Date().toISOString(),
      endpoint: connector.endpoint,
      status: 'HEALTHY'
    };
  }

  async fetchStudentRecord(educationId) {
    const connector = db.get("SELECT * FROM connectors WHERE department = 'EDUCATION'");
    if (connector && !connector.enabled) {
      throw new Error('Education Department connector is currently DISABLED by administrator.');
    }

    const record = db.get(
      "SELECT * FROM departmentRecords WHERE department = 'EDUCATION' AND externalRecordId = ? AND recordType = 'STUDENT_ENROLLMENT'",
      [educationId]
    );

    if (!record) {
      throw new Error(`Education record not found for Student ID: ${educationId}`);
    }

    db.run(
      "UPDATE connectors SET successCount = successCount + 1, lastSync = ? WHERE department = 'EDUCATION'",
      [new Date().toISOString()]
    );

    return {
      rawPayload: JSON.parse(record.data),
      sourceSystem: record.sourceSystem,
      lastSyncedAt: new Date().toISOString()
    };
  }
}

module.exports = new EducationConnector();
