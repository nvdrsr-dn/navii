import React, { useRef, useEffect } from 'react';
import { Send, Volume2, Sparkles, Brain, Heart } from 'lucide-react';
import { soundEngine } from '../utils/audio.js';

const QUICK_SCENARIOS = [
  { label: 'hey', query: 'hey', hint: 'Short greeting matching' },
  { label: 'good morning', query: 'good morning', hint: 'Dynamic brief reply' },
  { label: 'weird day', query: 'yaar aaj kaafi weird day tha', hint: 'Emotional check-in' },
  { label: 'mood kharab', query: 'yaar mera mood kharab hai', hint: 'Soft empathy, no lectures' },
  { label: 'funny thing', query: 'aaj school mein ek funny thing hui', hint: 'Follow-up question' },
  { label: 'idea perfect hai', query: 'mujhe lagta hai ye idea perfect hai', hint: 'Independent mind' },
  { label: '5 minute mein aaya', query: 'main 5 minute mein aa raha hu', hint: 'Playful teasing' },
  { label: 'tum kya kar rhi ho?', query: 'tum kya kar rhi ho?', hint: 'Hinglish mirroring' },
  { label: 'kal wali baat', query: 'kal wali baat ka kya hua?', hint: 'Multi-turn reasoning' }
];

export default function ChatView({
  messages,
  inputText,
  setInputText,
  onSendMessage,
  isTyping,
  typingText,
  lastAudit
}) {
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleQuickScenario = (query) => {
    if (isTyping) return;
    onSendMessage(query);
  };

  return (
    <div className="main-chat-area" id="main-chat-area">
      {/* Messages Stream */}
      <div className="chat-stream-container" id="chat-stream-container">
        <div className="date-divider">
          <span>Conversation with Navii • Natural AI Companion</span>
        </div>

        {messages.map((msg) => {
          const isNavii = msg.sender === 'navii';
          return (
            <div key={msg.id} className={`message-row ${msg.sender}`} id={`message-${msg.id}`}>
              <div className="message-bubble-wrapper">
                <div className="message-bubble">
                  {msg.text}
                </div>

                <div className="message-meta">
                  <span>{msg.timestamp || 'just now'}</span>

                  {isNavii && msg.emotion && (
                    <span className="meta-chip emotion">
                      {msg.emotion}
                    </span>
                  )}

                  {isNavii && msg.memoriesUsed && msg.memoriesUsed.length > 0 && (
                    <span className="meta-chip memory" title="Used context memory">
                      <Brain size={10} /> memory linked
                    </span>
                  )}

                  {isNavii && (
                    <button
                      className="msg-action-btn"
                      onClick={() => soundEngine.speak(msg.text)}
                      title="Speak message aloud"
                    >
                      <Volume2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Simulated Typing Indicator */}
        {isTyping && (
          <div className="message-row navii" id="typing-indicator-row">
            <div className="message-bubble-wrapper">
              <div className="typing-indicator-wrapper">
                <div className="typing-dots">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
                <span className="typing-label">Navii is typing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Scenario Chips Bar */}
      <div className="scenarios-tray" id="scenarios-tray">
        <span className="scenarios-title">Test Cases:</span>
        {QUICK_SCENARIOS.map((sc, i) => (
          <button
            key={i}
            className="scenario-chip"
            onClick={() => handleQuickScenario(sc.query)}
            disabled={isTyping}
            title={sc.hint}
            id={`test-case-${i}`}
          >
            "{sc.label}"
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="input-container" id="input-container">
        <form className="input-form" onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Navii in English, Hindi, or Hinglish..."
            className="chat-input"
            id="chat-user-input"
            disabled={isTyping}
          />
          <button
            type="submit"
            className="send-btn"
            disabled={!inputText.trim() || isTyping}
            title="Send message"
            id="chat-send-btn"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
