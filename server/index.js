import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { processConversationTurn } from './engine/generator.js';
import { memoryStore } from './engine/memory.js';
import { instagramService } from './instagram/instagramService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Personality & Relationship Settings Store
const SETTINGS_FILE = path.resolve(process.cwd(), 'server/data/settings.json');
const DEFAULT_SETTINGS = {
  affection: 80,
  playfulness: 75,
  teasing: 65,
  formality: 10,
  emojiUsage: 70,
  talkativeness: 45,
  emotionalExpressiveness: 85,
  relationshipPreset: 'companion', // 'companion', 'bestie', 'confidante', 'chill'
  simulatedTyping: true,
  audioFeedback: true
};

let currentSettings = { ...DEFAULT_SETTINGS };

try {
  if (fs.existsSync(SETTINGS_FILE)) {
    currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')) };
  }
} catch (e) {
  console.error('Failed to load settings file, using defaults:', e);
}

function saveSettings() {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(currentSettings, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    engine: 'Navii Human-Like Engine v2.0',
    model: 'gemini-3.8-flash',
    uptime: process.uptime(),
    instagram: instagramService.getConfig()
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [], customSettings } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const effectiveSettings = { ...currentSettings, ...(customSettings || {}) };

    const result = await processConversationTurn({
      message,
      conversationHistory,
      settings: effectiveSettings
    });

    res.json(result);
  } catch (error) {
    console.error('Chat processing error:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      details: error.message
    });
  }
});

// Settings endpoints
app.get('/api/settings', (req, res) => {
  res.json(currentSettings);
});

app.post('/api/settings', (req, res) => {
  try {
    currentSettings = { ...currentSettings, ...req.body };
    saveSettings();
    res.json({ success: true, settings: currentSettings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Memory endpoints
app.get('/api/memories', (req, res) => {
  res.json(memoryStore.getAll());
});

app.post('/api/memories', (req, res) => {
  const { detail, category, key, source } = req.body;
  if (!detail) return res.status(400).json({ error: 'Detail is required' });
  const item = memoryStore.add(detail, category, key, source);
  res.json(item);
});

app.delete('/api/memories/:id', (req, res) => {
  memoryStore.remove(req.params.id);
  res.json({ success: true, memories: memoryStore.getAll() });
});

app.post('/api/memories/reset', (req, res) => {
  const resetMemories = memoryStore.reset();
  res.json({ success: true, memories: resetMemories });
});

app.post('/api/memories/clear', (req, res) => {
  const cleared = memoryStore.clear();
  res.json({ success: true, memories: cleared });
});

// ==========================================
// INSTAGRAM WEBHOOK & INTEGRATION ENDPOINTS
// ==========================================

// Meta Webhook Verification (GET)
app.get('/api/instagram/webhook', (req, res) => {
  const verification = instagramService.verifyWebhook(req.query);
  if (verification.verified) {
    console.log('[Instagram Webhook] Successfully verified by Meta!');
    return res.status(200).send(verification.challenge);
  }
  console.warn('[Instagram Webhook] Verification failed:', verification.error);
  return res.status(403).send('Forbidden: Token mismatch');
});

// Meta Webhook Events (POST)
app.post('/api/instagram/webhook', async (req, res) => {
  // Acknowledge receipt to Meta immediately within 200ms
  res.status(200).send('EVENT_RECEIVED');

  try {
    await instagramService.handleWebhookPayload(req.body);
  } catch (err) {
    console.error('[Instagram Webhook Error]', err);
  }
});

// Instagram Status & Config
app.get('/api/instagram/status', (req, res) => {
  res.json(instagramService.getConfig());
});

app.post('/api/instagram/config', (req, res) => {
  const updated = instagramService.updateConfig(req.body);
  res.json({ success: true, config: updated });
});

app.get('/api/instagram/logs', (req, res) => {
  res.json(instagramService.getLogs());
});

app.post('/api/instagram/simulate', async (req, res) => {
  try {
    const { senderId = 'ig_test_user_' + Math.floor(Math.random() * 1000), text = 'hey' } = req.body;
    const result = await instagramService.processIncomingUserMessage(senderId, text);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Meta Compliance Pages (Privacy Policy, Data Deletion, Terms)
app.get('/privacy', (req, res) => {
  const p = path.resolve(process.cwd(), 'public/privacy.html');
  res.sendFile(p);
});

app.get('/data-deletion', (req, res) => {
  const p = path.resolve(process.cwd(), 'public/data-deletion.html');
  res.sendFile(p);
});

app.get('/terms', (req, res) => {
  const p = path.resolve(process.cwd(), 'public/terms.html');
  res.sendFile(p);
});

// Serve frontend dist if available
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[Navii Engine] Backend running on port ${PORT}`);
});
