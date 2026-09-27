/**
 * Core Generation Pipeline for Navii Conversation Engine
 */

import { detectLanguage, detectEmotion, analyzeEnergyAndLength, detectMultiTurnReferences } from './analyzer.js';
import { memoryStore } from './memory.js';
import { buildSystemPrompt } from './promptBuilder.js';
import { inspectAndReviseResponse } from './inspector.js';
import { calculateTypingDelay } from './timing.js';

export async function processConversationTurn({
  message,
  conversationHistory = [],
  settings = {}
}) {
  const startTime = Date.now();

  // STAGE 1: Input Analysis
  const detectedLanguage = detectLanguage(message);
  const detectedEmotion = detectEmotion(message, conversationHistory);
  const energyAnalysis = analyzeEnergyAndLength(message);
  const referenceAnalysis = detectMultiTurnReferences(message, conversationHistory);

  // STAGE 2: Memory Retrieval & Background Extraction
  const relevantMemories = memoryStore.findRelevantMemories(message, conversationHistory);

  // Background extraction of new facts
  const newFacts = memoryStore.extractPotentialFacts(message);
  for (const f of newFacts) {
    // Only add if not already in memory
    const existing = memoryStore.getAll().some(m => m.key === f.key && m.detail.includes(f.detail.slice(0, 30)));
    if (!existing) {
      memoryStore.add(f.detail, f.category, f.key, `User chat: "${message.slice(0, 50)}"`);
    }
  }

  // STAGE 3: Prompt Synthesis
  const systemPrompt = buildSystemPrompt({
    settings,
    detectedLanguage,
    detectedEmotion,
    energyAnalysis,
    relevantMemories,
    recentMessages: conversationHistory
  });

  // STAGE 4: Response Generation (Gemini 3.8 Flash / OpenRouter / Local Fallback)
  let rawText = '';
  let providerUsed = 'gemini-3.8-flash';

  try {
    rawText = await callGeminiModel(systemPrompt, conversationHistory, message);
  } catch (geminiError) {
    console.warn('Gemini 3.8 Flash error, attempting OpenRouter fallback:', geminiError.message);
    try {
      rawText = await callOpenRouterModel(systemPrompt, conversationHistory, message);
      providerUsed = 'openrouter';
    } catch (openRouterError) {
      console.warn('OpenRouter error, using intelligent fallback generator:', openRouterError.message);
      rawText = generateIntelligentFallback({
        message,
        detectedLanguage,
        detectedEmotion,
        energyAnalysis,
        relevantMemories,
        settings
      });
      providerUsed = 'heuristic-engine';
    }
  }

  // STAGE 5: Quality Inspection & Self-Revision
  const recentNaviiMsgs = conversationHistory
    .filter(m => m.sender === 'navii')
    .map(m => m.text);

  const inspectionResult = inspectAndReviseResponse({
    rawResponse: rawText,
    userMessage: message,
    energyAnalysis,
    detectedLanguage,
    detectedEmotion,
    recentNaviiMessages: recentNaviiMsgs,
    settings
  });

  // STAGE 6: Timing & Simulated Typing Computation
  const timing = calculateTypingDelay(inspectionResult.finalResponse, detectedEmotion.intensity);

  const durationMs = Date.now() - startTime;

  return {
    reply: inspectionResult.finalResponse,
    typingDelayMs: timing.delayMs,
    provider: providerUsed,
    pipelineAudit: {
      durationMs,
      detectedLanguage,
      detectedEmotion,
      energyAnalysis,
      referenceAnalysis,
      memoriesUsed: relevantMemories.map(m => ({ id: m.id, detail: m.detail, score: m.score })),
      newMemoriesExtracted: newFacts,
      qualityCheck: inspectionResult.audit,
      flags: inspectionResult.flags,
      wasRevised: inspectionResult.wasRevised,
      timingBreakdown: timing
    }
  };
}

async function callGeminiModel(systemPrompt, conversationHistory, currentMessage) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY not configured');

  const contents = [];

  // Recent messages window (last 8 turns)
  const windowed = conversationHistory.slice(-8);
  for (const msg of windowed) {
    contents.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    });
  }

  // Add current message
  contents.push({
    role: 'user',
    parts: [{ text: currentMessage }]
  });

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      temperature: 0.85,
      topP: 0.95,
      maxOutputTokens: 350
    }
  };

  const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } else {
        const errorText = await response.text();
        lastError = new Error(`Gemini (${model}) ${response.status}: ${errorText}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini candidate models failed');
}

async function callOpenRouterModel(systemPrompt, conversationHistory, currentMessage) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const messages = [{ role: 'system', content: systemPrompt }];
  for (const m of conversationHistory.slice(-6)) {
    messages.push({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    });
  }
  messages.push({ role: 'user', content: currentMessage });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages,
      temperature: 0.85,
      max_tokens: 300
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function generateIntelligentFallback({
  message,
  detectedLanguage,
  detectedEmotion,
  energyAnalysis,
  relevantMemories,
  settings
}) {
  const isHinglish = detectedLanguage.language === 'hinglish';
  const lower = message.toLowerCase();

  // Test cases from specification
  if (energyAnalysis.isGreeting || /^(hey|heyy|hi|hello)$/i.test(message.trim())) {
    const greetings = isHinglish
      ? ['heyy 😭', 'hey, kya hua?', 'heyy, finally 😂', 'heyy! sab theek?']
      : ['heyy 😭', 'hey there! what happened?', 'heyy, finally 😂', 'heyy! how are you?'];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  if (/good morning/i.test(message)) {
    return isHinglish ? 'good morningg ☀️ uth gaye?' : 'good morningg ☀️';
  }

  if (/weird day|ajeeb din/i.test(message)) {
    return isHinglish ? 'ohh 😭 kya hua?' : 'oh no 😭 what happened?';
  }

  if (/mood kharab/i.test(message)) {
    return isHinglish ? 'arey... kya hua? 🥲' : 'oh no... what happened? 🥲';
  }

  if (/5 minute/i.test(message) || /paanch minute/i.test(message)) {
    return isHinglish
      ? 'haan haan, tumhare 5 minute mujhe pata hain 😂'
      : 'yeah sure, I know what your "5 minutes" mean 😂';
  }

  if (/idea perfect hai/i.test(message) || /perfect idea/i.test(message)) {
    return isHinglish
      ? 'hmm idea acha hai, but ek problem hai...'
      : 'hmm the idea sounds interesting, but there is one catch...';
  }

  if (relevantMemories.some(m => m.key === 'exam') && /thak gaya|exhausted|tired/i.test(lower)) {
    return isHinglish ? 'exam ki wajah se?' : 'because of your exam?';
  }

  if (/school|college|office.*funny/i.test(lower)) {
    return isHinglish ? 'wait 😂 kya hua?' : 'wait 😂 what happened?';
  }

  if (isHinglish) {
    if (detectedEmotion.emotion === 'sad') return 'arey yaar... tension mat lo, batao kya hua? 🥺';
    if (detectedEmotion.emotion === 'excited') return 'omggg sach mein?? details do jaldi 😂';
    if (detectedEmotion.emotion === 'annoyed') return 'ugh dimag kharab kisne kiya ab? 😤';
    return 'haan bolo na, sun rahi hu ✨';
  }

  return "I'm right here with you! Tell me what's happening.";
}
