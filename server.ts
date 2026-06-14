import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // API constraints check handling
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Business AI Chatbot Endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { message } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({ reply: "I am currently offline. Please configure the GEMINI_API_KEY in the settings to enable business intelligence." });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are the sophisticated AI business assistant for MULTICENO CEO. You provide quick, smart, and highly concise executive advice. Answer briefly. The CEO says: ${message}`,
      });
      
      res.json({ reply: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ reply: 'I encountered an error analyzing that request. Please try again later.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Command Center server running on http://localhost:${PORT}`);
  });
}

startServer();
