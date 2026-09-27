import React, { useState, useEffect } from 'react';
import NaviiHeader from './components/NaviiHeader';
import ChatView from './components/ChatView';
import PersonalityStudio from './components/PersonalityStudio';
import CognitiveInspector from './components/CognitiveInspector';
import MemoryVault from './components/MemoryVault';
import InstagramManager from './components/InstagramManager';
import { soundEngine } from './utils/audio';

const INITIAL_MESSAGES = [
  {
    id: 'msg-init-1',
    sender: 'navii',
    text: "heyy! finally yahan aa gaye tum 😂",
    timestamp: 'just now',
    emotion: 'playful'
  }
];

export default function App() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('navii_chat_history');
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState(null); // 'personality' | 'inspector' | 'memory' | null
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [memories, setMemories] = useState([]);
  const [lastAudit, setLastAudit] = useState(null);
  const [lastEmotion, setLastEmotion] = useState('playful');

  const [settings, setSettings] = useState({
    affection: 80,
    playfulness: 75,
    teasing: 65,
    formality: 10,
    emojiUsage: 70,
    talkativeness: 45,
    emotionalExpressiveness: 85,
    relationshipPreset: 'companion'
  });

  // Sync sound engine
  useEffect(() => {
    soundEngine.enabled = soundEnabled;
  }, [soundEnabled]);

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('navii_chat_history', JSON.stringify(messages.slice(-50)));
    } catch {}
  }, [messages]);

  // Fetch initial settings & memories from backend
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data) setSettings(prev => ({ ...prev, ...data }));
      })
      .catch(() => {});

    fetch('/api/memories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMemories(data);
      })
      .catch(() => {});
  }, []);

  const handleUpdateSettings = async (newSettings) => {
    setSettings(newSettings);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
    } catch (e) {
      console.error('Failed to sync settings:', e);
    }
  };

  const handleSendMessage = async (text) => {
    if (!text.trim() || isTyping) return;

    soundEngine.playSendSound();

    const userMsg = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          conversationHistory: newHistory.slice(-8),
          customSettings: settings
        })
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const data = await response.json();

      // Simulated typing delay according to Section 14
      const typingWait = data.typingDelayMs || 500;

      setTimeout(() => {
        setIsTyping(false);
        soundEngine.playReceiveSound();

        const naviiMsg = {
          id: 'msg-' + Date.now(),
          sender: 'navii',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          emotion: data.pipelineAudit?.detectedEmotion?.emotion,
          memoriesUsed: data.pipelineAudit?.memoriesUsed
        };

        setMessages(prev => [...prev, naviiMsg]);
        setLastAudit(data.pipelineAudit);
        if (data.pipelineAudit?.detectedEmotion?.emotion) {
          setLastEmotion(data.pipelineAudit.detectedEmotion.emotion);
        }

        // Refresh memories in case new facts were extracted
        fetch('/api/memories')
          .then(res => res.json())
          .then(mems => { if (Array.isArray(mems)) setMemories(mems); })
          .catch(() => {});
      }, typingWait);
    } catch (error) {
      console.error('Chat error:', error);
      setIsTyping(false);
      const fallbackMsg = {
        id: 'msg-' + Date.now(),
        sender: 'navii',
        text: 'heyy, wait thoda network glitch hua... kya bol rahe the? 😭',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        emotion: 'confused'
      };
      setMessages(prev => [...prev, fallbackMsg]);
    }
  };

  const handleAddMemory = async (memoryPayload) => {
    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memoryPayload)
      });
      const newItem = await res.json();
      setMemories(prev => [newItem, ...prev]);
    } catch (e) {
      console.error('Add memory error:', e);
    }
  };

  const handleDeleteMemory = async (id) => {
    try {
      await fetch(`/api/memories/${id}`, { method: 'DELETE' });
      setMemories(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      console.error('Delete memory error:', e);
    }
  };

  const handleResetMemories = async () => {
    try {
      const res = await fetch('/api/memories/reset', { method: 'POST' });
      const data = await res.json();
      if (data.memories) setMemories(data.memories);
    } catch (e) {
      console.error('Reset memory error:', e);
    }
  };

  return (
    <div className="app-container" id="navii-app">
      <NaviiHeader
        activeDrawer={activeDrawer}
        setActiveDrawer={setActiveDrawer}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        lastEmotion={lastEmotion}
        isTyping={isTyping}
      />

      <ChatView
        messages={messages}
        inputText={inputText}
        setInputText={setInputText}
        onSendMessage={handleSendMessage}
        isTyping={isTyping}
        lastAudit={lastAudit}
      />

      {/* Drawers */}
      {activeDrawer === 'personality' && (
        <PersonalityStudio
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setActiveDrawer(null)}
        />
      )}

      {activeDrawer === 'inspector' && (
        <CognitiveInspector
          auditData={lastAudit}
          onClose={() => setActiveDrawer(null)}
        />
      )}

      {activeDrawer === 'memory' && (
        <MemoryVault
          memories={memories}
          onAddMemory={handleAddMemory}
          onDeleteMemory={handleDeleteMemory}
          onResetMemories={handleResetMemories}
          onClose={() => setActiveDrawer(null)}
        />
      )}

      {activeDrawer === 'instagram' && (
        <InstagramManager
          onClose={() => setActiveDrawer(null)}
        />
      )}
    </div>
  );
}
