const { db } = require('../config/database');

class ValidationService {
  /**
   * Validates canonical data against service eligibility and consistency rules
   */
  validatePayload({ canonicalData, serviceType, integrationEventId, citizenName }) {
    const issues = [];
    let status = 'VALID';

    if (!canonicalData) {
      issues.push({
        field: 'payload',
        issueType: 'EMPTY_PAYLOAD',
        description: 'Received null or undefined canonical data structure.',
        severity: 'HIGH'
      });
      status = 'INVALID';
      this.recordIssues(integrationEventId, issues);
      return { status, issues };
    }

    // Revenue data validation
    if (canonicalData.sourceDepartment === 'REVENUE') {
      if (!canonicalData.certificateNumber) {
        issues.push({
          field: 'certificateNumber',
          issueType: 'MISSING_REQUIRED_FIELD',
          description: 'Revenue Certificate Number is missing from issuing department payload.',
          severity: 'HIGH'
        });
      }

      if (typeof canonicalData.annualIncome !== 'number' || isNaN(canonicalData.annualIncome) || canonicalData.annualIncome < 0) {
        issues.push({
          field: 'annualIncome',
          issueType: 'INVALID_DATA_TYPE',
          description: 'Annual income must be a valid positive numerical figure.',
          severity: 'HIGH'
        });
      }

      // Check certificate expiry
      if (canonicalData.validUntil) {
        const expiryDate = new Date(canonicalData.validUntil);
        if (expiryDate < new Date()) {
          issues.push({
            field: 'validUntil',
            issueType: 'EXPIRED_CERTIFICATE',
            description: `Income certificate expired on ${canonicalData.validUntil}. Citizen must apply for renewed certificate.`,
            severity: 'HIGH'
          });
        }
      }

      // Name consistency check (fuzzy or exact)
      if (citizenName && canonicalData.beneficiaryName) {
        const cNorm = citizenName.toLowerCase().replace(/[^a-z]/g, '');
        const bNorm = canonicalData.beneficiaryName.toLowerCase().replace(/[^a-z]/g, '');
        if (!cNorm.includes(bNorm) && !bNorm.includes(cNorm)) {
          issues.push({
            field: 'beneficiaryName',
            issueType: 'NAME_MISMATCH_WARNING',
            description: `Revenue record name "${canonicalData.beneficiaryName}" may have slight spelling variation compared to citizen profile "${citizenName}".`,
            severity: 'MEDIUM'
          });
        }
      }

      // Scholarship scheme threshold check
      if (serviceType && serviceType.includes('Scholarship')) {
        const SCHOLARSHIP_INCOME_CEILING = 250000; // Rs 2.5 Lakhs
        if (canonicalData.annualIncome > SCHOLARSHIP_INCOME_CEILING) {
          issues.push({
            field: 'annualIncome',
            issueType: 'ELIGIBILITY_THRESHOLD_EXCEEDED',
            description: `Reported annual family income (₹${canonicalData.annualIncome.toLocaleString('en-IN')}) exceeds the scheme cutoff (₹${SCHOLARSHIP_INCOME_CEILING.toLocaleString('en-IN')}).`,
            severity: 'HIGH'
          });
        }
      }
    }

    if (issues.some(i => i.severity === 'HIGH')) {
      status = 'INVALID';
    } else if (issues.length > 0) {
      status = 'WARNING';
    }

    this.recordIssues(integrationEventId, issues);

    return {
      status,
      issues
    };
  }

  recordIssues(integrationEventId, issues) {
    if (!integrationEventId || !issues || issues.length === 0) return;

    for (const issue of issues) {
      const id = `DQI-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const createdAt = new Date().toISOString();
      db.run(
        'INSERT INTO dataQualityIssues (id, integrationEventId, field, issueType, description, severity, resolved, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, integrationEventId, issue.field, issue.issueType, issue.description, issue.severity, 0, createdAt]
      );
    }
  }

  resolveIssue(issueId) {
    db.run('UPDATE dataQualityIssues SET resolved = 1 WHERE id = ?', [issueId]);
    return { success: true };
  }

  getIssues() {
    return db.all('SELECT * FROM dataQualityIssues ORDER BY createdAt DESC');
  }
}

module.exports = new ValidationService();
