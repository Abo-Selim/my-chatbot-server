const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3000;

// السماح بطلبات CORS من أي مكان (يُفضل تحديد الأصل في الإنتاج)
app.use(cors());

// قراءة JSON من البوست
app.use(express.json());

// ضع هنا مفتاح API الخاص بك (أو من متغير بيئة)
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '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';

// نقطة استقبال الرسائل
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  try {
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: 'Be precise and concise in your responses.' },
          { role: 'user', content: message }
        ],
        max_tokens: 1024,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    const botResponse = response.data.choices[0].message.content;
    res.json({ response: botResponse });

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to get response from Perplexity API' });
  }
});

// بدء تشغيل السيرفر
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
