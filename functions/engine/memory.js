/**
 * Conversational Memory & Continuity Store for Navii
 */

import fs from 'fs';
import path from 'path';

const MEMORY_FILE = path.resolve(process.cwd(), 'server/data/memories.json');

// Default initial episodic facts to demonstrate contextual memory if empty
const DEFAULT_MEMORIES = [
  {
    id: 'mem-1',
    category: 'situation',
    key: 'exam',
    detail: 'User has an important physics/semester exam tomorrow.',
    source: 'Earlier message: "kal mera important exam hai"',
    status: 'active',
    timestamp: Date.now() - 3600000 * 4
  },
  {
    id: 'mem-2',
    category: 'habit',
    key: 'timing',
    detail: 'User always says "5 minutes" but usually takes 20-30 minutes.',
    source: 'Observed pattern: "main 5 minute mein aa raha hu"',
    status: 'active',
    timestamp: Date.now() - 3600000 * 24
  },
  {
    id: 'mem-3',
    category: 'preference',
    key: 'drinks',
    detail: 'Loves iced cold brew coffee when studying late at night.',
    source: 'User mentioned: "iced cold brew keeps me sane"',
    status: 'active',
    timestamp: Date.now() - 3600000 * 48
  }
];

class MemoryStore {
  constructor() {
    this.memories = [];
    this.init();
  }

  init() {
    try {
      const dir = path.dirname(MEMORY_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(MEMORY_FILE)) {
        const data = fs.readFileSync(MEMORY_FILE, 'utf-8');
        this.memories = JSON.parse(data);
      } else {
        this.memories = [...DEFAULT_MEMORIES];
        this.save();
      }
    } catch (e) {
      console.error('Failed to load memories, using default:', e);
      this.memories = [...DEFAULT_MEMORIES];
    }
  }

  save() {
    try {
      const dir = path.dirname(MEMORY_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(MEMORY_FILE, JSON.stringify(this.memories, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist memories:', e);
    }
  }

  getAll() {
    return this.memories;
  }

  add(detail, category = 'general', key = 'fact', source = 'user chat') {
    const item = {
      id: 'mem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      category,
      key,
      detail,
      source,
      status: 'active',
      timestamp: Date.now()
    };
    this.memories.unshift(item);
    if (this.memories.length > 50) this.memories.pop();
    this.save();
    return item;
  }

  remove(id) {
    this.memories = this.memories.filter(m => m.id !== id);
    this.save();
  }

  reset() {
    this.memories = [...DEFAULT_MEMORIES];
    this.save();
    return this.memories;
  }

  clear() {
    this.memories = [];
    this.save();
    return this.memories;
  }

  // Extract memory candidates from user's current message
  extractPotentialFacts(text) {
    const extracted = [];
    const lower = text.toLowerCase();

    // Check for exam / test / interview
    if (/(exam|test|interview|viva|quiz)/i.test(lower)) {
      extracted.push({
        category: 'situation',
        key: 'exam',
        detail: `User mentioned upcoming test or academic event: "${text.slice(0, 100)}"`
      });
    }

    // Check for health / feeling tired / headache
    if (/(sir dard|headache|fever|sick|bimar|tabiyat|weak)/i.test(lower)) {
      extracted.push({
        category: 'health',
        key: 'wellbeing',
        detail: `User mentioned health/tiredness: "${text.slice(0, 100)}"`
      });
    }

    // Check for delay / "5 minute"
    if (/(5 minute|5 min|paanch minute|aarha hu|aa raha hu)/i.test(lower)) {
      extracted.push({
        category: 'habit',
        key: 'delay',
        detail: `User promised to arrive in 5 mins: "${text.slice(0, 60)}"`
      });
    }

    // Check for job / project / work
    if (/(boss|manager|client|deadline|office|project|code|submission)/i.test(lower)) {
      extracted.push({
        category: 'work',
        key: 'work_project',
        detail: `User has an ongoing work/project event: "${text.slice(0, 100)}"`
      });
    }

    return extracted;
  }

  // Find memories relevant to current user message and recent context
  findRelevantMemories(text, recentMessages = []) {
    if (!text && recentMessages.length === 0) return [];

    const queryTokens = (text + ' ' + recentMessages.map(m => m.content).slice(-3).join(' '))
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    const relevant = [];

    for (const mem of this.memories) {
      if (mem.status !== 'active') continue;
      const memTokens = (mem.key + ' ' + mem.detail + ' ' + mem.category).toLowerCase();

      // Keyword overlap
      let hits = 0;
      for (const token of queryTokens) {
        if (memTokens.includes(token)) hits++;
      }

      // Semantic triggers:
      // If user says "thak gaya" or "exhausted" or "stress" and there is an exam memory
      const fatigueWords = ['thak', 'tired', 'exhausted', 'stress', 'tension', 'weird', 'kharab', 'heavy', 'pack'];
      const isFatigued = fatigueWords.some(w => queryTokens.includes(w));
      if (isFatigued && (mem.key === 'exam' || mem.category === 'situation')) {
        hits += 3;
      }

      // If user says "aa gaya" or "back" or "here" and there is a 5-min delay memory
      const delayWords = ['aagaya', 'aa gaya', 'back', 'here', 'late', 'sorry'];
      const isBack = delayWords.some(w => (text.toLowerCase()).includes(w));
      if (isBack && mem.key === 'timing') {
        hits += 3;
      }

      // If user asks "uska kya hua" or "what happened"
      if (/uska kya hua|what happened|wahi baat|kal wali/i.test(text)) {
        hits += 2;
      }

      if (hits > 0) {
        relevant.push({
          ...mem,
          score: hits
        });
      }
    }

    // Sort by score descending and return top 3
    relevant.sort((a, b) => b.score - a.score);
    return relevant.slice(0, 3);
  }
}

export const memoryStore = new MemoryStore();
