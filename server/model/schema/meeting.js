const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    agenda: { type: String, required: true },
    attendees: [{
        type: mongoose.Schema.ObjectId,
        ref: "Contact",
    }],
    attendeesLead: [{
        type: mongoose.Schema.ObjectId,
        ref: "Lead",
    }],
    location: String,
    related: String,
    dateTime: String,
    notes: String,
    // meetingReminders: { type: String, required: true },
    createBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true,
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    deleted: {
        type: Boolean,
        default: false,
    },
})
module.exports = mongoose.model('Meetings', meetingSchema, 'Meetings');
