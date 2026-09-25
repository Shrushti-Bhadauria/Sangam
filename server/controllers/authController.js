const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const identityService = require('../services/identityService');
const auditService = require('../services/auditService');
const { JWT_SECRET } = require('../middleware/auth');

class AuthController {
  async register(req, res) {
    try {
      const { name, email, phone, password, address, district, taluka, village, preferredLanguage = 'en' } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
      }

      const existingUser = db.get('SELECT id FROM users WHERE email = ?', [email]);
      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email address already exists.' });
      }

      const userId = `USR-CITIZEN-${Date.now()}`;
      const citizenId = `CIT-${Date.now()}`;
      const sangamId = identityService.generateSangamId();
      const hashedPassword = bcrypt.hashSync(password, 10);
      const now = new Date().toISOString();

      // Create User record
      db.run(
        'INSERT INTO users (id, name, email, phone, password, role, preferredLanguage, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, name, email, phone || null, hashedPassword, 'CITIZEN', preferredLanguage, now, now]
      );

      // Generate realistic departmental ID mappings
      const identityMappings = {
        sangamId,
        educationId: `EDU-${Math.floor(10000 + Math.random() * 90000)}`,
        revenueId: `REV-${Math.floor(10000 + Math.random() * 90000)}`,
        welfareId: `WEL-${Math.floor(10000 + Math.random() * 90000)}`,
        aadhaarRef: `VID-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
      };

      // Create Citizen record
      db.run(
        'INSERT INTO citizens (id, userId, sangamId, fullName, mobile, email, address, district, taluka, village, identityMappings, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          citizenId,
          userId,
          sangamId,
          name,
          phone || null,
          email,
          address || 'Maharashtra, India',
          district || 'Pune',
          taluka || 'Haveli',
          village || 'Central',
          JSON.stringify(identityMappings),
          now,
          now
        ]
      );

      // Create simulated Revenue and Education department records for this new citizen so demo works seamlessly!
      const revRecordId = `REC-REV-${Date.now()}`;
      db.run(
        'INSERT INTO departmentRecords (id, citizenId, department, externalRecordId, recordType, data, lastSyncedAt, sourceSystem) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          revRecordId,
          citizenId,
          'REVENUE',
          identityMappings.revenueId,
          'INCOME_CERTIFICATE',
          JSON.stringify({
            certificate_number: `MH-REV-2025-${Math.floor(100000 + Math.random() * 900000)}`,
            applicant_name: name,
            father_name: `${name.split(' ')[0]} Senior`,
            income_amount: 175000,
            currency: 'INR',
            financial_year: '2024-2025',
            issuing_authority: `Tehsildar Office, ${district || 'Pune'}`,
            issue_date: '2025-05-20',
            valid_until: '2028-03-31',
            land_holding_acres: 1.2,
            ration_card_type: 'Orange (BPL Category B)',
            verification_status: 'VERIFIED_LEGITIMATE'
          }),
          now,
          'MahaBhumi Records Node'
        ]
      );

      auditService.log({
        actorId: userId,
        action: 'CITIZEN_REGISTERED',
        entityType: 'CITIZEN',
        entityId: citizenId,
        description: `New citizen registered with Sangam ID: ${sangamId}`,
        metadata: { email, district: district || 'Pune' }
      });

      const token = jwt.sign({ id: userId, role: 'CITIZEN' }, JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({
        token,
        user: { id: userId, name, email, role: 'CITIZEN', preferredLanguage },
        citizen: { id: citizenId, sangamId, fullName: name, identityMappings }
      });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Failed to create citizen account: ' + err.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const user = db.get('SELECT * FROM users WHERE email = ?', [email]);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const validPassword = bcrypt.compareSync(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      let citizen = null;
      if (user.role === 'CITIZEN') {
        citizen = identityService.resolveCitizen(user.id);
      }

      auditService.log({
        actorId: user.id,
        action: 'USER_LOGIN',
        entityType: 'USER',
        entityId: user.id,
        description: `User ${user.name} logged in with role [${user.role}]`,
        metadata: { role: user.role }
      });

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          preferredLanguage: user.preferredLanguage
        },
        citizen
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed: ' + err.message });
    }
  }

  async me(req, res) {
    try {
      const user = req.user;
      let citizen = null;
      if (user.role === 'CITIZEN') {
        citizen = identityService.resolveCitizen(user.id);
      }

      res.json({
        user,
        citizen
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateLanguage(req, res) {
    try {
      const { preferredLanguage } = req.body;
      if (!['en', 'hi', 'mr'].includes(preferredLanguage)) {
        return res.status(400).json({ error: 'Invalid language. Choose en, hi, or mr.' });
      }

      db.run('UPDATE users SET preferredLanguage = ? WHERE id = ?', [preferredLanguage, req.user.id]);
      res.json({ success: true, preferredLanguage });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new AuthController();
