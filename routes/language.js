const express = require('express');
const router = express.Router();

router.post('/send-languages', (req, res) => {
    const { inputLanguage, outputLanguage } = req.body;
    
    if (!inputLanguage || !outputLanguage) {
        return res.status(400).json({ error: 'Input and Output languages are required' });
    }

    console.log(`Input Language: ${inputLanguage}`);
    console.log(`Output Language: ${outputLanguage}`);

    res.status(200).json({ message: 'Languages received successfully' });
});

module.exports = router;
