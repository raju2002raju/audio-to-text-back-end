// server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const { connectToDatabase} = require('./utils/database'); 

const app = express();
const port = process.env.PORT || 8080;
app.use('/files', express.static(path.join(__dirname, 'uploads')));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static('uploads'));

connectToDatabase()
    .then(() => {
        const transcriptionsRouter = require('./routes/transcription');
        const asrRouter = require('./routes/asr');
        const authRoutes = require('./routes/auth');
        const transcriptionRoutes = require('./routes/transcription');
        const profile = require('./routes/profileUpdate')
        const configRoutes = require('./routes/config');
        const languageRoutes = require('./routes/language');


        app.use('/asr', asrRouter);
        app.use('/auth', authRoutes);
        app.use('/transcription', transcriptionRoutes);
       app.use('/api', profile)
        app.use('/config', configRoutes);
        app.use('/language', languageRoutes);
        app.use('/', transcriptionsRouter);

        // Error handling middleware
        app.use((err, req, res, next) => {
            console.error('Error:', err.message);
            res.status(500).json({ error: 'Server error' });
        });


        // Start server
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log("MongoDB connection closed");
            process.exit(0);
        });
    })
    .catch((error) => {
        console.error('Failed to connect to MongoDB:', error.message);
        process.exit(1);
    });
