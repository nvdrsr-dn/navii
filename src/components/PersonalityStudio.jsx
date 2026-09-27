import React from 'react';
import { X, Sparkles, Heart, Smile, Flame, BookOpen, MessageSquare, Mic, SlidersHorizontal, RotateCcw } from 'lucide-react';

const PRESETS = [
  {
    id: 'companion',
    title: 'Girlfriend / Companion',
    desc: 'Deeply affectionate, caring, playful banter & cute Hinglish/English touches',
    values: {
      affection: 85,
      playfulness: 75,
      teasing: 65,
      formality: 10,
      emojiUsage: 75,
      talkativeness: 45,
      emotionalExpressiveness: 85,
      relationshipPreset: 'companion'
    }
  },
  {
    id: 'bestie',
    title: 'Playful Bestie',
    desc: 'High banter, savage teasing, sarcastic humor, memes & high energy',
    values: {
      affection: 45,
      playfulness: 95,
      teasing: 85,
      formality: 5,
      emojiUsage: 80,
      talkativeness: 55,
      emotionalExpressiveness: 75,
      relationshipPreset: 'bestie'
    }
  },
  {
    id: 'confidante',
    title: 'Late Night Confidante',
    desc: 'Empathetic listener, warm, thoughtful, gentle advice & emotional depth',
    values: {
      affection: 70,
      playfulness: 40,
      teasing: 20,
      formality: 25,
      emojiUsage: 45,
      talkativeness: 60,
      emotionalExpressiveness: 90,
      relationshipPreset: 'confidante'
    }
  },
  {
    id: 'chill',
    title: 'Chill Buddy',
    desc: 'Low-key, relaxed, minimal drama, casual one-liners and easygoing vibe',
    values: {
      affection: 30,
      playfulness: 55,
      teasing: 40,
      formality: 15,
      emojiUsage: 35,
      talkativeness: 35,
      emotionalExpressiveness: 50,
      relationshipPreset: 'chill'
    }
  }
];

