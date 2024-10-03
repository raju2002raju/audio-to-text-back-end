const axios = require('axios');
const OpenAI = require('openai');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const {connectToDatabase} = require('../utils/database');

async function transcribeAudio(filePath) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('model', 'whisper-1');
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/audio/transcriptions',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
                }
            }
        );
        return response.data.text;
    } catch (error) {
        console.error('Error during transcription:', error.message);
        throw new Error('Transcription failed');
    }
}

async function getChatCompletion(transcript) {
    try {
        await connectToDatabase();
 

        let prompt = `${process.env.PROMPT} ${transcript}.`;
    

        console.log(`Prompt: ${prompt}` );

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o',
                messages: [{ role: 'user', content: prompt }]
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
                }
            }
        );

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            return response.data.choices[0].message.content;
        } else {
            throw new Error('Unexpected response structure from OpenAI API');
        }
    } catch (error) {
        console.error('Error during chat completion:', error.message);
        if (error.response) {
            console.error('OpenAI API response data:', error.response.data);
        }
        throw new Error('Chat completion failed');
    }
}



async function rewriteTranscript(transcript) {
    try {
        const prompt = `Correct any grammar mistakes in the following text. If there are no mistakes, return the original text without any additional comments:\n\n${transcript}`;
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
            }
        );

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            return response.data.choices[0].message.content.trim();
        } else {
            throw new Error('Unexpected response structure from OpenAI API');
        }
    } catch (error) {
        console.error('Error during text rewriting:', error.message);
        if (error.response) {
            console.error('OpenAI API response data:', error.response.data);
        }
        throw new Error('Text rewriting failed');
    }
}


module.exports = {
    transcribeAudio,
    getChatCompletion,
    rewriteTranscript
};
