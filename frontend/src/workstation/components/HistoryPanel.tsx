import React, { useEffect, useRef, useState } from 'react';
import useDawStore from '../state/dawStore';

// Icon map for action labels
const ACTION_ICONS: Record<string, string> = {
  'Add Track': '➕',
  'Delete Track': '🗑️',
  'Rename Track': '✏️',
  'Reorder Track': '↕️',
  'Duplicate Track': '📋',
  'Change Color': '🎨',
  'Change Instrument': '🎹',
  'Toggle Mute': '🔇',
  'Toggle Solo': '🎧',
  'Set Volume': '🔊',
  'Set Pan': '↔️',
  'Add Clip': '🎬',
  'Delete Clip': '✂️',
  'Move Clip': '↔️',
  'Resize Clip': '↔️',
  'Add Note': '🎵',
  'Add Notes': '🎵',
  'Delete Notes': '🗑️',
  'Move Notes': '↔️',
  'Resize Notes': '↔️',
  'Paste Notes': '📋',
  'Record Notes': '⏺',
  'Set BPM': '⏱️',
  'Change Effects': '🎛️',
  'Quantize Notes': '🔧',
  'Add Audio Clip': '🎤',
  'Paste Clip': '📋',
  'Automation': '📈',
  'Initial State': '📄',
};

const getIcon = (label: string): string => {
  for (const [key, icon] of Object.entries(ACTION_ICONS)) {
    if (label.includes(key) || label.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return '•';
};

const HistoryPanel: React.FC = () => {
  const showHistoryPanel = useDawStore((s) => s.showHistoryPanel);
  const toggleHistoryPanel = useDawStore((s) => s.toggleHistoryPanel);
  const getHistoryList = useDawStore((s) => s.getHistoryList);
  const jumpToHistory = useDawStore((s) => s.jumpToHistory);
  const undoVersion = useDawStore((s) => s.undoVersion);

  const listRef = useRef<HTMLDivElement>(null);

  // Track mounted state for unmount animation
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (showHistoryPanel) {
      setMounted(true);
      // Trigger animation on next frame so the initial transform applies first
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      // Wait for transition to finish before unmounting
      const timer = setTimeout(() => setMounted(false), 250);
      return () => clearTimeout(timer);
    }
  }, [showHistoryPanel]);

  // Re-derive on every undo version change
  const { labels, currentIndex } = getHistoryList();

  // Auto-scroll to current entry
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [undoVersion]);

  if (!mounted) return null;

  return (
    <div style={{
      ...styles.panel,
      transform: visible ? 'translateX(0)' : 'translateX(100%)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
    }}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>History</span>
        <span style={styles.headerCount}>{labels.length}</span>
        <button onClick={toggleHistoryPanel} style={styles.closeBtn}>✕</button>
      </div>

      {/* Scrollable list */}
      <div ref={listRef} style={styles.list}>
        {labels.map((label, i) => {
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;

          return (
            <div
              key={i}
              data-active={isCurrent ? 'true' : undefined}
              onClick={() => jumpToHistory(i)}
              style={{
                ...styles.entry,
                ...(isCurrent ? styles.entryCurrent : {}),
                ...(isFuture ? styles.entryFuture : {}),
              }}
              onMouseEnter={(e) => {
                if (!isCurrent) {
                  e.currentTarget.style.background = isFuture
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(0,212,255,0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrent) {
                  e.currentTarget.style.background = isFuture
                    ? 'transparent'
                    : 'transparent';
                }
              }}
            >
              <span style={styles.entryIcon}>{getIcon(label)}</span>
              <span style={{
                ...styles.entryLabel,
                ...(isFuture ? { opacity: 0.35 } : {}),
                ...(isCurrent ? { color: '#00d4ff', fontWeight: 600 } : {}),
              }}>
                {label}
              </span>
              {isCurrent && <span style={styles.currentDot} />}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        Click to jump to any state
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'fixed',
    right: 0,
    top: 0,
    bottom: 0,
    width: 240,
    background: '#16162a',
    borderLeft: '1px solid #2a2a4a',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 90,
    fontFamily: "'Poppins', sans-serif",
    boxShadow: '-4px 0 12px rgba(0,0,0,0.3)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    borderBottom: '1px solid #2a2a4a',
    background: '#1a1a32',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#e0e0e0',
    flex: 1,
  },
  headerCount: {
    fontSize: '10px',
    color: '#888',
    background: '#2a2a4a',
    borderRadius: '8px',
    padding: '1px 7px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '2px 4px',
    lineHeight: 1,
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  entry: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    cursor: 'pointer',
    transition: 'background 0.1s',
    position: 'relative' as const,
    borderLeft: '3px solid transparent',
  },
  entryCurrent: {
    background: 'rgba(0,212,255,0.12)',
    borderLeft: '3px solid #00d4ff',
  },
  entryFuture: {
    opacity: 0.5,
  },
  entryIcon: {
    fontSize: '12px',
    width: 18,
    textAlign: 'center' as const,
    flexShrink: 0,
  },
  entryLabel: {
    fontSize: '11px',
    color: '#c0c0d0',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
  },
  currentDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#00d4ff',
    flexShrink: 0,
    boxShadow: '0 0 6px #00d4ff',
  },
  footer: {
    padding: '6px 12px',
    fontSize: '9px',
    color: '#555',
    borderTop: '1px solid #2a2a4a',
    textAlign: 'center' as const,
    flexShrink: 0,
  },
};

export default HistoryPanel;