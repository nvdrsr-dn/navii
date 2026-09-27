/**
 * Human Response Timing & Pacing Calculator
 * Accurately simulates human typing pace based on message length and emotional intensity
 */

export function calculateTypingDelay(responseText, emotionIntensity = 5) {
  if (!responseText) return 400;

  const charCount = responseText.length;

  // Base human hesitation: 250ms - 450ms
  const baseHesitation = 250 + Math.floor(Math.random() * 200);

  // Realistic human typing: ~15 to 22 ms per character with jitter
  const typingSpeed = 16 + Math.random() * 6;
  const rawTypingTime = charCount * typingSpeed;

  // Emotional jitter: intense emotion causes slight pauses
  const emotionalPause = emotionIntensity > 7 ? 150 : 0;

  const totalCalculated = Math.round(baseHesitation + rawTypingTime + emotionalPause);

  // Clamp within user-friendly bounds (min 400ms, max 2400ms so UI is snappy yet natural)
  const clampedDelay = Math.min(2400, Math.max(400, totalCalculated));

  return {
    delayMs: clampedDelay,
    charCount,
    estimatedWpm: Math.round((charCount / 5) / (clampedDelay / 60000)),
    breakdown: {
      hesitation: baseHesitation,
      typing: Math.round(rawTypingTime),
      emotionalPause
    }
  };
}
