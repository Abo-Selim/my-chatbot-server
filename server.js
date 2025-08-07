const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

app.use(express.json());

// تعيين مفتاح API بشكل آمن (استبدل القيمة بمفتاحك الفعلي أو استخدم متغير بيئي)
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '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';

// نهاية الخادم لمعالجة طلبات الدردشة
app.post('/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'No message provided' });
    }

    try {
        const response = await axios.post(
            'https://api.perplexity.ai/chat/completions',
            {
                model: 'sonar-pro',
                messages: [
                    { role: 'system', content: 'Be concise and helpful in your responses.' },
                    { role: 'user', content: message }
                ],
                max_tokens: 500,
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
        console.error('API Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to get response from Perplexity API' });
    }
});

// بدء الخادم
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
