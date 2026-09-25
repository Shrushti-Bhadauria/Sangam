const { db } = require('../config/database');

class IdentityService {
  /**
   * Resolves a citizen's full identity record and departmental mappings
   */
  resolveCitizen(identifier) {
    if (!identifier) return null;

    let citizen = db.get(
      'SELECT * FROM citizens WHERE id = ? OR sangamId = ? OR userId = ? OR email = ?',
      [identifier, identifier, identifier, identifier]
    );

    if (!citizen) {
      // Check within identityMappings JSON
      const allCitizens = db.all('SELECT * FROM citizens');
      citizen = allCitizens.find(c => {
        try {
          const map = JSON.parse(c.identityMappings);
          return Object.values(map).includes(identifier);
        } catch {
          return false;
        }
      });
    }

    if (!citizen) return null;

    let mappings = {};
    try {
      mappings = JSON.parse(citizen.identityMappings);
    } catch (e) {
      mappings = {};
    }

    return {
      ...citizen,
      identityMappings: mappings
    };
  }

  /**
   * Returns target department external ID for a citizen
   */
  getDepartmentIdentifier(citizenId, department) {
    const citizen = this.resolveCitizen(citizenId);
    if (!citizen) return null;

    const map = citizen.identityMappings;
    switch (department.toUpperCase()) {
      case 'EDUCATION':
        return map.educationId || null;
      case 'REVENUE':
        return map.revenueId || null;
      case 'WELFARE':
        return map.welfareId || null;
      case 'CITIZEN_REGISTRY':
        return citizen.sangamId;
      default:
        return null;
    }
  }

  /**
   * Generates a new unique Sangam ID for new citizens
   */
  generateSangamId() {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `SGM-MH-${randomDigits}`;
  }
}

module.exports = new IdentityService();
