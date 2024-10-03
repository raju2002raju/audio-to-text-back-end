const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const session = require('express-session'); 
const { getUsersCollection} = require('../utils/database');
const cloudinary = require('../routes/cloudinaryConfig');
const router = express.Router();
const {Transcript} = require('../models/model');
const User = require('../models/user')

// Set up express-session middleware
router.use(
    session({
        secret: 'your_secret_key', 
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false } 
    })
);

// Configure multer for file upload
const upload = multer({ storage: multer.memoryStorage() });

// Signup Route
router.post('/signup', upload.single('profileImage'), async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ status: 'error', message: 'Passwords do not match' });
    }

    try {
        const usersCollection = getUsersCollection();
        const existingUser = await usersCollection.findOne({ email });

        if (existingUser) {
            return res.status(200).json({ status: 'exist' });
        }

        let uploadedImageUrl = null;
        if (req.file) {
            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream({ folder: 'user_profiles' }, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                });
                stream.end(req.file.buffer);
            });

            uploadedImageUrl = uploadResult.secure_url;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            name,
            email,
           
            password: hashedPassword,
            profileImage: uploadedImageUrl
        };

        const result = await usersCollection.insertOne(newUser);
        const insertedUser = await usersCollection.findOne({ _id: result.insertedId });

        const { password: _, ...userWithoutPassword } = insertedUser;
        req.session.userEmail = email;
        console.log('signup userEmail', req.session.userEmail) 
        return res.status(200).json({ status: 'success', data: userWithoutPassword });

    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ status: 'error', message: 'An error occurred during signup' });
    }
});


router.post('/signup-with-google', async (req, res) => {
    const { name, email, profileImage } = req.body;
  
    try {
      const usersCollection = getUsersCollection();
      const existingUser = await usersCollection.findOne({ email });
  
      if (existingUser) {
        // User exists, log them in
        req.session.userEmail = email; 
        return res.status(200).json({ success: true, message: 'User logged in successfully', data: existingUser });
      }
  
      // User does not exist, create a new user
      const newUser = {
        name,
        email,
        profileImage,
      };
  
      const result = await usersCollection.insertOne(newUser);
      const insertedUser = await usersCollection.findOne({ _id: result.insertedId });
  
      const { password: _, ...userWithoutPassword } = insertedUser;
      req.session.userEmail = email; 
      console.log('Signup userEmail', req.session.userEmail);
      return res.status(200).json({ success: true, message: 'User signed up successfully', data: userWithoutPassword });
  
    } catch (error) {
      console.error('Error during signup with Google:', error);
      res.status(500).json({ success: false, message: 'An error occurred during signup' });
    }
  });
  
  

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const usersCollection = getUsersCollection();
        const user = await usersCollection.findOne({ email });

        if (!user) {
            return res.status(404).json({ status: 'notexist' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ status: 'Password incorrect' });
        }

        req.session.userEmail = email; 
        console.log('login userEmail', req.session.userEmail)
        res.status(200).json({ status: 'exist', user });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ status: 'error', message: 'Error during login', error: error.message });
    }
});

// Get User Route
router.get('/user', async (req, res) => {
    try {
        const email = req.query.email || req.headers['user-email'];


        if (!email) {
            return res.status(400).json({ error: 'Email parameter is required' });
        }

        const clientDataCollection = getUsersCollection();
        const clientData = await clientDataCollection.find({ email }).toArray();

        if (clientData.length === 0) {
            return res.status(404).json({ message: 'No data found for this email' });
        }

        res.json(clientData);
    } catch (error) {
        console.error('Error fetching client data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/logout', (req, res) => {
    try {
        // Destroy the session
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ status: 'error', message: 'Failed to log out' });
            }
            res.status(200).json({ status: 'success', message: 'Logged out successfully' });
        });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
})

router.delete('/delete-transcript/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
        console.log('Attempting to delete transcript with ID:', id);
        const result = await Transcript.findByIdAndDelete(id);
  
        if (!result) {
            console.log('Transcript not found');
            return res.status(404).json({ message: 'Transcript not found' });
        }
  
        console.log('Transcript deleted successfully');
        res.status(200).json({ message: 'Transcript deleted successfully' });
    } catch (error) {
        console.error('Error deleting transcript:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

router.post('/append-transcript', async (req, res) => {
    try {
        const { id, transcript, userEmail } = req.body;
        const user = await User.findOne({ email: userEmail });
        console.log('userEmail' , userEmail)
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const existingTranscript = await Transcript.findOne({ _id: id, user: user._id });
        if (!existingTranscript) {
            return res.status(404).json({ message: 'Transcript not found or does not belong to the user' });
        }
        existingTranscript.transcript += '\n\n' + transcript;
        await existingTranscript.save();
        res.status(200).json({ message: 'Transcript appended successfully' });
    } catch (error) {
        console.error('Error appending transcript:', error);
        res.status(500).json({ message: 'Error appending transcript' });
    }
});
module.exports = router;
