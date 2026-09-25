const express = require('express');
const router = express.Router();

const { authenticate, optionalAuth, requireRole } = require('../middleware/auth');
const authController = require('../controllers/authController');
const citizenController = require('../controllers/citizenController');
const applicationController = require('../controllers/applicationController');
const consentController = require('../controllers/consentController');
const integrationController = require('../controllers/integrationController');
const adminController = require('../controllers/adminController');
const notificationController = require('../controllers/notificationController');
const aiController = require('../controllers/aiController');
const eventStream = require('../services/eventStreamService');

// 1. Auth Routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.me);
router.patch('/auth/language', authenticate, authController.updateLanguage);

// 2. Citizen Routes
router.get('/citizens/me', authenticate, citizenController.getProfile);
router.get('/citizens', authenticate, requireRole('DEPARTMENT_OFFICER', 'INTEGRATION_ADMIN'), citizenController.listCitizens);
router.get('/citizens/:id/360', authenticate, citizenController.getCitizen360);

// 3. Application Routes
router.post('/applications', authenticate, applicationController.createApplication);
router.get('/applications', authenticate, applicationController.listApplications);
router.get('/applications/:id', authenticate, applicationController.getApplicationById);
router.patch('/applications/:id/status', authenticate, requireRole('DEPARTMENT_OFFICER', 'INTEGRATION_ADMIN'), applicationController.updateApplicationStatus);

// 4. Consent Routes
router.get('/consents', authenticate, consentController.getConsents);
router.post('/consents/:id/approve', authenticate, consentController.approveConsent);
router.post('/consents/:id/reject', authenticate, consentController.rejectConsent);
router.post('/consents/:id/revoke', authenticate, consentController.revokeConsent);

// 5. Integration Routes
router.post('/integrations/sync', authenticate, integrationController.executeSync);
router.get('/integrations/events', authenticate, integrationController.getEvents);
router.get('/integrations/events/:id', authenticate, integrationController.getEventById);
router.post('/integrations/events/:id/retry', authenticate, requireRole('INTEGRATION_ADMIN'), integrationController.retryEvent);
router.post('/integrations/toggle-failure', authenticate, requireRole('INTEGRATION_ADMIN'), integrationController.toggleFailureMode);

// 6. Admin Routes
router.get('/admin/stats', authenticate, requireRole('INTEGRATION_ADMIN', 'DEPARTMENT_OFFICER'), adminController.getStats);
router.get('/admin/connectors', authenticate, requireRole('INTEGRATION_ADMIN'), adminController.getConnectors);
router.patch('/admin/connectors/:id', authenticate, requireRole('INTEGRATION_ADMIN'), adminController.toggleConnector);
router.post('/admin/connectors/:id/test', authenticate, requireRole('INTEGRATION_ADMIN'), adminController.testConnector);
router.get('/admin/audit-logs', authenticate, requireRole('INTEGRATION_ADMIN', 'DEPARTMENT_OFFICER'), adminController.getAuditLogs);
router.get('/admin/data-quality', authenticate, requireRole('INTEGRATION_ADMIN'), adminController.getDataQualityIssues);
router.patch('/admin/data-quality/:id/resolve', authenticate, requireRole('INTEGRATION_ADMIN'), adminController.resolveDataQualityIssue);
router.post('/admin/reset', authenticate, requireRole('INTEGRATION_ADMIN'), adminController.resetData);

// 7. Notification Routes
router.get('/notifications', authenticate, notificationController.getNotifications);
router.patch('/notifications/:id/read', authenticate, notificationController.markAsRead);
router.post('/notifications/read-all', authenticate, notificationController.markAllAsRead);

// 8. AI Chatbot
router.post('/ai/chat', optionalAuth, aiController.chat);

// 9. Real-time SSE Stream
router.get('/events/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Send initial ping
  res.write('event: connected\ndata: {"status":"connected"}\n\n');

  eventStream.addClient(res);
});

module.exports = router;
