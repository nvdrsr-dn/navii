/**
 * Firebase Cloud Function: Meta Instagram Messaging Webhook
 * Serves: GET & POST /api/instagram/webhook
 */

import { onRequest } from 'firebase-functions/v2/https';
import { processConversationTurn } from './engine/generator.js';

// Configuration from environment variables
const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || 'navii_instagram_verify_token_2026';
const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.INSTAGRAM_PAGE_ACCESS_TOKEN || 'IGAAPSdKhZBzPVBZAGJKQ2s4Q1ZAkSDJTc240dFN0eWxYeUJ2dDFWbVYzcGZAaUF8xRGxPcFk3Q0MxS1RNcklfUHE3UEhqR0taZA1cyMlJNNlFYNGYxR0ZARWW5hb3Rza1AyUGh0Xy1YNm1mbW9ZANlRpNktaOUdjSTRmTG13cjNIRklFQQZDZD';

// In-memory session history for Cloud Function instance
const userSessions = new Map();

export const instagramWebhook = onRequest(
  {
    cors: false,
    timeoutSeconds: 60,
    memory: '256MiB',
    maxInstances: 10
  },
  async (req, res) => {
    // -------------------------------------------------------------
    // 1. Meta Webhook Verification (GET)
    // -------------------------------------------------------------
    if (req.method === 'GET') {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[Meta Webhook] Verification successful for subscription handshake.');
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send(challenge);
      } else {
        console.warn('[Meta Webhook] Verification failed: Token mismatch or invalid mode.');
        return res.status(403).send('Forbidden: Verification token mismatch');
      }
    }

    // -------------------------------------------------------------
    // 2. Incoming Webhook Events (POST)
    // -------------------------------------------------------------
    if (req.method === 'POST') {
      const payload = req.body;

      if (!payload || typeof payload !== 'object') {
        return res.status(400).send('Bad Request: Invalid JSON payload');
      }

      // Immediately respond with HTTP 200 to satisfy Meta's strict timeout window
      res.status(200).send('EVENT_RECEIVED');

      // Process messaging events asynchronously
      try {
        await processWebhookEvents(payload);
      } catch (err) {
        console.error('[Meta Webhook] Error processing event asynchronously:', err.message);
      }
      return;
    }

    // Unsupported HTTP Methods
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).send('Method Not Allowed');
  }
);

/**
 * Iterates through Meta event payload and processes incoming Instagram messages
 */
async function processWebhookEvents(payload) {
  const entries = payload.entry || [];

  for (const entry of entries) {
    const messaging = entry.messaging || [];

    for (const event of messaging) {
      // Ignore delivery receipts, read receipts, and self-echo messages
      if (event.message && !event.message.is_echo && event.message.text) {
        const senderId = event.sender?.id;
        const text = event.message.text;

        if (senderId && text) {
          console.log(`[Instagram DM] Received message from user ${senderId}: "${text.slice(0, 40)}"`);
          await handleInstagramUserMessage(senderId, text);
        }
      }
    }
  }
}

/**
 * Handles conversational reply generation and Meta Graph API dispatch
 */
async function handleInstagramUserMessage(senderId, userText) {
  // Retrieve recent session history for this user
  let history = userSessions.get(senderId) || [];

  // Trigger typing indicator on Instagram
  await sendSenderAction(senderId, 'typing_on');

  // Generate response through Navii Conversation Engine
  let replyText = '';
  try {
    const result = await processConversationTurn({
      message: userText,
      conversationHistory: history.slice(-6)
    });
    replyText = result.reply;
  } catch (error) {
    console.error('[Navii Engine] Generation failed, using fallback:', error.message);
    replyText = "heyy, sun rahi hu! kya hua? 😭";
  }

  // Update conversation history
  history.push({ id: 'u-' + Date.now(), sender: 'user', text: userText });
  history.push({ id: 'n-' + Date.now(), sender: 'navii', text: replyText });
  if (history.length > 20) history = history.slice(-20);
  userSessions.set(senderId, history);

  // Send message back via Meta Instagram API
  await sendInstagramMessage(senderId, replyText);
}

/**
 * Sends sender action (e.g. typing_on) to Meta Instagram API
 */
async function sendSenderAction(recipientId, action) {
  if (!ACCESS_TOKEN) return null;
  try {
    const isIgLogin = ACCESS_TOKEN.startsWith('IGAA');
    const base = isIgLogin ? 'https://graph.instagram.com' : 'https://graph.facebook.com';
    const url = `${base}/v21.0/me/messages?access_token=${ACCESS_TOKEN}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        sender_action: action
      })
    });
    return await res.json();
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Sends reply text back to recipient via Meta Instagram API
 */
async function sendInstagramMessage(recipientId, text) {
  if (!ACCESS_TOKEN) {
    console.warn('[Instagram API] No access token configured. Outgoing message skipped.');
    return { error: 'No access token' };
  }

  try {
    const isIgLogin = ACCESS_TOKEN.startsWith('IGAA');
    const base = isIgLogin ? 'https://graph.instagram.com' : 'https://graph.facebook.com';
    const url = `${base}/v21.0/me/messages?access_token=${ACCESS_TOKEN}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text }
      })
    });

    const data = await res.json();
    if (data.error) {
      console.warn('[Instagram API Error]', data.error.message);
    } else {
      console.log(`[Instagram API] Successfully sent message to recipient ${recipientId}`);
    }
    return data;
  } catch (e) {
    console.error('[Instagram API Network Error]', e.message);
    return { error: e.message };
  }
}
