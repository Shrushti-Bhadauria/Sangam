const { db } = require('../config/database');

class WelfareConnector {
  async testConnection() {
    const connector = db.get("SELECT * FROM connectors WHERE department = 'WELFARE'");
    if (!connector || !connector.enabled) {
      return { success: false, message: 'Welfare Connector is disabled.' };
    }
    return {
      success: true,
      latencyMs: 110,
      timestamp: new Date().toISOString(),
      endpoint: connector.endpoint,
      status: 'HEALTHY'
    };
  }

  async fetchBeneficiaryProfile(welfareId) {
    const connector = db.get("SELECT * FROM connectors WHERE department = 'WELFARE'");
    if (connector && !connector.enabled) {
      throw new Error('Welfare Department connector is currently DISABLED.');
    }

    const record = db.get(
      "SELECT * FROM departmentRecords WHERE department = 'WELFARE' AND externalRecordId = ? AND recordType = 'BENEFICIARY_PROFILE'",
      [welfareId]
    );

    if (!record) {
      throw new Error(`Welfare record not found for Beneficiary ID: ${welfareId}`);
    }

    db.run(
      "UPDATE connectors SET successCount = successCount + 1, lastSync = ? WHERE department = 'WELFARE'",
      [new Date().toISOString()]
    );

    return {
      rawPayload: JSON.parse(record.data),
      sourceSystem: record.sourceSystem,
      lastSyncedAt: new Date().toISOString()
    };
  }
}

module.exports = new WelfareConnector();
