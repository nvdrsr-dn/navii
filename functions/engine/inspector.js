/**
 * Quality Inspector & Pipeline Auditor for Navii Conversation Engine
 * Implements Stage 6 of the Human-like Response Generation Pipeline
 */

const ROBOTIC_PATTERNS = [
  /how (can|may) i (assist|help) you (today|\b)/gi,
  /i am here to (assist|help)( you)?/gi,
  /certainly[,!.]?/gi,
  /of course[,!.]? i can help/gi,
  /as an ai( language model| companion)?/gi,
  /i understand( your concern| that)?/gi,
  /that's a great question/gi,
  /i do not have personal feelings/gi,
  /feel free to ask/gi,
  /please let me know if there's anything else/gi
];

export function inspectAndReviseResponse({
  rawResponse,
  userMessage,
  energyAnalysis,
  detectedLanguage,
  detectedEmotion,
  recentNaviiMessages = [],
  settings = {}
}) {
  let revised = (rawResponse || '').trim();
  const flags = [];
  let wasRevised = false;

  // 1. Robotic Phrase Check
  for (const pattern of ROBOTIC_PATTERNS) {
    if (pattern.test(revised)) {
      flags.push({
        type: 'ROBOTIC_PHRASE',
        severity: 'high',
        detail: `Found robotic pattern: "${pattern.source}"`
      });
      // Scrub out robotic phrase
      revised = revised.replace(pattern, '').trim();
      wasRevised = true;
    }
  }

  // 2. Length check for very short greetings
  // If user said "hey" or "good morning" and model generated a long paragraph
  if (energyAnalysis.isGreeting || energyAnalysis.category === 'very_short') {
    const words = revised.split(/\s+/).filter(Boolean);
    if (words.length > 14) {
      flags.push({
        type: 'EXCESSIVE_LENGTH_FOR_GREETING',
        severity: 'medium',
        detail: `Response has ${words.length} words for a short greeting. Trimming to natural short greeting.`
      });

      // Keep only first sentence
      const sentences = revised.split(/[.?!]\s+/);
      if (sentences.length > 0 && sentences[0].length > 3) {
        revised = sentences[0];
        // Ensure proper punctuation
        if (!/[.!?😭😂☀️✨]$/.test(revised)) revised += ' 😊';
      }
      wasRevised = true;
    }
  }

  // 3. Language Match Check
  if (detectedLanguage.language === 'hinglish') {
    // Check if the reply is purely English with no Hinglish colloquialisms
    const commonHinglish = /yaar|kya|hua|haan|acha|theek|bhi|kar|rahi|raha|kyun|arre|arey|toh|sahi|bas/i;
    if (!commonHinglish.test(revised)) {
      flags.push({
        type: 'LANGUAGE_DISCREPANCY',
        severity: 'medium',
        detail: 'User spoke Hinglish but reply had low Hinglish colloquial density.'
      });
    }
  }

  // 4. Repetition Check
  const isDuplicate = recentNaviiMessages.slice(-3).some(past => {
    return past.trim().toLowerCase() === revised.toLowerCase();
  });

  if (isDuplicate) {
    flags.push({
      type: 'REPETITIVE_OUTPUT',
      severity: 'high',
      detail: 'Generated identical response to recent message. Rephrasing.'
    });

    if (detectedLanguage.language === 'hinglish') {
      const alternatives = [
        "heyy, sab badhiya? batao na",
        "haan bolo na, sun rahi hu",
        "arre haan, kya chal raha hai?"
      ];
      revised = alternatives[Math.floor(Math.random() * alternatives.length)];
    } else {
      const alternatives = [
        "heyy, what's on your mind?",
        "listening! what's up?",
        "hey there, how are you feeling now?"
      ];
      revised = alternatives[Math.floor(Math.random() * alternatives.length)];
    }
    wasRevised = true;
  }

  // 5. Final polish: remove quotes or "Navii:" prefix if model outputs them
  revised = revised.replace(/^(navii|navisha):\s*/i, '');
  revised = revised.replace(/^["']|["']$/g, '').trim();

  // If text became empty after scrubbing
  if (!revised) {
    revised = detectedLanguage.language === 'hinglish' ? "heyy, kya hua? 😭" : "heyy, what's up? 😭";
    wasRevised = true;
  }

  return {
    finalResponse: revised,
    wasRevised,
    flags,
    audit: {
      roboticChecked: true,
      lengthChecked: true,
      languageMatched: flags.every(f => f.type !== 'LANGUAGE_DISCREPANCY'),
      repetitionCleared: !isDuplicate,
      confidenceScore: Math.max(85, 100 - flags.length * 5)
    }
  };
}
