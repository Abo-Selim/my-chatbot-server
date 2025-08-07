require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// إعدادات أساسية
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// متغيرات البيئة
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// نقطة نهاية للصحة
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'running',
    message: 'Mashaly AI Server is operational',
    version: '1.0.0'
  });
});

// نقطة نهاية الدردشة
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!PERPLEXITY_API_KEY) {
      return res.status(500).json({ 
        error: 'Server misconfiguration',
        details: 'API key is missing'
      });
    }

    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar-small-chat',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant.' },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    res.json({ response: response.data.choices[0].message.content });
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message
    });
  }
});

// بدء السيرفر
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  if (!PERPLEXITY_API_KEY) {
    console.warn('Warning: PERPLEXITY_API_KEY is not set!');
  }
});
