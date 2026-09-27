/**
 * Language & Emotion Analyzer for Navii Conversation Engine
 */

const HINGLISH_KEYWORDS = [
  'yaar', 'kya', 'hua', 'kaafi', 'aaj', 'kal', 'hai', 'hain', 'ho', 'rha', 'rhi', 'raha', 'rahi',
  'bhai', 'bata', 'batao', 'achha', 'acha', 'theek', 'bhi', 'mera', 'meri', 'mere', 'hum', 'tum',
  'mujhe', 'tumhe', 'waise', 'baat', 'chalo', 'nahi', 'nhi', 'kar', 'karo', 'kyun', 'kaise',
  'hoga', 'hogi', 'bas', 'pagal', 'sun', 'dekho', 'kuch', 'aisa', 'bohot', 'bahut', 'sahi',
  'matlab', 'abhi', 'pehle', 'baad', 'thoda', 'thodi', 'pakka', 'chal', 'arey', 'arre', 'waise'
];

export function detectLanguage(text) {
  if (!text || typeof text !== 'string') {
    return { language: 'english', confidence: 1.0, script: 'latin' };
  }

  const clean = text.trim();

  // Check for Devanagari script
  const devanagariRegex = /[\u0900-\u097F]/;
  if (devanagariRegex.test(clean)) {
    return {
      language: 'hindi',
      confidence: 0.95,
      script: 'devanagari',
      label: 'Hindi (Devanagari)'
    };
  }

  // Check for Romanized Hindi (Hinglish)
  const words = clean.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return { language: 'english', confidence: 0.8, script: 'latin', label: 'English' };
  }

  let hinglishHits = 0;
  for (const w of words) {
    if (HINGLISH_KEYWORDS.includes(w)) {
      hinglishHits++;
    }
  }

  const ratio = hinglishHits / words.length;

  if (hinglishHits >= 2 || (words.length <= 3 && hinglishHits >= 1) || ratio >= 0.25) {
    return {
      language: 'hinglish',
      confidence: Math.min(0.99, 0.5 + ratio * 0.5),
      script: 'latin',
      label: 'Hinglish (Casual Romanized Hindi)',
      hits: hinglishHits
    };
  }

  return {
    language: 'english',
    confidence: Math.max(0.7, 1 - ratio),
    script: 'latin',
    label: 'English'
  };
}

export function detectEmotion(text, recentContext = []) {
  if (!text) {
    return { emotion: 'neutral', intensity: 5, markers: [] };
  }

  const lower = text.toLowerCase();
  const markers = [];

  const EMOTION_PATTERNS = [
    {
      emotion: 'sad',
      regex: /(mood kharab|sad|upset|crying|cry|thak gaya|thak gayi|exhausted|depressed|dard|rona|akela|hurt|broke|bura lag|dukhi|heartbroken|lonely|down|😭|😢|🥺|💔)/i,
      weight: 8
    },
    {
      emotion: 'excited',
      regex: /(yesss|omg|omggg|finally|so excited|can't wait|hyped|crazy|insane|maza aa gaya|boom|yayy|wooo|🤩|🔥|🎉|🥳)/i,
      weight: 9
    },
    {
      emotion: 'happy',
      regex: /(happy|badhiya|mast|good day|great day|blessed|smiling|glad|cheerful|haha|hehe|nice|love it|khush|masti|🥰|😊|✨|💛)/i,
      weight: 7
    },
    {
      emotion: 'annoyed',
      regex: /(annoyed|irritated|pak gaya|pak gayi|gussa|bakwaas|faltu|hate it|ridiculous|ghatiya|pissed|dimag kharab|chup|ugh|smh|😤|😡|🤬)/i,
      weight: 8
    },
    {
      emotion: 'nervous',
      regex: /(nervous|anxious|dar lag|tension|stress|panic|scared|worried|exam|interview|failing|phat rahi|darr|scary|anxiety|😰|😬)/i,
      weight: 8
    },
    {
      emotion: 'confused',
      regex: /(confused|samajh nahi|samajh nhi|what does this mean|huh\??|wait what|kaise karu|kya karu|lost|clueless|pata nahi|kya bol|🤔|🧐)/i,
      weight: 7
    },
    {
      emotion: 'bored',
      regex: /(bored|bore ho|kuch karne ko nahi|nothing to do|boring|sleepy|sone ja|so raha|nind|neend|🥱|😴)/i,
      weight: 6
    },
    {
      emotion: 'playful',
      regex: /(lol|lmao|rofl|haha|hehe|jk|joke|masti|tease|shaitani|pagal|nautanki|tu dekh|😂|🤣|😜|🤪|😏)/i,
      weight: 7
    },
    {
      emotion: 'affectionate',
      regex: /(love you|miss you|care for you|sweetheart|babu|jaan|pyaar|cutie|adorable|my favorite|sweet|hug|cuddle|pyar|❤️|💖|😘|🥺)/i,
      weight: 9
    },
    {
      emotion: 'serious',
      regex: /(actually|seriously|honest|reality|career|future|family issue|important decision|problem|advice|real talk)/i,
      weight: 7
    }
  ];

  let detected = 'neutral';
  let highestScore = 0;

  for (const p of EMOTION_PATTERNS) {
    const match = lower.match(p.regex);
    if (match) {
      markers.push(match[0]);
      if (p.weight > highestScore) {
        highestScore = p.weight;
        detected = p.emotion;
      }
    }
  }

  // Energy & exclamation boost
  const exclamationCount = (text.match(/!/g) || []).length;
  const questionCount = (text.match(/\?/g) || []).length;
  const isCaps = text.length > 5 && text === text.toUpperCase() && /[A-Z]/.test(text);

  let intensity = highestScore || 5;
  if (exclamationCount >= 2 || isCaps) intensity = Math.min(10, intensity + 2);
  if (questionCount >= 2 && detected === 'neutral') {
    detected = 'confused';
    intensity = 6;
  }

  return {
    emotion: detected,
    intensity,
    markers: markers.slice(0, 4)
  };
}

export function analyzeEnergyAndLength(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = text.length;

  let category = 'medium';
  if (wordCount <= 3) category = 'very_short'; // "hey", "good morning", "acha", "lol"
  else if (wordCount <= 8) category = 'short';
  else if (wordCount > 25) category = 'long';

  const isGreeting = /^(hey|heyy|hi|hello|namaste|good morning|gm|gn|good night|sup|yo)\b/i.test(text.trim());

  return {
    wordCount,
    charCount,
    category,
    isGreeting,
    hasQuestions: text.includes('?')
  };
}

export function detectMultiTurnReferences(text, recentMessages = []) {
  const referencePatterns = [
    { type: 'that_one', regex: /\b(that one|wo wala|wahi|wohi|same thing|uska|uski|unka)\b/i },
    { type: 'past_matter', regex: /\b(kal wali baat|jo maine bataya tha|remember what i said|last time|earlier)\b/i },
    { type: 'followup', regex: /\b(what happened to that|uska kya hua|kya bana|did it happen)\b/i },
    { type: 'again', regex: /\b(again|phir se|wapas|same problem)\b/i }
  ];

  const matched = [];
  for (const p of referencePatterns) {
    if (p.regex.test(text)) {
      matched.push(p.type);
    }
  }

  return {
    hasReference: matched.length > 0,
    references: matched
  };
}
