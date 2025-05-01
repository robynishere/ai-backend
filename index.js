const express = require('express');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Trust the proxy to handle the 'X-Forwarded-For' header properly
app.set('trust proxy', 1);  // Enable trust proxy to handle X-Forwarded-For header correctly

// Ensure the app listens on the correct port in the Render environment
const PORT = process.env.PORT || 3001;  // Render assigns a dynamic PORT, so we use that

// Apply rate limiting AFTER app is created
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per minute
  message: 'Too many requests. Please slow down.',
});

app.use(limiter);
app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
  const userMessages = req.body.messages;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions', // OpenAI API endpoint
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: "You are a supportive and friendly AI friend." },
          ...userMessages,
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({
      reply: response.data.choices[0].message.content,
    });
  } catch (error) {
    console.error('OpenAI error:', error.message);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  }
});

// Listen on the specified port (Render's PORT environment variable or 3001)
app.listen(PORT, '0.0.0.0', () => {  // Bind to 0.0.0.0 for external accessibility
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
});