export default function PersonalityStudio({
  settings,
  onUpdateSettings,
  onClose
}) {
  const handleSliderChange = (key, value) => {
    onUpdateSettings({ ...settings, [key]: Number(value) });
  };

  const applyPreset = (preset) => {
    onUpdateSettings({ ...settings, ...preset.values });
  };

  const getAffectionHint = (v) => {
    if (v > 75) return 'Affectionate pet names & sweet colloquialisms ("acha ji 😂", "tum bhi na...", "haan baba")';
    if (v > 40) return 'Friendly, warm, and supportive demeanor';
    return 'Platonic, calm, and neutral';
  };

  const getPlayfulnessHint = (v) => {
    if (v > 75) return 'Laughs easily, makes witty remarks, lively ("haha", "lol", "😂")';
    if (v > 40) return 'Balanced humor when context calls for it';
    return 'Grounded, serious, direct';
  };

  const getTeasingHint = (v) => {
    if (v > 70) return 'Cheeky harmless roasts ("haan haan, tumhare 5 minute mujhe pata hain 😂")';
    if (v > 35) return 'Subtle, gentle teasing';
    return 'Zero teasing, purely respectful';
  };

  const getFormalityHint = (v) => {
    if (v < 20) return 'Urban texting slang, casual abbreviations, lowercase aesthetic';
    if (v < 60) return 'Everyday casual conversational style';
    return 'Structured, grammatically formal tone';
  };

  const getEmojiHint = (v) => {
    if (v > 70) return 'Vibrant emojis matching sentiment (😭, 😂, ☀️, 🥺, ❤️)';
    if (v > 35) return 'Selective 1 emoji occasionally';
    return 'Clean text without emojis';
  };

  const getTalkativenessHint = (v) => {
    if (v < 35) return 'Punchy texting style. Never writes unprompted paragraphs.';
    if (v < 70) return 'Moderate conversational length matching user pace.';
    return 'Elaborate, expressive, longer reflections.';
  };

  const getExpressivenessHint = (v) => {
    if (v > 70) return 'Emotionally dynamic, visibly reacts to highs and lows';
    return 'Even-tempered and measured';
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer-panel" onClick={(e) => e.stopPropagation()} id="personality-studio-drawer">
        <div className="drawer-header">
          <div className="drawer-title-row">
            <SlidersHorizontal size={20} color="#ff5e98" />
            <h2 className="drawer-title">Personality Studio</h2>
          </div>
          <button className="drawer-close" onClick={onClose} id="close-personality-btn">
            <X size={20} />
          </button>
        </div>

        <div className="drawer-content">
          {/* Presets */}
          <div className="preset-selector-group">
            <label className="section-label">Relationship Dynamic</label>
            <div className="presets-grid">
              {PRESETS.map((p) => {
                const isActive = settings.relationshipPreset === p.id;
                return (
                  <button
                    key={p.id}
                    className={`preset-card ${isActive ? 'active' : ''}`}
                    onClick={() => applyPreset(p)}
                    id={`preset-${p.id}`}
                  >
                    <div className="preset-card-title">{p.title}</div>
                    <div className="preset-card-desc">{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sliders Stack */}
          <div className="sliders-stack">
            <label className="section-label">Fine-Grained Personality Tuning (0–100)</label>

            {/* Affection */}
            <div className="slider-card">
              <div className="slider-top-row">
                <span className="slider-name">Affection</span>
                <span className="slider-value">{settings.affection || 80}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.affection || 80}
                onChange={(e) => handleSliderChange('affection', e.target.value)}
                className="custom-range"
                id="slider-affection"
              />
              <span className="slider-hint">{getAffectionHint(settings.affection || 80)}</span>
            </div>

            {/* Playfulness */}
            <div className="slider-card">
              <div className="slider-top-row">
                <span className="slider-name">Playfulness</span>
                <span className="slider-value">{settings.playfulness || 75}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.playfulness || 75}
                onChange={(e) => handleSliderChange('playfulness', e.target.value)}
                className="custom-range"
                id="slider-playfulness"
              />
              <span className="slider-hint">{getPlayfulnessHint(settings.playfulness || 75)}</span>
            </div>

            {/* Teasing */}
            <div className="slider-card">
              <div className="slider-top-row">
                <span className="slider-name">Playful Teasing</span>
                <span className="slider-value">{settings.teasing || 65}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.teasing || 65}
                onChange={(e) => handleSliderChange('teasing', e.target.value)}
                className="custom-range"
                id="slider-teasing"
              />
              <span className="slider-hint">{getTeasingHint(settings.teasing || 65)}</span>
            </div>

            {/* Formality */}
            <div className="slider-card">
              <div className="slider-top-row">
                <span className="slider-name">Formality (Casual vs Structured)</span>
                <span className="slider-value">{settings.formality ?? 10}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.formality ?? 10}
                onChange={(e) => handleSliderChange('formality', e.target.value)}
                className="custom-range"
                id="slider-formality"
              />
              <span className="slider-hint">{getFormalityHint(settings.formality ?? 10)}</span>
            </div>

            {/* Emoji Usage */}
            <div className="slider-card">
              <div className="slider-top-row">
                <span className="slider-name">Emoji Usage</span>
                <span className="slider-value">{settings.emojiUsage || 70}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.emojiUsage || 70}
                onChange={(e) => handleSliderChange('emojiUsage', e.target.value)}
                className="custom-range"
                id="slider-emoji"
              />
              <span className="slider-hint">{getEmojiHint(settings.emojiUsage || 70)}</span>
            </div>

            {/* Talkativeness */}
            <div className="slider-card">
              <div className="slider-top-row">
                <span className="slider-name">Talkativeness (Concise vs Verbose)</span>
                <span className="slider-value">{settings.talkativeness || 45}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.talkativeness || 45}
                onChange={(e) => handleSliderChange('talkativeness', e.target.value)}
                className="custom-range"
                id="slider-talkativeness"
              />
              <span className="slider-hint">{getTalkativenessHint(settings.talkativeness || 45)}</span>
            </div>

            {/* Emotional Expressiveness */}
            <div className="slider-card">
              <div className="slider-top-row">
                <span className="slider-name">Emotional Expressiveness</span>
                <span className="slider-value">{settings.emotionalExpressiveness || 85}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.emotionalExpressiveness || 85}
                onChange={(e) => handleSliderChange('emotionalExpressiveness', e.target.value)}
                className="custom-range"
                id="slider-expressiveness"
              />
              <span className="slider-hint">{getExpressivenessHint(settings.emotionalExpressiveness || 85)}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
