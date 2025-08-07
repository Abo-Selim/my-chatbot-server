const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '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';

app.post('/chat', upload.single('file'), async (req, res) => {
    const { message } = req.body;
    const file = req.file;

    try {
        let prompt = message || "Analyze the attached file";
        
        // If file is uploaded, read its content
        if (file) {
            const filePath = path.join(__dirname, file.path);
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            prompt += `\n\nFile Content (${file.originalname}):\n${fileContent}`;
            
            // Clean up the file after reading
            fs.unlinkSync(filePath);
        }

        const response = await axios.post(
            'https://api.perplexity.ai/chat/completions',
            {
                model: 'sonar-pro',
                messages: [
                    { role: 'system', content: 'Be precise and concise in your responses. Analyze any provided files carefully.' },
                    { role: 'user', content: prompt }
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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
