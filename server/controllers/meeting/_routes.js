const express = require('express');
const meeting = require('./meeting');
const auth = require('../../middelwares/auth');

const router = express.Router();

router.get('/', auth, meeting.index);                  // Get all meetings
router.post('/add', auth, meeting.add);               // Add a new meeting
router.get('/view/:id', auth, meeting.view);          // Get a specific meeting by ID
router.delete('/delete/:id', auth, meeting.deleteData); // Delete a specific meeting
router.post('/deleteMany', auth, meeting.deleteMany); // Delete multiple meetings

module.exports = router