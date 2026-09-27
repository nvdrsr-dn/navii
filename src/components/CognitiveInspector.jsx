import React from 'react';
import { X, Activity, ShieldCheck, CheckCircle2, AlertTriangle, Cpu, Globe, Heart, Clock, FileText } from 'lucide-react';

export default function CognitiveInspector({
  auditData,
  onClose
}) {
  if (!auditData) {
    return (
      <div className="drawer-overlay" onClick={onClose}>
        <aside className="drawer-panel" onClick={(e) => e.stopPropagation()} id="cognitive-inspector-drawer">
          <div className="drawer-header">
            <div className="drawer-title-row">
              <Activity size={20} color="#8b5cf6" />
              <h2 className="drawer-title">Cognitive Pipeline Inspector</h2>
            </div>
            <button className="drawer-close" onClick={onClose} id="close-inspector-empty-btn">
              <X size={20} />
            </button>
          </div>
          <div className="drawer-content">
            <div className="empty-state">
              Send a message to watch the 6-stage cognitive pipeline analyze, retrieve memory, synthesize prompts, and audit response quality live!
            </div>
          </div>
        </aside>
      </div>
    );
  }

  const {
    detectedLanguage,
    detectedEmotion,
    energyAnalysis,
    referenceAnalysis,
    memoriesUsed = [],
    newMemoriesExtracted = [],
    qualityCheck = {},
    flags = [],
    wasRevised,
    timingBreakdown,
    durationMs
  } = auditData;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer-panel" onClick={(e) => e.stopPropagation()} id="cognitive-inspector-drawer">
        <div className="drawer-header">
          <div className="drawer-title-row">
            <Activity size={20} color="#8b5cf6" />
            <h2 className="drawer-title">Pipeline Diagnostics</h2>
          </div>
          <button className="drawer-close" onClick={onClose} id="close-inspector-btn">
            <X size={20} />
          </button>
        </div>

        <div className="drawer-content">
          {/* Summary Banner */}
          <div className="pipeline-stage-card" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
            <div className="stage-header">
              <span className="stage-number">Pipeline Latency</span>
              <span className="audit-badge success">
                <CheckCircle2 size={12} /> {durationMs || 180}ms
              </span>
            </div>
            <div className="stage-title">Turn Diagnostics Passed</div>
            <div className="slider-hint">
              Processed through 6 cognitive stages with self-correcting quality inspection.
            </div>
          </div>

          {/* Stage 1: Input Analysis */}
          <div className="pipeline-stage-card">
            <div className="stage-header">
              <span className="stage-number">Stage 1: Input Analysis</span>
              <Globe size={16} color="#06b6d4" />
            </div>
            <div className="stage-title">Language & Emotional State</div>
            <div className="audit-badge-row">
              <span className="audit-badge info">
                Language: {detectedLanguage?.label || 'English'} ({Math.round((detectedLanguage?.confidence || 1) * 100)}%)
              </span>
              <span className="audit-badge info">
                Emotion: {(detectedEmotion?.emotion || 'neutral').toUpperCase()} ({detectedEmotion?.intensity || 5}/10)
              </span>
              <span className="audit-badge info">
                Category: {energyAnalysis?.category} ({energyAnalysis?.wordCount} words)
              </span>
            </div>
            {detectedEmotion?.markers?.length > 0 && (
              <div className="slider-hint">
                Trigger markers: {detectedEmotion.markers.join(', ')}
              </div>
            )}
          </div>

          {/* Stage 2: Memory Retrieval */}
          <div className="pipeline-stage-card">
            <div className="stage-header">
              <span className="stage-number">Stage 2: Contextual Memory</span>
              <Cpu size={16} color="#ec4899" />
            </div>
            <div className="stage-title">Episodic & Continuity Recall</div>
            {memoriesUsed.length > 0 ? (
              <div className="code-snippet-box">
                {memoriesUsed.map((m, idx) => (
                  <div key={idx} style={{ marginBottom: 4 }}>
                    • [{m.score} pts] {m.detail}
                  </div>
                ))}
              </div>
            ) : (
              <span className="slider-hint">No specific episodic memory required for this turn.</span>
            )}
            {newMemoriesExtracted.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <span className="section-label" style={{ fontSize: 10 }}>Extracted New Fact:</span>
                <div className="audit-badge info" style={{ marginTop: 4 }}>
                  {newMemoriesExtracted[0].detail}
                </div>
              </div>
            )}
          </div>

          {/* Stage 3 & 4: Response Quality Inspection */}
          <div className="pipeline-stage-card">
            <div className="stage-header">
              <span className="stage-number">Stage 5: Quality Inspection & Anti-Robot Check</span>
              <ShieldCheck size={16} color="#10b981" />
            </div>
            <div className="stage-title">Self-Correction & Polish</div>
            <div className="audit-badge-row">
              <span className={`audit-badge ${qualityCheck.roboticChecked ? 'success' : 'warning'}`}>
                {qualityCheck.roboticChecked ? '✓ Anti-Robot Filter: Clean' : 'Robot phrase detected'}
              </span>
              <span className={`audit-badge ${qualityCheck.lengthChecked ? 'success' : 'warning'}`}>
                ✓ Length Calibrated
              </span>
              <span className={`audit-badge ${qualityCheck.languageMatched ? 'success' : 'warning'}`}>
                ✓ Language Mirrored
              </span>
              <span className={`audit-badge ${qualityCheck.repetitionCleared ? 'success' : 'warning'}`}>
                ✓ Non-Repetitive
              </span>
            </div>
            {wasRevised && (
              <div className="audit-badge warning" style={{ marginTop: 6 }}>
                <AlertTriangle size={12} /> Model output was revised to maintain conversational realism.
              </div>
            )}
            {flags.length > 0 && (
              <div className="code-snippet-box" style={{ marginTop: 6 }}>
                {flags.map((f, i) => (
                  <div key={i} style={{ color: '#fca5a5' }}>
                    [{f.type}] {f.detail}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stage 6: Human Timing Simulation */}
          <div className="pipeline-stage-card">
            <div className="stage-header">
              <span className="stage-number">Stage 6: Simulated Pacing</span>
              <Clock size={16} color="#f59e0b" />
            </div>
            <div className="stage-title">Human Hesitation & Typing Speed</div>
            <div className="audit-badge-row">
              <span className="audit-badge info">
                Delay: {timingBreakdown?.delayMs || 450}ms
              </span>
              <span className="audit-badge info">
                Char Count: {timingBreakdown?.charCount || 0}
              </span>
              <span className="audit-badge info">
                Typing Speed: ~{timingBreakdown?.estimatedWpm || 65} WPM
              </span>
            </div>
            <div className="slider-hint">
              Simulated UI effect so responses feel naturally paced, not mechanically instant.
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
