import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { InstrumentPreset } from '../models/types';
import useDawStore from '../state/dawStore';
import { rebuildTrackSynth } from '../engine/TransportSync';

interface TrackRowProps {
  trackId: number;
  automationOpen?: boolean;
  onToggleAutomation?: () => void;
}

const INSTRUMENT_LABELS: Record<InstrumentPreset, string> = {
  triangle: 'Triangle', sawtooth: 'Sawtooth', square: 'Square', sine: 'Sine',
  fm: 'FM Synth', am: 'AM Synth', fat: 'Fat Saw', membrane: 'Membrane',
  metal: 'Metal', pluck: 'Pluck',
};

const TRACK_COLORS = [
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
  '#3498db', '#9b59b6', '#e91e63', '#795548', '#607d8b',
];

const TrackRow: React.FC<TrackRowProps> = ({ trackId, automationOpen, onToggleAutomation }) => {
  const track = useDawStore((s) => s.tracks.find((t) => t.id === trackId));
  const toggleMute = useDawStore((s) => s.toggleMute);
  const toggleSolo = useDawStore((s) => s.toggleSolo);
  const deleteTrack = useDawStore((s) => s.deleteTrack);
  const renameTrack = useDawStore((s) => s.renameTrack);
  const duplicateTrack = useDawStore((s) => s.duplicateTrack);
  const setTrackColor = useDawStore((s) => s.setTrackColor);
  const setTrackInstrument = useDawStore((s) => s.setTrackInstrument);

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  if (!track) return null;

  const trackIcon = track.type === 'audio' ? '🎤' : track.type === 'drums' ? '🥁' : '🎹';

  const handleInstrumentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newInstrument = e.target.value as InstrumentPreset;
    setTrackInstrument(track.id, newInstrument);
    rebuildTrackSynth({ ...track, instrument: newInstrument });
    e.target.blur();
  };

  // ─── Menu actions ───

  const handleRename = () => {
    setMenuOpen(false);
    setRenameValue(track.name);
    setIsRenaming(true);
    setTimeout(() => renameRef.current?.select(), 0);
  };

  const commitRename = () => {
    setIsRenaming(false);
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== track.name) {
      renameTrack(track.id, trimmed);
    }
  };

  const handleDuplicate = () => {
    setMenuOpen(false);
    duplicateTrack(track.id);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    deleteTrack(track.id);
  };

  const handleColorSelect = (color: string) => {
    setTrackColor(track.id, color);
    setShowColorPicker(false);
    setMenuOpen(false);
  };

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setMenuOpen(false);
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <div style={styles.trackRow}>
      <div style={styles.trackControls}>
        <button
          onClick={() => toggleMute(track.id)}
          style={{
            ...styles.muteButton,
            ...(track.muted ? styles.muteButtonActive : {}),
          }}
        >M</button>
        <button
          onClick={() => toggleSolo(track.id)}
          style={{
            ...styles.soloButton,
            ...(track.solo ? styles.soloButtonActive : {}),
          }}
        >S</button>
        {onToggleAutomation && (
          <button
            onClick={onToggleAutomation}
            style={{
              ...styles.autoButton,
              ...(automationOpen ? styles.autoButtonActive : {}),
            }}
            title="Volume automation"
          >A</button>
        )}
      </div>

      <div style={styles.trackInfo}>
        <div style={styles.trackHeader}>
          <span style={{ ...styles.trackIcon, backgroundColor: track.color }}>
            {trackIcon}
          </span>

          {isRenaming ? (
            <input
              ref={renameRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setIsRenaming(false);
              }}
              style={styles.renameInput}
              autoFocus
            />
          ) : (
            <span style={styles.trackName}>{track.name}</span>
          )}

          {/* ··· menu button */}
          <div style={{ position: 'relative' }}>
            <button
              ref={buttonRef}
              onClick={() => {
                if (!menuOpen && buttonRef.current) {
                  const rect = buttonRef.current.getBoundingClientRect();
                  setMenuPos({ top: rect.bottom + 4, left: rect.right - 160 });
                }
                setMenuOpen(!menuOpen);
                setShowColorPicker(false);
              }}
              style={styles.trackMenuButton}
            >
              ···
            </button>

            {menuOpen && createPortal(
              <div ref={menuRef} style={{ ...styles.menu, top: menuPos.top, left: menuPos.left }}>
                <button onClick={handleRename} style={styles.menuItem}>
                  ✏️ Rename
                </button>
                <button onClick={handleDuplicate} style={styles.menuItem}>
                  📋 Duplicate
                </button>
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  style={styles.menuItem}
                >
                  🎨 Color
                </button>
                {showColorPicker && (
                  <div style={styles.colorGrid}>
                    {TRACK_COLORS.map((c) => (
                      <div
                        key={c}
                        onClick={(e) => { e.stopPropagation(); handleColorSelect(c); }}
                        style={{
                          ...styles.colorSwatch,
                          backgroundColor: c,
                          outline: c === track.color ? '2px solid #fff' : 'none',
                        }}
                      />
                    ))}
                  </div>
                )}
                <div style={styles.menuDivider} />
                <button onClick={handleDelete} style={{ ...styles.menuItem, color: '#e74c3c' }}>
                  🗑️ Delete
                </button>
              </div>,
              document.body
            )}
          </div>
        </div>

        {track.type !== 'audio' && (
          <div style={styles.instrumentRow}>
            <select
              value={track.instrument}
              onChange={handleInstrumentChange}
              style={styles.instrumentSelect}
            >
              {Object.entries(INSTRUMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  trackRow: {
    display: 'flex',
    padding: '8px 12px',
    borderBottom: '1px solid #2a2a4e',
    height: '80px',
    boxSizing: 'border-box',
  },
  trackControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginRight: '12px',
  },
  muteButton: {
    width: '24px', height: '24px', borderRadius: '4px', border: 'none',
    backgroundColor: '#3a3a5e', color: '#888', fontSize: '12px',
    fontWeight: 600, cursor: 'pointer',
  },
  muteButtonActive: { backgroundColor: '#e74c3c', color: '#ffffff' },
  soloButton: {
    width: '24px', height: '24px', borderRadius: '4px', border: 'none',
    backgroundColor: '#3a3a5e', color: '#888', fontSize: '12px',
    fontWeight: 600, cursor: 'pointer',
  },
  soloButtonActive: { backgroundColor: '#f1c40f', color: '#000000' },
  autoButton: {
    width: '24px', height: '24px', borderRadius: '4px', border: 'none',
    backgroundColor: '#3a3a5e', color: '#888', fontSize: '12px',
    fontWeight: 600, cursor: 'pointer',
  },
  autoButtonActive: { backgroundColor: '#00d4ff', color: '#000000' },
  trackInfo: {
    flex: 1, display: 'flex', flexDirection: 'column',
    justifyContent: 'center', gap: '4px', minWidth: 0,
  },
  trackHeader: {
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  trackIcon: {
    width: '24px', height: '24px', borderRadius: '4px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '12px', flexShrink: 0,
  },
  trackName: {
    fontSize: '13px', fontWeight: 600, color: '#ffffff',
    flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  renameInput: {
    flex: 1, fontSize: '13px', fontWeight: 600, color: '#ffffff',
    backgroundColor: '#1a1a2e', border: '1px solid #00d4ff',
    borderRadius: '3px', padding: '2px 6px', outline: 'none',
    fontFamily: "'Poppins', sans-serif",
  },
  trackMenuButton: {
    background: 'none', border: 'none', color: '#888',
    cursor: 'pointer', fontSize: '16px', padding: '2px 6px',
    borderRadius: '4px', lineHeight: 1,
    fontFamily: "'Poppins', sans-serif",
  },
  menu: {
    position: 'fixed',
    backgroundColor: '#252542',
    border: '1px solid #3a3a5e',
    borderRadius: '8px',
    padding: '4px 0',
    zIndex: 10000,
    minWidth: '160px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '8px 14px',
    border: 'none',
    background: 'none',
    color: '#ffffff',
    fontSize: '12px',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    textAlign: 'left',
    transition: 'background 0.1s',
  },
  menuDivider: {
    height: '1px',
    backgroundColor: '#3a3a5e',
    margin: '4px 0',
  },
  colorGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    padding: '6px 14px',
  },
  colorSwatch: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'transform 0.1s',
  },
  instrumentRow: {
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  instrumentSelect: {
    background: '#1a1a2e', border: '1px solid #3a3a5e', color: '#ffffff',
    padding: '2px 6px', borderRadius: '4px', fontSize: '11px',
    fontFamily: "'Poppins', sans-serif", cursor: 'pointer',
  },
};

export default TrackRow;