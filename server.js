const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// تعيين مفتاح API
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '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';

// تهيئة الذاكرة
const MEMORY_FILE = 'memory.json';
let memory = {};
if (fs.existsSync(MEMORY_FILE)) {
    memory = JSON.parse(fs.readFileSync(MEMORY_FILE));
} else {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify({}, null, 2));
}

// حفظ الذاكرة
const saveMemory = () => {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
};

app.post('/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'No message provided' });
    }

    try {
        // تخزين السؤال في الذاكرة
        memory[message] = memory[message] || { count: 0, response: null };
        memory[message].count += 1;

        const response = await axios.post(
            'https://api.perplexity.ai/chat/completions',
            {
                model: 'sonar-pro',
                messages: [
                    { role: 'system', content: 'Be precise and concise. Provide a direct answer unless "explain" or "شرح" is requested, then give a detailed response with bullet points.' },
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
        memory[message].response = botResponse; // حفظ الإجابة
        saveMemory(); // حفظ الذاكرة

        res.json({ response: botResponse });
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to get response from Perplexity API' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
