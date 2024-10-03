// routes/asr.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { transcribeAudio } = require('../utils/audio');

let transcriptions = [];

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});
const upload = multer({ storage: storage });

router.post('/', upload.single('wavfile'), async (req, res) => {
    console.log('File received:', req.file);
    const { contactId, dateTime } = req.body;

    try {
        if (!req.file) {
            throw new Error('No file uploaded');
        }

        const transcript = await transcribeAudio(req.file.path);
        console.log('Transcription:', transcript);

        const recordingUrl = `http://localhost:8080/uploads/${req.file.filename}`;
        console.log('Recording URL:', recordingUrl);

        const transcription = { id: Date.now(), transcript, filePath: req.file.filename, contactId, dateTime, recordingUrl };
        transcriptions.push(transcription);

        // Removed the chatResponse and convertToMP3 logic
        res.status(200).send({ message: 'File received and transcribed successfully', transcript, recordingUrl });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send({ error: 'Error', details: error.response ? error.response.data : error.message });
    }
});

module.exports = router;
