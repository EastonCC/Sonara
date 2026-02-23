import React, { useRef, useCallback, useEffect, useState } from 'react';
import useDawStore from '../state/dawStore';
import { MidiNote } from '../models/types';
import { previewNoteOn, previewNoteChange, previewNoteOff } from '../engine/TransportSync';

// Piano roll constants
const NOTE_HEIGHT = 14;
const PIXELS_PER_BEAT = 80;
const TOTAL_KEYS = 88; // A0 (21) to C8 (108)
const MIN_PITCH = 21;
const MAX_PITCH = 108;
const RESIZE_HANDLE_WIDTH = 6;
const HEADER_WIDTH = 48;

type DragMode = 'move' | 'resize' | null;

interface DragState {
  mode: DragMode;
  noteId: number;
  startMouseX: number;
  startMouseY: number;
  originalPitch: number;
  originalStartBeat: number;
  originalDuration: number;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const isBlackKey = (pitch: number): boolean => {
  const note = pitch % 12;
  return [1, 3, 6, 8, 10].includes(note);
};

const pitchToName = (pitch: number): string => {
  const octave = Math.floor(pitch / 12) - 1;
  const note = NOTE_NAMES[pitch % 12];
  return `${note}${octave}`;
};

// Convert pitch to Y position (higher pitch = higher on screen = lower Y)
const pitchToY = (pitch: number): number => {
  return (MAX_PITCH - pitch) * NOTE_HEIGHT;
};

// Convert Y position to pitch
const yToPitch = (y: number): number => {
  return MAX_PITCH - Math.floor(y / NOTE_HEIGHT);
};

const PianoRoll: React.FC = () => {
  const pianoRollClipId = useDawStore((s) => s.pianoRollClipId);
  const pianoRollTrackId = useDawStore((s) => s.pianoRollTrackId);
  const tracks = useDawStore((s) => s.tracks);
  const selectedNoteId = useDawStore((s) => s.selectedNoteId);
  const snapEnabled = useDawStore((s) => s.snapEnabled);
  const closePianoRoll = useDawStore((s) => s.closePianoRoll);
  const selectNote = useDawStore((s) => s.selectNote);
  const addNote = useDawStore((s) => s.addNote);
  const moveNote = useDawStore((s) => s.moveNote);
  const resizeNote = useDawStore((s) => s.resizeNote);
  const deleteNote = useDawStore((s) => s.deleteNote);

  const gridRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Find the clip and track
  const track = tracks.find((t) => t.id === pianoRollTrackId);
  const clip = track?.clips.find((c) => c.id === pianoRollClipId);

  if (!clip || !track) return null;

  const gridWidth = clip.duration * PIXELS_PER_BEAT;
  const gridHeight = TOTAL_KEYS * NOTE_HEIGHT;

  // Handle clicking empty grid to add a note
  const handleGridClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const beat = x / PIXELS_PER_BEAT;
    const pitch = yToPitch(y);

    if (pitch < MIN_PITCH || pitch > MAX_PITCH) return;

    const snappedBeat = snapEnabled ? Math.floor(beat * 4) / 4 : beat;

    addNote(clip.id, {
      pitch,
      startBeat: snappedBeat,
      duration: 1,
      velocity: 100,
    });

    // Preview the note we just added
    previewNoteOn(pitch, 100);
    setTimeout(() => previewNoteOff(), 200);
  };

  // Handle double-click on grid to add note (alternative)
  const handleGridDoubleClick = (e: React.MouseEvent) => {
    // Already handled by click
  };

  // Mouse down on a note
  const handleNoteMouseDown = (e: React.MouseEvent, note: MidiNote) => {
    e.preventDefault();
    e.stopPropagation();

    selectNote(note.id);

    // Preview the note's pitch
    previewNoteOn(note.pitch, note.velocity);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const noteWidth = note.duration * PIXELS_PER_BEAT;

    const mode: DragMode =
      localX > noteWidth - RESIZE_HANDLE_WIDTH ? 'resize' : 'move';

    setDragState({
      mode,
      noteId: note.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      originalPitch: note.pitch,
      originalStartBeat: note.startBeat,
      originalDuration: note.duration,
    });
  };

