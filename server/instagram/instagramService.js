/**
 * Instagram Messaging Integration for Navii
 * Meta Graph API / Instagram Webhook handler & Dispatcher
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { processConversationTurn } from '../engine/generator.js';

const IG_LOG_FILE = path.resolve(process.cwd(), 'server/data/instagram_logs.json');

class InstagramService {
  constructor() {
    this.appId = process.env.INSTAGRAM_APP_ID || '1075823415053557';
    this.appSecret = process.env.INSTAGRAM_APP_SECRET || '7994e67eaf8641ca3f10d26b86d91da1';
    this.verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN || 'navii_instagram_verify_token_2026';
    this.accessToken = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN || '';
    this.accountId = process.env.INSTAGRAM_ACCOUNT_ID || '29088160597455965';
    this.username = process.env.INSTAGRAM_USERNAME || 'navisha.dn';
    this.accountType = 'MEDIA_CREATOR';
    this.autoReplyEnabled = true;

    // Per-user conversation memory: { [igUserId]: Array<{ id, sender, text, timestamp }> }
    this.userSessions = new Map();

    // Event logs
    this.eventLogs = [];
    this.loadLogs();
    this.refreshAccountProfile();
  }

  async refreshAccountProfile() {
    if (!this.accessToken) return;
    try {
      const endpoint = this.accessToken.startsWith('IGAA')
        ? `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${this.accessToken}`
        : `https://graph.facebook.com/v21.0/me?access_token=${this.accessToken}`;

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.id) this.accountId = data.id;
        if (data.username) this.username = data.username;
        if (data.account_type) this.accountType = data.account_type;
        console.log(`[Instagram Service] Connected to verified Instagram Account: @${this.username} (ID: ${this.accountId})`);
      }
    } catch (e) {
      console.warn('[Instagram Service] Failed to refresh profile:', e.message);
    }
  }

  loadLogs() {
    try {
      if (fs.existsSync(IG_LOG_FILE)) {
        this.eventLogs = JSON.parse(fs.readFileSync(IG_LOG_FILE, 'utf-8'));
      }
    } catch (e) {
      this.eventLogs = [];
    }
  }

  saveLogs() {
    try {
      const dir = path.dirname(IG_LOG_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(IG_LOG_FILE, JSON.stringify(this.eventLogs.slice(0, 100), null, 2), 'utf-8');
    } catch (e) {}
  }

  logEvent(type, payload, status = 'success') {
    const entry = {
      id: 'ig-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      type,
      payload,
      status,
      timestamp: new Date().toISOString()
    };
    this.eventLogs.unshift(entry);
    if (this.eventLogs.length > 100) this.eventLogs.pop();
    this.saveLogs();
    return entry;
  }

  getConfig() {
    return {
      appId: this.appId,
      appSecretConfigured: !!this.appSecret,
      verifyToken: this.verifyToken,
      hasAccessToken: !!this.accessToken,
      accountId: this.accountId,
      username: this.username,
      accountType: this.accountType,
      autoReplyEnabled: this.autoReplyEnabled,
      activeUserSessions: this.userSessions.size,
      totalEvents: this.eventLogs.length
    };
  }

  updateConfig({ accessToken, verifyToken, autoReplyEnabled }) {
    if (typeof accessToken === 'string') {
      this.accessToken = accessToken.trim();
      this.refreshAccountProfile();
    }
    if (typeof verifyToken === 'string') this.verifyToken = verifyToken.trim();
    if (typeof autoReplyEnabled === 'boolean') this.autoReplyEnabled = autoReplyEnabled;
    return this.getConfig();
  }

  // Meta Webhook verification (GET /api/instagram/webhook)
  verifyWebhook(query) {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode === 'subscribe' && token === this.verifyToken) {
      this.logEvent('WEBHOOK_VERIFIED', { mode, token });
      return { verified: true, challenge };
    }
    return { verified: false, error: 'Verification token mismatch' };
  }

  // Verify Meta SHA256 Signature (x-hub-signature-256)
  verifySignature(rawBody, signatureHeader) {
    if (!signatureHeader || !this.appSecret) return true;
    try {
      const elements = signatureHeader.split('=');
      const signature = elements[1];
      const expectedSignature = crypto
        .createHmac('sha256', this.appSecret)
        .update(rawBody)
        .digest('hex');
      return signature === expectedSignature;
    } catch (e) {
      return false;
    }
  }

  // Handle incoming webhook events (POST /api/instagram/webhook)
  async handleWebhookPayload(payload) {
    if (!payload || !payload.entry) return { processed: 0 };

    let processedCount = 0;

    for (const entry of payload.entry) {
      const messagingEvents = entry.messaging || [];
      for (const event of messagingEvents) {
        if (event.message && !event.message.is_echo) {
          const senderId = event.sender.id;
          const text = event.message.text;

          if (text) {
            processedCount++;
            await this.processIncomingUserMessage(senderId, text, event);
          }
        }
      }
    }

    return { processed: processedCount };
  }

  // Process a user message through Navii Conversation Engine
  async processIncomingUserMessage(senderId, userText, rawEvent = null) {
    let history = this.userSessions.get(senderId) || [];

    this.logEvent('INCOMING_DM', {
      senderId,
      text: userText,
      username: this.username,
      rawEvent
    });

    if (!this.autoReplyEnabled) {
      return { autoReplySkipped: true };
    }

    // 1. Send simulated typing indicator to Instagram
    await this.sendSenderAction(senderId, 'typing_on');

    // 2. Generate response via Navii 6-stage engine
    const naviiTurn = await processConversationTurn({
      message: userText,
      conversationHistory: history.slice(-6)
    });

    // 3. Human simulated delay
    const typingWait = Math.min(naviiTurn.typingDelayMs || 500, 2000);
    await new Promise(resolve => setTimeout(resolve, typingWait));

    // 4. Send message to Instagram user via Graph API
    let sendResult = null;
    if (this.accessToken) {
      sendResult = await this.sendInstagramMessage(senderId, naviiTurn.reply);
    } else {
      sendResult = {
        queued: true,
        note: 'Message generated and ready. Add Instagram Access Token to deliver live to user device.'
      };
    }

    // 5. Update user session history
    history.push({ id: 'u-' + Date.now(), sender: 'user', text: userText, timestamp: new Date().toISOString() });
    history.push({ id: 'n-' + Date.now(), sender: 'navii', text: naviiTurn.reply, timestamp: new Date().toISOString() });
    if (history.length > 20) history = history.slice(-20);
    this.userSessions.set(senderId, history);

    this.logEvent('OUTGOING_REPLY', {
      senderId,
      reply: naviiTurn.reply,
      typingDelayMs: naviiTurn.typingDelayMs,
      sendResult,
      audit: naviiTurn.pipelineAudit
    });

    return {
      senderId,
      userText,
      naviiReply: naviiTurn.reply,
      typingDelayMs: naviiTurn.typingDelayMs,
      audit: naviiTurn.pipelineAudit,
      sendResult
    };
  }

  // Send action (typing_on, mark_seen)
  async sendSenderAction(recipientId, action = 'typing_on') {
    if (!this.accessToken) return null;
    try {
      const isIgLogin = this.accessToken.startsWith('IGAA');
      const base = isIgLogin ? 'https://graph.instagram.com' : 'https://graph.facebook.com';
      const url = `${base}/v21.0/me/messages?access_token=${this.accessToken}`;

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

  // Send text message via Meta Graph API
  async sendInstagramMessage(recipientId, text) {
    if (!this.accessToken) return { error: 'No Instagram Access Token configured' };
    try {
      const isIgLogin = this.accessToken.startsWith('IGAA');
      const base = isIgLogin ? 'https://graph.instagram.com' : 'https://graph.facebook.com';
      const url = `${base}/v21.0/me/messages?access_token=${this.accessToken}`;

      const payload = {
        recipient: { id: recipientId },
        message: { text }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      return data;
    } catch (e) {
      return { error: e.message };
    }
  }

  getLogs() {
    return this.eventLogs;
  }

  clearLogs() {
    this.eventLogs = [];
    this.saveLogs();
    return true;
  }
}

export const instagramService = new InstagramService();
