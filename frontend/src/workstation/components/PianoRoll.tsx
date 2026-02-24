import React, { useRef, useCallback, useEffect, useState } from 'react';
import useDawStore from '../state/dawStore';
import { MidiNote } from '../models/types';
import { previewNoteOn, previewNoteChange, previewNoteOff } from '../engine/TransportSync';
import Keyboard from './Keyboard';
import EffectsPanel from './EffectsPanel';

const NOTE_HEIGHT = 14;
const PIXELS_PER_BEAT = 80;
const TOTAL_KEYS = 88;
const MIN_PITCH = 21;
const MAX_PITCH = 108;
const RESIZE_HANDLE_WIDTH = 6;
const HEADER_WIDTH = 48;
const DRAG_THRESHOLD = 5;

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const isBlackKey = (pitch: number): boolean => [1, 3, 6, 8, 10].includes(pitch % 12);

const pitchToName = (pitch: number): string => {
  return `${NOTE_NAMES[pitch % 12]}${Math.floor(pitch / 12) - 1}`;
};

const pitchToY = (pitch: number): number => (MAX_PITCH - pitch) * NOTE_HEIGHT;
const yToPitch = (y: number): number => MAX_PITCH - Math.floor(y / NOTE_HEIGHT);

// ─── Types ───

type InteractionMode = 'none' | 'marquee' | 'note-move' | 'note-resize';

interface InteractionState {
  mode: InteractionMode;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  noteId: number;
  originalPitch: number;
  originalStartBeat: number;
  originalDuration: number;
  lastDeltaPitch: number;
  lastDeltaBeat: number;
  dragging: boolean;
  undoVersionAtPush: number; // -1 means not yet pushed
}