  // Drag handling
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState || !clip) return;

      const deltaX = e.clientX - dragState.startMouseX;
      const deltaY = e.clientY - dragState.startMouseY;

      if (dragState.mode === 'move') {
        const deltaBeat = deltaX / PIXELS_PER_BEAT;
        const deltaPitch = -Math.round(deltaY / NOTE_HEIGHT);

        let newStartBeat = dragState.originalStartBeat + deltaBeat;
        if (snapEnabled) newStartBeat = Math.round(newStartBeat * 4) / 4;
        newStartBeat = Math.max(0, Math.min(newStartBeat, clip.duration - dragState.originalDuration));

        const newPitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, dragState.originalPitch + deltaPitch));

        moveNote(clip.id, dragState.noteId, newPitch, newStartBeat);

        // Preview pitch change in real time
        previewNoteChange(newPitch);
      } else if (dragState.mode === 'resize') {
        const deltaBeat = deltaX / PIXELS_PER_BEAT;
        let newDuration = dragState.originalDuration + deltaBeat;
        if (snapEnabled) newDuration = Math.round(newDuration * 4) / 4;
        newDuration = Math.max(0.25, newDuration);

        resizeNote(clip.id, dragState.noteId, newDuration);
      }
    },
    [dragState, clip, snapEnabled, moveNote, resizeNote]
  );

  const handleMouseUp = useCallback(() => {
    setDragState(null);
    previewNoteOff();
  }, []);

  // Global mouse listeners for drag
  useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  // Keyboard: delete notes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNoteId !== null) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        deleteNote(clip.id, selectedNoteId);
      }
      if (e.key === 'Escape') {
        closePianoRoll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNoteId, clip?.id, deleteNote, closePianoRoll]);

  // Scroll to middle C area on mount
  useEffect(() => {
    if (gridRef.current) {
      const middleCY = pitchToY(60) - gridRef.current.clientHeight / 2;
      gridRef.current.scrollTop = middleCY;
    }
  }, [pianoRollClipId]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerTitle}>
            <span style={{ ...styles.headerDot, backgroundColor: track.color }} />
            {clip.name}
          </span>
          <span style={styles.headerInfo}>
            {clip.notes.length} notes · {clip.duration} beats
          </span>
        </div>
        <button onClick={closePianoRoll} style={styles.closeButton}>
          ✕
        </button>
      </div>

      {/* Piano Roll Grid */}
      <div style={styles.scrollContainer} ref={gridRef}>
        <div style={{ display: 'flex', height: `${gridHeight}px` }}>
          {/* Piano Keys */}
          <div style={styles.pianoKeys}>
            {Array.from({ length: TOTAL_KEYS }).map((_, i) => {
              const pitch = MAX_PITCH - i;
              const black = isBlackKey(pitch);
              const isC = pitch % 12 === 0;

              return (
                <div
                  key={pitch}
                  style={{
                    ...styles.pianoKey,
                    backgroundColor: black ? '#1a1a2e' : '#2a2a4e',
                    borderBottom: isC ? '2px solid #00d4ff' : '1px solid #1a1a2e',
                  }}
                >
                  {isC && (
                    <span style={styles.pianoKeyLabel}>{pitchToName(pitch)}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Note Grid */}
          <div
            style={{ ...styles.grid, width: `${gridWidth}px` }}
            onClick={handleGridClick}
          >
            {/* Grid rows */}
            {Array.from({ length: TOTAL_KEYS }).map((_, i) => {
              const pitch = MAX_PITCH - i;
              const black = isBlackKey(pitch);
              const isC = pitch % 12 === 0;

              return (
                <div
                  key={pitch}
                  style={{
                    ...styles.gridRow,
                    backgroundColor: black
                      ? 'rgba(0,0,0,0.2)'
                      : 'transparent',
                    borderBottom: isC
                      ? '1px solid rgba(0,212,255,0.3)'
                      : '1px solid rgba(255,255,255,0.04)',
                  }}
                />
              );
            })}

            {/* Beat lines */}
            {Array.from({ length: Math.ceil(clip.duration) + 1 }).map((_, i) => (
              <div
                key={`beat-${i}`}
                style={{
                  position: 'absolute',
                  left: `${i * PIXELS_PER_BEAT}px`,
                  top: 0,
                  bottom: 0,
                  width: '1px',
                  backgroundColor:
                    i % 4 === 0
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(255,255,255,0.06)',
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              />
            ))}

            {/* Sub-beat lines (16th notes) */}
            {Array.from({ length: Math.ceil(clip.duration * 4) }).map((_, i) => {
              if (i % 4 === 0) return null; // Already drawn as beat lines
              return (
                <div
                  key={`sub-${i}`}
                  style={{
                    position: 'absolute',
                    left: `${(i / 4) * PIXELS_PER_BEAT}px`,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />
              );
            })}

            {/* Notes */}
            {clip.notes.map((note) => {
              const isSelected = selectedNoteId === note.id;
              const isDragging = dragState?.noteId === note.id;
              const noteWidth = Math.max(note.duration * PIXELS_PER_BEAT, 4);

              return (
                <div
                  key={note.id}
                  onMouseDown={(e) => handleNoteMouseDown(e, note)}
                  onMouseMove={(e) => {
                    if (!dragState) {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const localX = e.clientX - rect.left;
                      (e.currentTarget as HTMLElement).style.cursor =
                        localX > noteWidth - RESIZE_HANDLE_WIDTH
                          ? 'ew-resize'
                          : 'grab';
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: `${note.startBeat * PIXELS_PER_BEAT}px`,
                    top: `${pitchToY(note.pitch)}px`,
                    width: `${noteWidth}px`,
                    height: `${NOTE_HEIGHT - 1}px`,
                    backgroundColor: track.color,
                    opacity: 0.6 + (note.velocity / 127) * 0.4,
                    borderRadius: '3px',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    outline: isSelected ? '2px solid #ffffff' : 'none',
                    outlineOffset: '-1px',
                    boxShadow: isSelected
                      ? '0 0 8px rgba(255,255,255,0.3)'
                      : 'none',
                    zIndex: isDragging ? 50 : isSelected ? 10 : 5,
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      fontSize: '9px',
                      color: 'rgba(255,255,255,0.8)',
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {noteWidth > 30 ? pitchToName(note.pitch) : ''}
                  </span>

                  {/* Resize handle */}
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: `${RESIZE_HANDLE_WIDTH}px`,
                      cursor: 'ew-resize',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: '280px',
    backgroundColor: '#1a1a2e',
    borderTop: '2px solid #3a3a5e',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#252542',
    borderBottom: '1px solid #3a3a5e',
    minHeight: '40px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
  },
  headerDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  headerInfo: {
    fontSize: '12px',
    color: '#888',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  scrollContainer: {
    flex: 1,
    overflow: 'auto',
    position: 'relative',
  },
  pianoKeys: {
    width: `${HEADER_WIDTH}px`,
    position: 'sticky',
    left: 0,
    zIndex: 10,
    flexShrink: 0,
  },
  pianoKey: {
    height: `${NOTE_HEIGHT}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: '6px',
    borderRight: '2px solid #3a3a5e',
  },
  pianoKeyLabel: {
    fontSize: '9px',
    color: '#00d4ff',
    fontWeight: 600,
  },
  grid: {
    position: 'relative',
    flexShrink: 0,
  },
  gridRow: {
    height: `${NOTE_HEIGHT}px`,
    width: '100%',
  },
};

export default PianoRoll;