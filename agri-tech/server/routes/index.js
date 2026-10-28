const express = require('express');
const { getMeta } = require('../controllers/metaController');

const router = express.Router();

router.get('/health', (req, res) => res.json({ success: true, message: 'Smart Agri-Tech API is running.', data: { uptime: Math.round(process.uptime()) } }));
router.get('/meta', getMeta);

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/farms', require('./farmRoutes'));
router.use('/crops', require('./cropRoutes'));
router.use('/soil', require('./soilRoutes'));
router.use('/weather', require('./weatherRoutes'));
router.use('/pests', require('./pestRoutes'));
router.use('/resources', require('./resourceRoutes'));
router.use('/orders', require('./orderRoutes'));
router.use('/experts', require('./expertRoutes'));
router.use('/consultations', require('./consultationRoutes'));
router.use('/community', require('./communityRoutes'));
router.use('/admin', require('./adminRoutes'));

module.exports = router;
