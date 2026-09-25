const { db } = require('../config/database');

class CitizenRegistryConnector {
  async testConnection() {
    const connector = db.get("SELECT * FROM connectors WHERE department = 'CITIZEN_REGISTRY'");
    if (!connector || !connector.enabled) {
      return { success: false, message: 'Citizen Registry Connector is disabled.' };
    }
    return {
      success: true,
      latencyMs: 85,
      timestamp: new Date().toISOString(),
      endpoint: connector.endpoint,
      status: 'HEALTHY'
    };
  }

  async resolveCitizen(sangamId) {
    const connector = db.get("SELECT * FROM connectors WHERE department = 'CITIZEN_REGISTRY'");
    if (connector && !connector.enabled) {
      throw new Error('Citizen Registry connector is currently DISABLED.');
    }

    const record = db.get(
      "SELECT * FROM departmentRecords WHERE department = 'CITIZEN_REGISTRY' AND recordType = 'DEMOGRAPHIC_VERIFICATION' AND data LIKE ?",
      [`%${sangamId}%`]
    );

    if (!record) {
      throw new Error(`Registry record not found for Sangam ID: ${sangamId}`);
    }

    db.run(
      "UPDATE connectors SET successCount = successCount + 1, lastSync = ? WHERE department = 'CITIZEN_REGISTRY'",
      [new Date().toISOString()]
    );

    return {
      rawPayload: JSON.parse(record.data),
      sourceSystem: record.sourceSystem,
      lastSyncedAt: new Date().toISOString()
    };
  }
}

module.exports = new CitizenRegistryConnector();
