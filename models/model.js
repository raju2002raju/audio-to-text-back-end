const mongoose = require('mongoose');

const transcriptSchema = new mongoose.Schema({
    transcript: String,
    title: String,
    createdAt: { type: Date, default: Date.now },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' } 
});

const Transcript = mongoose.model('Transcript', transcriptSchema);

module.exports = {
    Transcript
};