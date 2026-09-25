const { db } = require('../config/database');

class RevenueConnector {
  constructor() {
    this.failureMode = false; // Can be toggled for demo
  }

  setFailureMode(enabled) {
    this.failureMode = !!enabled;
  }

  async testConnection() {
    const connector = db.get("SELECT * FROM connectors WHERE department = 'REVENUE'");
    if (!connector || !connector.enabled) {
      return { success: false, message: 'Revenue Department Connector is disabled or not found.' };
    }
    if (this.failureMode) {
      return { success: false, message: 'Revenue Gateway 504: Internal Gateway Timeout.' };
    }
    return {
      success: true,
      latencyMs: Math.floor(Math.random() * 80) + 120,
      timestamp: new Date().toISOString(),
      endpoint: connector.endpoint,
      status: 'HEALTHY'
    };
  }

  async fetchIncomeCertificate(revenueId, forceFailure = false) {
    // Check connector state
    const connector = db.get("SELECT * FROM connectors WHERE department = 'REVENUE'");
    if (connector && !connector.enabled) {
      throw new Error('Revenue Department connector is currently DISABLED by administrator.');
    }

    if (this.failureMode || forceFailure) {
      // Update failure count in connectors
      db.run("UPDATE connectors SET failureCount = failureCount + 1, lastSync = ? WHERE department = 'REVENUE'", [new Date().toISOString()]);
      const error = new Error('Revenue Department Gateway Timeout (HTTP 504): Aaple Sarkar Revenue Node cluster unresponsive.');
      error.statusCode = 504;
      error.sourceDepartment = 'REVENUE';
      throw error;
    }

    // Query database for departmental record
    const record = db.get(
      "SELECT * FROM departmentRecords WHERE department = 'REVENUE' AND externalRecordId = ? AND recordType = 'INCOME_CERTIFICATE'",
      [revenueId]
    );

    if (!record) {
      throw new Error(`Revenue Record not found for Department ID: ${revenueId}`);
    }

    // Update connector success count and lastSync
    db.run(
      "UPDATE connectors SET successCount = successCount + 1, lastSync = ? WHERE department = 'REVENUE'",
      [new Date().toISOString()]
    );

    const parsedData = JSON.parse(record.data);
    return {
      rawPayload: parsedData,
      sourceSystem: record.sourceSystem,
      lastSyncedAt: new Date().toISOString()
    };
  }
}

module.exports = new RevenueConnector();
