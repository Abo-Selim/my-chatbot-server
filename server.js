const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000; // التعديل المهم هنا ليعمل على Render
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تأكد من تعيين المتغير البيئي في إعدادات Render
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// Middleware للتعامل مع الملفات
app.use('/uploads', express.static('uploads'));

// نقطة النهاية للدردشة مع دعم الملفات
app.post('/chat', upload.single('file'), async (req, res) => {
    try {
        const { message } = req.body;
        const file = req.file;

        if (!PERPLEXITY_API_KEY) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        let prompt = message || "Analyze the attached file";
        
        if (file) {
            const filePath = path.join(__dirname, file.path);
            let fileContent;
            
            try {
                fileContent = fs.readFileSync(filePath, 'utf-8');
                prompt += `\n\nFile Content (${file.originalname || file.filename}):\n${fileContent}`;
            } catch (readError) {
                console.error('Error reading file:', readError);
                return res.status(500).json({ error: 'Error reading file content' });
            } finally {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        }

        const response = await axios.post(
            'https://api.perplexity.ai/chat/completions',
            {
                model: 'sonar-small-chat',
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are an AI assistant. Be precise and concise in your responses.' 
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
                timeout: 10000 // 10 ثانية timeout
            }
        );
        
        res.json({ response: response.data.choices[0].message.content });
    } catch (error) {
        console.error('API Error:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
            console.error('Response Status:', error.response.status);
        }
        res.status(500).json({ 
            error: 'Failed to get AI response',
            details: error.message 
        });
    }
});

// نقطة نهاية للتحقق من صحة الخادم
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// بدء الخادم
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    if (!PERPLEXITY_API_KEY) {
        console.warn('Warning: PERPLEXITY_API_KEY is not set!');
    }
});
