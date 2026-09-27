import React, { useState } from 'react';
import { X, Brain, Trash2, Plus, RotateCcw, Sparkles } from 'lucide-react';

export default function MemoryVault({
  memories,
  onAddMemory,
  onDeleteMemory,
  onResetMemories,
  onClose
}) {
  const [newDetail, setNewDetail] = useState('');
  const [newKey, setNewKey] = useState('habit');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newDetail.trim()) return;
    onAddMemory({
      detail: newDetail.trim(),
      category: 'user_defined',
      key: newKey,
      source: 'User manually added to memory'
    });
    setNewDetail('');
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer-panel" onClick={(e) => e.stopPropagation()} id="memory-vault-drawer">
        <div className="drawer-header">
          <div className="drawer-title-row">
            <Brain size={20} color="#ff5e98" />
            <h2 className="drawer-title">Conversational Memory Vault</h2>
          </div>
          <button className="drawer-close" onClick={onClose} id="close-memory-btn">
            <X size={20} />
          </button>
        </div>

        <div className="drawer-content">
          <div className="pipeline-stage-card" style={{ borderLeft: '4px solid var(--accent-pink)' }}>
            <div className="stage-title">Contextual Memory System</div>
            <div className="slider-hint">
              Navii recalls relevant memories naturally during conversations (e.g., asking "exam ki wajah se?" when you mention feeling exhausted), without robotic database announcements.
            </div>
          </div>

          {/* Add custom memory */}
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label className="section-label">Add Episodic Context</label>
            <input
              type="text"
              placeholder="e.g., Has an interview with Google on Monday"
              value={newDetail}
              onChange={(e) => setNewDetail(e.target.value)}
              className="chat-input"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '8px 12px'
              }}
              id="new-memory-input"
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  padding: '6px 10px',
                  fontSize: 12,
                  outline: 'none'
                }}
              >
                <option value="situation">Situation / Event</option>
                <option value="habit">Habit / Tendency</option>
                <option value="preference">Preference / Likes</option>
                <option value="relationship">People / Friends</option>
              </select>
              <button
                type="submit"
                className="icon-btn"
                style={{ width: 'auto', padding: '0 14px', borderRadius: 8, gap: 6 }}
                id="save-memory-btn"
              >
                <Plus size={14} /> Add Fact
              </button>
            </div>
          </form>

          {/* Active memories list */}
          <div className="memory-list">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="section-label">Stored Episodic Facts ({memories.length})</label>
              <button
                className="msg-action-btn"
                onClick={onResetMemories}
                title="Reset to default scenarios"
                style={{ fontSize: 11, gap: 4, display: 'flex', alignItems: 'center' }}
                id="reset-memories-btn"
              >
                <RotateCcw size={12} /> Reset Presets
              </button>
            </div>

            {memories.length === 0 ? (
              <div className="empty-state">No active memories. Add one above or chat with Navii to extract them!</div>
            ) : (
              memories.map((m) => (
                <div key={m.id} className="memory-item-card">
                  <div className="mem-top-row">
                    <span className="mem-tag">{m.key || m.category}</span>
                    <button
                      className="mem-del-btn"
                      onClick={() => onDeleteMemory(m.id)}
                      title="Forget this memory"
                      id={`delete-mem-${m.id}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="mem-detail">{m.detail}</div>
                  <div className="mem-source">{m.source || 'Conversation Context'}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