const PianoRoll: React.FC = () => {
  const pianoRollClipId = useDawStore((s) => s.pianoRollClipId);
  const pianoRollTrackId = useDawStore((s) => s.pianoRollTrackId);
  const tracks = useDawStore((s) => s.tracks);
  const selectedNoteIds = useDawStore((s) => s.selectedNoteIds);
  const snapEnabled = useDawStore((s) => s.snapEnabled);
  const closePianoRoll = useDawStore((s) => s.closePianoRoll);
  const selectNote = useDawStore((s) => s.selectNote);
  const selectNotes = useDawStore((s) => s.selectNotes);
  const addNote = useDawStore((s) => s.addNote);
  const moveNote = useDawStore((s) => s.moveNote);
  const moveSelectedNotes = useDawStore((s) => s.moveSelectedNotes);
  const resizeNote = useDawStore((s) => s.resizeNote);
  const deleteSelectedNotes = useDawStore((s) => s.deleteSelectedNotes);
  const pushUndoSnapshot = useDawStore((s) => s.pushUndoSnapshot);

  const gridRef = useRef<HTMLDivElement>(null);
  const gridElRef = useRef<HTMLDivElement>(null);

  // Use ref for interaction state so global listeners always see latest
  const interaction = useRef<InteractionState | null>(null);
  // State just for triggering re-renders of marquee rect and hover highlights
  const [renderTick, setRenderTick] = useState(0);
  const [viewMode, setViewMode] = useState<'keyboard' | 'midi' | 'effects'>('keyboard');
  const forceRender = () => setRenderTick((t) => t + 1);

  const track = tracks.find((t) => t.id === pianoRollTrackId);
  const clip = track?.clips.find((c) => c.id === pianoRollClipId);

  if (!clip || !track) return null;

  const gridWidth = clip.duration * PIXELS_PER_BEAT;
  const gridHeight = TOTAL_KEYS * NOTE_HEIGHT;

  // ─── Helpers ───

  const hitTestNote = (x: number, y: number): MidiNote | null => {
    for (let i = clip.notes.length - 1; i >= 0; i--) {
      const note = clip.notes[i];
      const nL = note.startBeat * PIXELS_PER_BEAT;
      const nR = nL + note.duration * PIXELS_PER_BEAT;
      const nT = pitchToY(note.pitch);
      const nB = nT + NOTE_HEIGHT;
      if (x >= nL && x <= nR && y >= nT && y <= nB) return note;
    }
    return null;
  };

  const gridPos = (e: MouseEvent | React.MouseEvent): { x: number; y: number } => {
    const el = gridElRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // Notes currently under the marquee (for live highlighting)
  const getMarqueeHits = (): Set<number> => {
    const i = interaction.current;
    if (!i || i.mode !== 'marquee' || !i.dragging) return new Set();
    const left = Math.min(i.startX, i.currentX);
    const right = Math.max(i.startX, i.currentX);
    const top = Math.min(i.startY, i.currentY);
    const bottom = Math.max(i.startY, i.currentY);

    const hits = new Set<number>();
    for (const note of clip.notes) {
      const nL = note.startBeat * PIXELS_PER_BEAT;
      const nR = nL + note.duration * PIXELS_PER_BEAT;
      const nT = pitchToY(note.pitch);
      const nB = nT + NOTE_HEIGHT;
      if (nR > left && nL < right && nB > top && nT < bottom) {
        hits.add(note.id);
      }
    }
    return hits;
  };

  // ─── Grid mousedown ───

  const handleGridMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const { x, y } = gridPos(e);
    const hitNote = hitTestNote(x, y);

    if (hitNote) {
      // Clicked on a note
      e.preventDefault();
      e.stopPropagation();

      const shiftKey = e.shiftKey;
      if (shiftKey) {
        selectNote(hitNote.id, true);
      } else if (!selectedNoteIds.has(hitNote.id)) {
        selectNote(hitNote.id);
      }

      previewNoteOn(hitNote.pitch, hitNote.velocity);

      // Determine resize vs move
      const noteLeft = hitNote.startBeat * PIXELS_PER_BEAT;
      const noteRight = noteLeft + hitNote.duration * PIXELS_PER_BEAT;
      const isResize = x > noteRight - RESIZE_HANDLE_WIDTH;

      interaction.current = {
        mode: isResize ? 'note-resize' : 'note-move',
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
        noteId: hitNote.id,
        originalPitch: hitNote.pitch,
        originalStartBeat: hitNote.startBeat,
        originalDuration: hitNote.duration,
        lastDeltaPitch: 0,
        lastDeltaBeat: 0,
        dragging: false,
        undoVersionAtPush: -1,
      };
    } else {
      // Clicked empty space — start marquee
      e.preventDefault();

      interaction.current = {
        mode: 'marquee',
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
        noteId: 0,
        originalPitch: 0,
        originalStartBeat: 0,
        originalDuration: 0,
        lastDeltaPitch: 0,
        lastDeltaBeat: 0,
        dragging: false,
      };
    }

    // Attach global listeners
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
  };

  // ─── Global mousemove ───

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    const i = interaction.current;
    if (!i) return;

    const clipData = useDawStore.getState().tracks
      .find((t) => t.id === pianoRollTrackId)
      ?.clips.find((c) => c.id === pianoRollClipId);
    if (!clipData) return;

    if (i.mode === 'marquee') {
      const { x, y } = gridPos(e);
      i.currentX = x;
      i.currentY = y;
      const dist = Math.sqrt(Math.pow(x - i.startX, 2) + Math.pow(y - i.startY, 2));
      if (dist > DRAG_THRESHOLD) i.dragging = true;
      forceRender();
      return;
    }

    const deltaX = e.clientX - i.startX;
    const deltaY = e.clientY - i.startY;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (dist > DRAG_THRESHOLD) i.dragging = true;
    if (!i.dragging) return;

    // Push undo snapshot once when drag actually starts, or again if undo happened mid-drag
    const currentVersion = useDawStore.getState().undoVersion;
    if (i.undoVersionAtPush !== currentVersion) {
      pushUndoSnapshot(i.mode === 'note-resize' ? 'Resize Note' : 'Move Note');
      i.undoVersionAtPush = useDawStore.getState().undoVersion;
    }

    if (i.mode === 'note-move') {
      const { selectedNoteIds: selected } = useDawStore.getState();

      if (selected.size > 1 && selected.has(i.noteId)) {
        // Multi-note move: apply delta
        const deltaBeatRaw = deltaX / PIXELS_PER_BEAT;
        const deltaPitchRaw = -deltaY / NOTE_HEIGHT;
        const deltaBeat = snapEnabled ? Math.round(deltaBeatRaw * 4) / 4 : deltaBeatRaw;
        const deltaPitch = Math.round(deltaPitchRaw);

        // Only apply the diff from last frame
        const beatDiff = deltaBeat - i.lastDeltaBeat;
        const pitchDiff = deltaPitch - i.lastDeltaPitch;

        if (beatDiff !== 0 || pitchDiff !== 0) {
          useDawStore.getState().moveSelectedNotes(clipData.id, pitchDiff, beatDiff);
          i.lastDeltaPitch = deltaPitch;
          i.lastDeltaBeat = deltaBeat;
          previewNoteChange(i.originalPitch + deltaPitch);
        }
      } else {
        // Single note move
        const deltaBeat = deltaX / PIXELS_PER_BEAT;
        const deltaPitch = -Math.round(deltaY / NOTE_HEIGHT);

        let newStartBeat = i.originalStartBeat + deltaBeat;
        if (snapEnabled) newStartBeat = Math.round(newStartBeat * 4) / 4;
        newStartBeat = Math.max(0, Math.min(newStartBeat, clipData.duration - i.originalDuration));

        const newPitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, i.originalPitch + deltaPitch));

        useDawStore.getState().moveNote(clipData.id, i.noteId, newPitch, newStartBeat);
        previewNoteChange(newPitch);
      }
    } else if (i.mode === 'note-resize') {
      const deltaBeat = deltaX / PIXELS_PER_BEAT;
      let newDuration = i.originalDuration + deltaBeat;
      if (snapEnabled) newDuration = Math.round(newDuration * 4) / 4;
      newDuration = Math.max(0.25, newDuration);

      useDawStore.getState().resizeNote(
        clipData.id,
        i.noteId,
        newDuration
      );
    }
  }, [pianoRollClipId, pianoRollTrackId, snapEnabled]);

  // ─── Global mouseup ───

  const handleGlobalMouseUp = useCallback((e: MouseEvent) => {
    const i = interaction.current;
    window.removeEventListener('mousemove', handleGlobalMouseMove);
    window.removeEventListener('mouseup', handleGlobalMouseUp);

    if (!i) return;

    const clipData = useDawStore.getState().tracks
      .find((t) => t.id === pianoRollTrackId)
      ?.clips.find((c) => c.id === pianoRollClipId);

    if (i.mode === 'marquee') {
      if (i.dragging && clipData) {
        // Finalize marquee selection
        const left = Math.min(i.startX, i.currentX);
        const right = Math.max(i.startX, i.currentX);
        const top = Math.min(i.startY, i.currentY);
        const bottom = Math.max(i.startY, i.currentY);

        const selected = clipData.notes.filter((note) => {
          const nL = note.startBeat * PIXELS_PER_BEAT;
          const nR = nL + note.duration * PIXELS_PER_BEAT;
          const nT = pitchToY(note.pitch);
          const nB = nT + NOTE_HEIGHT;
          return nR > left && nL < right && nB > top && nT < bottom;
        });

        useDawStore.getState().selectNotes(selected.map((n) => n.id));
      } else if (clipData) {
        // Was a click, not a drag — place a note
        const beat = i.startX / PIXELS_PER_BEAT;
        const pitch = yToPitch(i.startY);

        if (pitch >= MIN_PITCH && pitch <= MAX_PITCH) {
          const snappedBeat = snapEnabled ? Math.floor(beat * 4) / 4 : beat;
          useDawStore.getState().addNote(clipData.id, {
            pitch,
            startBeat: snappedBeat,
            duration: 1,
            velocity: 100,
          });

          previewNoteOn(pitch, 100);
          setTimeout(() => previewNoteOff(), 200);
        }
      }
    } else if (i.mode === 'note-move' || i.mode === 'note-resize') {
      previewNoteOff();

      // If it was just a click (no drag), and it's a single click on a note, select just that one
      if (!i.dragging) {
        useDawStore.getState().selectNote(i.noteId);
      }
    }

    interaction.current = null;
    forceRender();
  }, [pianoRollClipId, pianoRollTrackId, snapEnabled, handleGlobalMouseMove]);

  // ─── Keyboard ───

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNoteIds.size > 0) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        if (clip) deleteSelectedNotes(clip.id);
      }
      if (e.key === 'Escape') {
        closePianoRoll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNoteIds, clip?.id, deleteSelectedNotes, closePianoRoll]);

  // Scroll to middle C on mount
  useEffect(() => {
    if (gridRef.current) {
      const middleCY = pitchToY(60) - gridRef.current.clientHeight / 2;
      gridRef.current.scrollTop = middleCY;
    }
  }, [pianoRollClipId]);

  // Clean up listeners on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  // ─── Compute render data ───

  const i = interaction.current;
  const marqueeRect =
    i && i.mode === 'marquee' && i.dragging
      ? {
          left: Math.min(i.startX, i.currentX),
          top: Math.min(i.startY, i.currentY),
          width: Math.abs(i.currentX - i.startX),
          height: Math.abs(i.currentY - i.startY),
        }
      : null;

  const marqueeHits = getMarqueeHits();

  // ─── Render ───

  return (
    <div style={styles.container}>
      {/* Header with tabs */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerTitle}>
            <span style={{ ...styles.headerDot, backgroundColor: track.color }} />
            {clip.name}
          </span>
          {/* Tab buttons */}
          <div style={styles.tabGroup}>
            <button
              onClick={() => setViewMode('keyboard')}
              style={{
                ...styles.tab,
                ...(viewMode === 'keyboard' ? styles.tabActive : {}),
              }}
            >
              🎹 Keyboard
            </button>
            <button
              onClick={() => setViewMode('midi')}
              style={{
                ...styles.tab,
                ...(viewMode === 'midi' ? styles.tabActive : {}),
              }}
            >
              🎼 MIDI Editor
            </button>
            <button
              onClick={() => setViewMode('effects')}
              style={{
                ...styles.tab,
                ...(viewMode === 'effects' ? styles.tabActive : {}),
              }}
            >
              🎛️ Effects
            </button>
          </div>
          <span style={styles.headerInfo}>
            {clip.notes.length} notes · {clip.duration} beats
            {selectedNoteIds.size > 0 && ` · ${selectedNoteIds.size} selected`}
          </span>
        </div>
        <button onClick={closePianoRoll} style={styles.closeButton}>
          ✕
        </button>
      </div>

      {/* ─── Keyboard View ─── */}
      {viewMode === 'keyboard' && (
        <Keyboard clipId={clip.id} trackId={track.id} />
      )}

      {/* ─── Effects View ─── */}
      {viewMode === 'effects' && (
        <EffectsPanel trackId={track.id} />
      )}

      {/* ─── MIDI Editor View ─── */}
      {viewMode === 'midi' && (
      <div style={styles.scrollContainer} ref={gridRef}>
        <div style={{ display: 'flex', height: `${gridHeight}px` }}>
          {/* Piano Keys */}
          <div style={styles.pianoKeys}>
            {Array.from({ length: TOTAL_KEYS }).map((_, idx) => {
              const pitch = MAX_PITCH - idx;
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
                  {isC && <span style={styles.pianoKeyLabel}>{pitchToName(pitch)}</span>}
                </div>
              );
            })}
          </div>

          {/* Note Grid */}
          <div
            ref={gridElRef}
            data-piano-grid
            style={{ ...styles.grid, width: `${gridWidth}px` }}
            onMouseDown={handleGridMouseDown}
          >
            {/* Grid rows */}
            {Array.from({ length: TOTAL_KEYS }).map((_, idx) => {
              const pitch = MAX_PITCH - idx;
              const black = isBlackKey(pitch);
              const isC = pitch % 12 === 0;
              return (
                <div
                  key={pitch}
                  style={{
                    ...styles.gridRow,
                    backgroundColor: black ? 'rgba(0,0,0,0.2)' : 'transparent',
                    borderBottom: isC
                      ? '1px solid rgba(0,212,255,0.3)'
                      : '1px solid rgba(255,255,255,0.04)',
                  }}
                />
              );
            })}

            {/* Beat lines */}
            {Array.from({ length: Math.ceil(clip.duration) + 1 }).map((_, idx) => (
              <div
                key={`b-${idx}`}
                style={{
                  position: 'absolute',
                  left: `${idx * PIXELS_PER_BEAT}px`,
                  top: 0,
                  bottom: 0,
                  width: '1px',
                  backgroundColor: idx % 4 === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                  pointerEvents: 'none',
                }}
              />
            ))}

            {/* Sub-beat lines */}
            {Array.from({ length: Math.ceil(clip.duration * 4) }).map((_, idx) => {
              if (idx % 4 === 0) return null;
              return (
                <div
                  key={`s-${idx}`}
                  style={{
                    position: 'absolute',
                    left: `${(idx / 4) * PIXELS_PER_BEAT}px`,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    pointerEvents: 'none',
                  }}
                />
              );
            })}

            {/* Notes */}
            {clip.notes.map((note) => {
              const isSelected = selectedNoteIds.has(note.id);
              const isHovered = marqueeHits.has(note.id);
              const highlighted = isSelected || isHovered;
              const isDragging = i?.noteId === note.id && i?.dragging;
              const noteWidth = Math.max(note.duration * PIXELS_PER_BEAT, 4);

              return (
                <div
                  key={note.id}
                  style={{
                    position: 'absolute',
                    left: `${note.startBeat * PIXELS_PER_BEAT}px`,
                    top: `${pitchToY(note.pitch)}px`,
                    width: `${noteWidth}px`,
                    height: `${NOTE_HEIGHT - 1}px`,
                    backgroundColor: highlighted
                      ? '#ffffff'
                      : track.color,
                    opacity: highlighted ? 1 : 0.6 + (note.velocity / 127) * 0.4,
                    borderRadius: '3px',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    outline: isSelected ? `2px solid ${track.color}` : 'none',
                    outlineOffset: '-1px',
                    boxShadow: highlighted ? '0 0 8px rgba(255,255,255,0.4)' : 'none',
                    zIndex: isDragging ? 50 : highlighted ? 10 : 5,
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '4px',
                    overflow: 'hidden',
                    transition: highlighted ? 'none' : 'background-color 0.1s',
                  }}
                >
                  <span
                    style={{
                      fontSize: '9px',
                      color: highlighted ? track.color : 'rgba(255,255,255,0.8)',
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                    }}
                  >
                    {noteWidth > 30 ? pitchToName(note.pitch) : ''}
                  </span>
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: `${RESIZE_HANDLE_WIDTH}px`,
                      cursor: 'ew-resize',
                      backgroundColor: 'rgba(0,0,0,0.1)',
                    }}
                  />
                </div>
              );
            })}

            {/* Marquee rect */}
            {marqueeRect && (
              <div
                style={{
                  position: 'absolute',
                  left: `${marqueeRect.left}px`,
                  top: `${marqueeRect.top}px`,
                  width: `${marqueeRect.width}px`,
                  height: `${marqueeRect.height}px`,
                  border: '1px solid rgba(0,212,255,0.8)',
                  backgroundColor: 'rgba(0,212,255,0.08)',
                  pointerEvents: 'none',
                  zIndex: 100,
                }}
              />
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: '360px',
    flexShrink: 0,
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
  headerInfo: { fontSize: '12px', color: '#888' },
  tabGroup: {
    display: 'flex',
    gap: '2px',
    backgroundColor: '#1a1a2e',
    borderRadius: '6px',
    padding: '2px',
  },
  tab: {
    padding: '4px 12px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#888',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    transition: 'all 0.15s',
  },
  tabActive: {
    backgroundColor: '#3a3a5e',
    color: '#ffffff',
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
  scrollContainer: { flex: 1, overflow: 'auto', position: 'relative' },
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
  pianoKeyLabel: { fontSize: '9px', color: '#00d4ff', fontWeight: 600 },
  grid: { position: 'relative', flexShrink: 0, cursor: 'crosshair' },
  gridRow: { height: `${NOTE_HEIGHT}px`, width: '100%' },
};

export default PianoRoll;