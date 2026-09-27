import React from 'react';
import { Sliders, Activity, Brain, Volume2, VolumeX, Sparkles, Instagram } from 'lucide-react';

export default function NaviiHeader({
  activeDrawer,
  setActiveDrawer,
  soundEnabled,
  setSoundEnabled,
  lastEmotion,
  isTyping
}) {
  const getEmotionAuraColor = (emotion) => {
    switch (emotion) {
      case 'affectionate': return 'linear-gradient(135deg, #ff5e98 0%, #f43f5e 100%)';
      case 'excited': return 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)';
      case 'happy': return 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)';
      case 'sad': return 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)';
      case 'playful': return 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)';
      case 'annoyed': return 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)';
      default: return 'linear-gradient(135deg, #ff5e98 0%, #8b5cf6 100%)';
    }
  };

  const getStatusText = () => {
    if (isTyping) return 'typing a reply...';
    if (lastEmotion && lastEmotion !== 'neutral') {
      return `feeling ${lastEmotion} ✨`;
    }
    return 'online & listening';
  };

  return (
    <header className="navii-header" id="navii-header">
      <div 
        className="navii-identity" 
        onClick={() => setActiveDrawer(activeDrawer === 'personality' ? null : 'personality')}
        title="Click to tune Navii's personality"
      >
        <div className="navii-avatar-wrapper">
          <div 
            className="navii-avatar-aura" 
            style={{ background: getEmotionAuraColor(lastEmotion) }}
          />
          <img 
            src="/navii_avatar.jpg" 
            alt="Navii Avatar" 
            className="navii-avatar" 
            style={{ objectFit: 'cover' }}
          />
        </div>

        <div className="navii-meta">
          <div className="navii-name-row">
            <h1 className="navii-name">Navii</h1>
            <span className="navii-badge">AI Companion</span>
          </div>
          <div className="navii-status-row">
            <span className="status-dot" />
            <span>{getStatusText()}</span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        {/* Sound toggle */}
        <button
          className={`icon-btn ${soundEnabled ? 'active' : ''}`}
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? 'Mute audio feedback' : 'Enable audio feedback'}
          id="toggle-sound-btn"
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        {/* Instagram Bot button */}
        <button
          className={`icon-btn ${activeDrawer === 'instagram' ? 'active' : ''}`}
          onClick={() => setActiveDrawer(activeDrawer === 'instagram' ? null : 'instagram')}
          title="Open Instagram DM Integration"
          id="open-instagram-btn"
        >
          <Instagram size={18} color={activeDrawer === 'instagram' ? '#ff5e98' : undefined} />
        </button>

        {/* Memory Vault button */}
        <button
          className={`icon-btn ${activeDrawer === 'memory' ? 'active' : ''}`}
          onClick={() => setActiveDrawer(activeDrawer === 'memory' ? null : 'memory')}
          title="Open Conversational Memory Vault"
          id="open-memory-btn"
        >
          <Brain size={18} />
        </button>

        {/* Cognitive Pipeline Inspector button */}
        <button
          className={`icon-btn ${activeDrawer === 'inspector' ? 'active' : ''}`}
          onClick={() => setActiveDrawer(activeDrawer === 'inspector' ? null : 'inspector')}
          title="Open Cognitive Pipeline Inspector"
          id="open-inspector-btn"
        >
          <Activity size={18} />
          <span className="btn-indicator" />
        </button>

        {/* Personality Studio button */}
        <button
          className={`icon-btn ${activeDrawer === 'personality' ? 'active' : ''}`}
          onClick={() => setActiveDrawer(activeDrawer === 'personality' ? null : 'personality')}
          title="Open Personality & Sliders Studio"
          id="open-personality-btn"
        >
          <Sliders size={18} />
        </button>
      </div>
    </header>
  );
}
