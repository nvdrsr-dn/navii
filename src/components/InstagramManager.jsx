import React, { useState, useEffect } from 'react';
import { X, Instagram, Copy, Check, Shield, Send, ToggleLeft, ToggleRight, Sparkles, RefreshCw, MessageCircle } from 'lucide-react';

export default function InstagramManager({ onClose }) {
  const [config, setConfig] = useState({
    appId: '1075823415053557',
    appSecretConfigured: true,
    verifyToken: 'navii_instagram_verify_token_2026',
    hasAccessToken: false,
    autoReplyEnabled: true,
    activeUserSessions: 0,
    totalEvents: 0
  });

  const [accessTokenInput, setAccessTokenInput] = useState('');
  const [copiedField, setCopiedField] = useState(null);
  const [simText, setSimText] = useState('hey');
  const [simSenderId, setSimSenderId] = useState('ig_user_rohit');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showSecret, setShowSecret] = useState(false);

  const webhookUrl = `${window.location.origin}/api/instagram/webhook`;

  const fetchStatus = () => {
    fetch('/api/instagram/status')
      .then(res => res.json())
      .then(data => { if (data) setConfig(data); })
      .catch(() => {});

    fetch('/api/instagram/logs')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setLogs(data); })
      .catch(() => {});
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveAccessToken = async (e) => {
    e.preventDefault();
    if (!accessTokenInput.trim()) return;
    try {
      const res = await fetch('/api/instagram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: accessTokenInput.trim() })
      });
      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
        setAccessTokenInput('');
      }
    } catch (e) {
      console.error('Failed to save access token:', e);
    }
  };

  const handleToggleAutoReply = async () => {
    try {
      const next = !config.autoReplyEnabled;
      const res = await fetch('/api/instagram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoReplyEnabled: next })
      });
      const data = await res.json();
      if (data.config) setConfig(data.config);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulateDM = async (e) => {
    e.preventDefault();
    if (!simText.trim() || simulating) return;
    setSimulating(true);
    setSimResult(null);

    try {
      const res = await fetch('/api/instagram/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: simSenderId, text: simText.trim() })
      });
      const data = await res.json();
      setSimResult(data.result);
      fetchStatus();
    } catch (e) {
      console.error('Simulation error:', e);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer-panel" onClick={(e) => e.stopPropagation()} style={{ width: 500 }} id="instagram-manager-drawer">
        <div className="drawer-header">
          <div className="drawer-title-row">
            <Instagram size={20} color="#e1306c" />
            <h2 className="drawer-title">Instagram AI Companion Integration</h2>
          </div>
          <button className="drawer-close" onClick={onClose} id="close-ig-btn">
            <X size={20} />
          </button>
        </div>

        <div className="drawer-content">
          {/* Header Card */}
          <div className="pipeline-stage-card" style={{ borderLeft: '4px solid #e1306c' }}>
            <div className="stage-header">
              <span className="stage-number">Connected Instagram Account</span>
              <span className="audit-badge success">
                <Check size={12} /> Live Connected
              </span>
            </div>
            <div className="stage-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>@{config.username || 'navisha.dn'}</span>
              <span className="navii-badge" style={{ textTransform: 'capitalize' }}>
                {config.accountType || 'Creator'}
              </span>
            </div>
            <div className="slider-hint">
              Account ID: <code>{config.accountId || '29088160597455965'}</code> • Auto-reply active for all incoming direct messages.
            </div>
          </div>

          {/* Credentials Summary */}
          <div className="sliders-stack">
            <label className="section-label">Your Meta App Credentials</label>

            {/* App ID */}
            <div className="slider-card">
              <div className="slider-top-row">
                <span className="slider-name">Instagram App ID</span>
                <button
                  className="msg-action-btn"
                  onClick={() => copyToClipboard(config.appId, 'appId')}
                  title="Copy App ID"
                >
                  {copiedField === 'appId' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                </button>
              </div>
              <div className="code-snippet-box">{config.appId}</div>
            </div>

            {/* App Secret */}
            <div className="slider-card">
              <div className="slider-top-row">
                <span className="slider-name">Instagram App Secret</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="msg-action-btn"
                    onClick={() => setShowSecret(!showSecret)}
                    style={{ fontSize: 11 }}
                  >
                    {showSecret ? 'Hide' : 'Reveal'}
                  </button>
                  <button
                    className="msg-action-btn"
                    onClick={() => copyToClipboard('7994e67eaf8641ca3f10d26b86d91da1', 'secret')}
                    title="Copy App Secret"
                  >
                    {copiedField === 'secret' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <div className="code-snippet-box">
                {showSecret ? '7994e67eaf8641ca3f10d26b86d91da1' : '••••••••••••••••••••••••••••••••'}
              </div>
            </div>

            {/* Webhook Callback URL */}
            <div className="slider-card">
              <div className="slider-top-row">
                <span className="slider-name">Webhook Callback URL (for Meta Portal)</span>
                <button
                  className="msg-action-btn"
                  onClick={() => copyToClipboard(webhookUrl, 'url')}
                  title="Copy Webhook URL"
                >
                  {copiedField === 'url' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                </button>
              </div>
              <div className="code-snippet-box">{webhookUrl}</div>
              <span className="slider-hint">
                In local development, forward via ngrok (e.g. <code>ngrok http 3001</code>) and paste the public HTTPS URL in Meta Developer Portal.
              </span>
            </div>

            {/* Webhook Verify Token */}
            <div className="slider-card">
              <div className="slider-top-row">
                <span className="slider-name">Webhook Verify Token</span>
                <button
                  className="msg-action-btn"
                  onClick={() => copyToClipboard(config.verifyToken, 'verifyToken')}
                  title="Copy Verify Token"
                >
                  {copiedField === 'verifyToken' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                </button>
              </div>
              <div className="code-snippet-box">{config.verifyToken}</div>
            </div>
          </div>

          {/* Access Token Form */}
          <form onSubmit={handleSaveAccessToken} className="preset-selector-group">
            <label className="section-label">Page / User Access Token</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="password"
                placeholder={config.hasAccessToken ? "Access Token is configured ✓ (Paste new to update)" : "Paste Meta Graph API Access Token..."}
                value={accessTokenInput}
                onChange={(e) => setAccessTokenInput(e.target.value)}
                className="chat-input"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: '8px 12px'
                }}
              />
              <button
                type="submit"
                className="icon-btn"
                style={{ width: 'auto', padding: '0 14px', borderRadius: 8 }}
                id="save-ig-token-btn"
              >
                Save
              </button>
            </div>
            <span className="slider-hint">
              Obtained from Meta App Dashboard ➔ Tools ➔ Graph API Explorer or Instagram Messaging settings.
            </span>
          </form>

          {/* Auto-reply toggle */}
          <div className="slider-card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="slider-name">Auto-Reply with Navii Engine</div>
              <div className="slider-hint">Automatically respond to incoming DMs on Instagram</div>
            </div>
            <button
              onClick={handleToggleAutoReply}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: config.autoReplyEnabled ? 'var(--accent-emerald)' : 'var(--text-muted)' }}
              id="toggle-ig-autoreply-btn"
            >
              {config.autoReplyEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>

          {/* Live DM Simulator */}
          <div className="pipeline-stage-card">
            <div className="stage-header">
              <span className="stage-number">Simulator</span>
              <Sparkles size={16} color="#ff5e98" />
            </div>
            <div className="stage-title">Simulate Incoming Instagram DM</div>
            <form onSubmit={handleSimulateDM} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Sender ID (e.g. ig_user_1)"
                  value={simSenderId}
                  onChange={(e) => setSimSenderId(e.target.value)}
                  className="chat-input"
                  style={{
                    width: '35%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontSize: 12
                  }}
                />
                <input
                  type="text"
                  placeholder="Type simulated DM (e.g. 'hey', 'mood off hai')..."
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  className="chat-input"
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontSize: 12
                  }}
                />
              </div>
              <button
                type="submit"
                className="icon-btn"
                disabled={simulating}
                style={{ width: '100%', height: 34, borderRadius: 8, gap: 6, fontSize: 12 }}
                id="run-ig-sim-btn"
              >
                <Send size={14} /> {simulating ? 'Processing DM through Navii Engine...' : 'Send Simulated Instagram DM'}
              </button>
            </form>

            {simResult && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="audit-badge info">
                  Sender: {simResult.senderId} | Simulated Typing Delay: {simResult.typingDelayMs}ms
                </div>
                <div className="code-snippet-box">
                  <strong>Navii Reply:</strong> {simResult.naviiReply}
                </div>
              </div>
            )}
          </div>

          {/* Activity Logs */}
          <div className="preset-selector-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="section-label">Instagram Event Logs ({logs.length})</label>
              <button className="msg-action-btn" onClick={fetchStatus} title="Refresh logs">
                <RefreshCw size={12} />
              </button>
            </div>
            {logs.length === 0 ? (
              <div className="empty-state" style={{ padding: 20 }}>No Instagram events recorded yet. Send a simulated DM above!</div>
            ) : (
              <div className="memory-list" style={{ maxHeight: 220, overflowY: 'auto' }}>
                {logs.slice(0, 10).map((l) => (
                  <div key={l.id} className="memory-item-card" style={{ padding: 10 }}>
                    <div className="mem-top-row">
                      <span className="mem-tag" style={{ background: l.type === 'INCOMING_DM' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 94, 152, 0.15)', color: l.type === 'INCOMING_DM' ? '#06b6d4' : '#ff5e98' }}>
                        {l.type}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(l.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                      {l.payload?.text || l.payload?.reply || JSON.stringify(l.payload)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
