const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'sangam.sqlite3');

let dbInstance = null;
let SQL = null;

// Save database to disk
function persistDatabase() {
  if (dbInstance) {
    try {
      const data = dbInstance.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }
}

// Initialize Database
async function initDatabase() {
  if (dbInstance) return dbInstance;

  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
      console.log('Loaded existing database from', DB_PATH);
    } catch (err) {
      console.warn('Failed to load existing database file, creating fresh:', err.message);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
    console.log('Created fresh database instance');
  }

  // Create tables if not exists
  createTables();
  persistDatabase();

  return dbInstance;
}

function createTables() {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      preferredLanguage TEXT DEFAULT 'en',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS citizens (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      sangamId TEXT UNIQUE NOT NULL,
      fullName TEXT NOT NULL,
      mobile TEXT,
      email TEXT,
      address TEXT,
      district TEXT,
      taluka TEXT,
      village TEXT,
      identityMappings TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      applicationNumber TEXT UNIQUE NOT NULL,
      citizenId TEXT NOT NULL,
      serviceType TEXT NOT NULL,
      department TEXT NOT NULL,
      status TEXT NOT NULL,
      submittedAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      currentStage TEXT NOT NULL,
      remarks TEXT,
      requiredDocuments TEXT,
      verifiedDocuments TEXT,
      integrationStatus TEXT NOT NULL,
      FOREIGN KEY (citizenId) REFERENCES citizens(id)
    );

    CREATE TABLE IF NOT EXISTS consents (
      id TEXT PRIMARY KEY,
      citizenId TEXT NOT NULL,
      applicationId TEXT NOT NULL,
      requestedBy TEXT NOT NULL,
      purpose TEXT NOT NULL,
      dataFields TEXT NOT NULL,
      status TEXT NOT NULL,
      grantedAt TEXT,
      expiresAt TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (citizenId) REFERENCES citizens(id),
      FOREIGN KEY (applicationId) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS integrationEvents (
      id TEXT PRIMARY KEY,
      applicationId TEXT,
      citizenId TEXT,
      sourceDepartment TEXT NOT NULL,
      targetDepartment TEXT NOT NULL,
      operation TEXT NOT NULL,
      status TEXT NOT NULL,
      requestPayload TEXT,
      responsePayload TEXT,
      mappingStatus TEXT,
      validationStatus TEXT,
      errorMessage TEXT,
      retryCount INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      completedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS departmentRecords (
      id TEXT PRIMARY KEY,
      citizenId TEXT NOT NULL,
      department TEXT NOT NULL,
      externalRecordId TEXT NOT NULL,
      recordType TEXT NOT NULL,
      data TEXT NOT NULL,
      lastSyncedAt TEXT NOT NULL,
      sourceSystem TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS auditLogs (
      id TEXT PRIMARY KEY,
      actorId TEXT NOT NULL,
      action TEXT NOT NULL,
      entityType TEXT NOT NULL,
      entityId TEXT NOT NULL,
      description TEXT NOT NULL,
      metadata TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS connectors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      connectorType TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      status TEXT NOT NULL,
      lastSync TEXT,
      successCount INTEGER DEFAULT 0,
      failureCount INTEGER DEFAULT 0,
      averageResponseTime INTEGER DEFAULT 120,
      enabled INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS dataQualityIssues (
      id TEXT PRIMARY KEY,
      integrationEventId TEXT NOT NULL,
      field TEXT NOT NULL,
      issueType TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL,
      resolved INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    );
  `;

  dbInstance.run(schema);
}

// Database helper functions
const db = {
  get: (sql, params = []) => {
    if (!dbInstance) throw new Error('Database not initialized');
    const stmt = dbInstance.prepare(sql);
    try {
      stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        return row;
      }
      return null;
    } finally {
      stmt.free();
    }
  },

  all: (sql, params = []) => {
    if (!dbInstance) throw new Error('Database not initialized');
    const stmt = dbInstance.prepare(sql);
    const results = [];
    try {
      stmt.bind(params);
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      return results;
    } finally {
      stmt.free();
    }
  },

  run: (sql, params = []) => {
    if (!dbInstance) throw new Error('Database not initialized');
    dbInstance.run(sql, params);
    persistDatabase();
    return { changes: dbInstance.getRowsModified() };
  },

  exec: (sql) => {
    if (!dbInstance) throw new Error('Database not initialized');
    dbInstance.run(sql);
    persistDatabase();
  },

  persist: persistDatabase
};

module.exports = {
  initDatabase,
  db
};
