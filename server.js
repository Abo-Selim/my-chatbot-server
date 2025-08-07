require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const app = express();
const port = process.env.PORT || 3000;
const upload = multer({ dest: 'uploads/' });

// إعداد قاعدة البيانات للذاكرة الدائمة
const adapter = new FileSync('db.json');
const db = low(adapter);
db.defaults({ conversations: [], knowledge: [] }).write();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// تخزين المحادثات والتعلم
function storeConversation(userId, message, response) {
  db.get('conversations').push({
    userId,
    message,
    response,
    timestamp: new Date().toISOString()
  }).write();
}

function learnFromInteraction(userId, question, answer) {
  db.get('knowledge').push({
    userId,
    question,
    answer,
    timestamp: new Date().toISOString()
  }).write();
}

// دعم الملفات المرفقة
app.post('/chat', upload.single('file'), async (req, res) => {
  const { message, userId = 'default' } = req.body;
  const file = req.file;

  try {
    let prompt = message || "Analyze the attached file";
    
    if (file) {
      const filePath = path.join(__dirname, file.path);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      prompt += `\n\nFile Content (${file.originalname || file.filename}):\n${fileContent}`;
      fs.unlinkSync(filePath);
    }

    // البحث في المعرفة المخزنة أولاً
    const existingKnowledge = db.get('knowledge')
      .filter({ question: prompt })
      .orderBy('timestamp', 'desc')
      .take(1)
      .value();

    if (existingKnowledge.length > 0) {
      storeConversation(userId, prompt, existingKnowledge[0].answer);
      return res.json({ response: existingKnowledge[0].answer });
    }

    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar-small-chat',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful AI assistant. Be precise and concise.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1024,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const botResponse = response.data.choices[0].message.content;
    
    // تخزين المحادثة والمعرفة
    storeConversation(userId, prompt, botResponse);
    learnFromInteraction(userId, prompt, botResponse);

    res.json({ response: botResponse });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to get AI response',
      details: error.message 
    });
  }
});

// نقطة نهاية للصحة
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    version: '1.2.0',
    features: ['persistent-memory', 'continuous-learning', 'file-uploads']
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  if (!PERPLEXITY_API_KEY) {
    console.warn('Warning: PERPLEXITY_API_KEY is not set!');
  }
});
