const Meeting = require('../../model/schema/meeting')
const mongoose = require('mongoose');

const add = async (req, res) => {
    try {
        const newMeeting = new Meeting({...req.body});
        const savedMeeting = await newMeeting.save();
        res.status(200).json(savedMeeting);
    } catch (err) {
        console.error("Failed to create Meeting:", err);
        res.status(400).json({error: "Failed to create Meeting", details: err});
    }
};

const index = async (req, res) => {
    try {
        const query = {...req.query, deleted: false};

        // Fetch meetings and populate the createBy field
        const meetings = await Meeting.find(query)
            .populate('createBy', 'firstName lastName') // Populate createdBy (User model)

        // Transform the data to add createdByName
        const transformedMeetings = meetings.map(meeting => {
            const createdByName = meeting.createBy ? `${meeting.createBy.firstName} ${meeting.createBy.lastName}` : null;

            return {
                ...meeting.toObject(), // Convert Mongoose document to a plain object
                createdByName, // Add the new field
                createBy: undefined // Remove the nested createBy field
            };
        });

        res.status(200).json(transformedMeetings);
    } catch (error) {
        console.error('Failed to fetch meetings:', error);
        res.status(500).json({success: false, error: 'Failed to fetch meetings.'});
    }
};
const view = async (req, res) => {
    try {
        const {id} = req.params;

        const meeting = await Meeting.aggregate([
            // Match the specific meeting document by its `_id`
            {
                $match: { _id: new mongoose.Types.ObjectId(id) } // Ensure `id` is converted to `ObjectId`
            },

            // Lookup attendees from the "Contacts" collection
            {
                $lookup: {
                    from: "Contacts", // Collection name for attendees
                    localField: "attendees", // Field in Meeting document that holds attendee ObjectIds
                    foreignField: "_id", // Field in Contacts collection that matches those ObjectIds
                    as: "attendeeDetails" // Output field where matched attendees will be stored
                }
            },

            // Lookup attendeesLead from the "Leads" collection
            {
                $lookup: {
                    from: "Leads",
                    localField: "attendeesLead",
                    foreignField: "_id",
                    as: "leadDetails"
                }
            },

            // Lookup the user who created the meeting from the "User" collection
            {
                $lookup: {
                    from: "User",
                    localField: "createBy",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },

            // Project the required fields in the final output
            {
                $project: {
                    _id: 1, // Keep `_id`
                    agenda: 1, // Keep `agenda` ...
                    location: 1,
                    related: 1,
                    dateTime: 1,
                    notes: 1,
                    timestamp: 1,
                    deleted: 1,

                    // Transform `attendees` field to only include `fullName`
                    attendees: {
                        $map: {
                            input: "$attendeeDetails", // Loop through `attendeeDetails`
                            as: "attendee", // Reference each attendee as `attendee`
                            in: {
                                fullName: "$$attendee.fullName" // Extract only `fullName`
                            }
                        }
                    },

                    // Transform `attendeesLead` field to only include `leadName`
                    attendeesLead: {
                        $map: {
                            input: "$leadDetails", // Loop through `leadDetails`
                            as: "lead", // Reference each lead as `lead`
                            in: {
                                leadName: "$$lead.leadName" // Extract only `leadName`
                            }
                        }
                    },

                    // Extract the `firstName` and `lastName` of the meeting creator and concatenate them
                    createdByName: {
                        $let: {
                            vars: {
                                user: { $arrayElemAt: ["$userDetails", 0] } // Extract first element from `userDetails` array
                            },
                            in: {
                                $concat: ["$$user.firstName", " ", "$$user.lastName"] // Concatenate `firstName` and `lastName`
                            }
                        }
                    }
                }
            }
        ]);
        if (!meeting) {
            return res.status(404).json({message: "No meeting found."});
        }
        res.status(200).json(meeting[0]);
    } catch (err) {
        console.error('Failed to fetch meeting:', err);
        res.status(500).json({error: 'Failed to fetch meeting.'});
    }
};

const deleteData = async (req, res) => {
    try {
        const {id} = req.params;

        // Check if the meeting exists
        const meeting = await Meeting.findByIdAndUpdate(id);
        if (!meeting) {
            return res.status(404).json({success: false, message: "Meeting not found"});
        }

        // Soft delete by setting `deleted` to true
        meeting.deleted = true;
        await meeting.save();

        res.status(200).json({success: true, message: "Meeting marked as deleted", meeting});
    } catch (error) {
        console.error("Error deleting meeting:", error);
        res.status(500).json({success: false, message: "Internal Server Error"});
    }
};


const deleteMany = async (req, res) => {
    try {
        const meetingIds = req.body;

        if (!Array.isArray(meetingIds) || meetingIds.length === 0) {
            return res.status(400).json({message: "Invalid or empty meetingIds array"});
        }

        // Convert string IDs to ObjectId
        const objectIds = meetingIds.map(id => new mongoose.Types.ObjectId(id));

        // Soft delete multiple meetings
        const result = await Meeting.updateMany({_id: {$in: objectIds}}, {$set: {deleted: true}});

        if (result.matchedCount === 0) {
            return res.status(404).json({message: "No matching meetings found"});
        }

        res.status(200).json({
            success: true, message: `${result.modifiedCount} meetings marked as deleted`
        });

    } catch (error) {
        console.error("Error deleting meetings:", error);
        res.status(500).json({message: "Internal Server Error"});
    }
};
module.exports = {add, index, view, deleteData, deleteMany}