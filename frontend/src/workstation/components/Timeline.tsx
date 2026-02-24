import React, { useRef, useCallback, useEffect, useState } from 'react';
import useDawStore from '../state/dawStore';
import { Clip } from '../models/types';
import { seek as seekTo } from '../engine/TransportSync';

const TOTAL_BARS = 32;
const RESIZE_HANDLE_WIDTH = 8;

type DragMode = 'move' | 'resize-left' | 'resize-right' | null;

interface DragState {
  mode: DragMode;
  clipId: number;
  sourceTrackId: number;
  startMouseX: number;
  startMouseY: number;
  originalStartBeat: number;
  originalDuration: number;
}

interface TimelineProps {
  mode: 'header' | 'track';
  trackId?: number;
}

const Timeline: React.FC<TimelineProps> = ({ mode, trackId }) => {
  const tracks = useDawStore((s) => s.tracks);
  const currentTime = useDawStore((s) => s.currentTime);
  const bpm = useDawStore((s) => s.bpm);
  const timeSignature = useDawStore((s) => s.timeSignature);
  const zoom = useDawStore((s) => s.zoom);
  const selectedClipId = useDawStore((s) => s.selectedClipId);
  const selectClip = useDawStore((s) => s.selectClip);
  const moveClip = useDawStore((s) => s.moveClip);
  const resizeClip = useDawStore((s) => s.resizeClip);
  const deleteClip = useDawStore((s) => s.deleteClip);
  const addClip = useDawStore((s) => s.addClip);
  const snapEnabled = useDawStore((s) => s.snapEnabled);
  const openPianoRoll = useDawStore((s) => s.openPianoRoll);
  const pianoRollClipId = useDawStore((s) => s.pianoRollClipId);

  const [dragState, setDragState] = useState<DragState | null>(null);

  const beatsPerBar = timeSignature.numerator;
  const pixelsPerBeat = 50 * zoom;
  const trackHeight = 80;
  const totalWidth = TOTAL_BARS * beatsPerBar * pixelsPerBeat;

  const playheadX = (currentTime / 60) * bpm * pixelsPerBeat;

  // ═══════════════════════════════════════════
  // HEADER MODE — bar numbers + playhead
  // ═══════════════════════════════════════════
  const loopEnabled = useDawStore((s) => s.loopEnabled);
  const loopStart = useDawStore((s) => s.loopStart);
  const loopEnd = useDawStore((s) => s.loopEnd);
  const setLoopRegion = useDawStore((s) => s.setLoopRegion);

  if (mode === 'header') {
    const handleHeaderMouseDown = (e: React.MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const startX = e.clientX - rect.left;
      const startBeat = startX / pixelsPerBeat;
      let didDrag = false;

      const handleMouseMove = (me: MouseEvent) => {
        const currentX = me.clientX - rect.left;
        const currentBeat = currentX / pixelsPerBeat;
        if (Math.abs(currentX - startX) > 5) {
          didDrag = true;
          setLoopRegion(
            Math.round(Math.min(startBeat, currentBeat)),
            Math.round(Math.max(startBeat, currentBeat))
          );
        }
      };

      const handleMouseUp = (me: MouseEvent) => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        if (!didDrag) {
          // Simple click — seek
          const x = me.clientX - rect.left;
          const beat = x / pixelsPerBeat;
          seekTo((beat / bpm) * 60);
        }
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    };

    const loopLeftPx = loopStart * pixelsPerBeat;
    const loopWidthPx = (loopEnd - loopStart) * pixelsPerBeat;

    return (
      <div
        style={{ width: `${totalWidth}px`, height: '100%', position: 'relative', cursor: 'pointer' }}
        onMouseDown={handleHeaderMouseDown}
      >
        {/* Loop region highlight */}
        {loopEnabled && loopEnd > loopStart && (
          <div style={{
            position: 'absolute',
            left: `${loopLeftPx}px`,
            width: `${loopWidthPx}px`,
            top: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,212,255,0.15)',
            borderLeft: '2px solid #00d4ff',
            borderRight: '2px solid #00d4ff',
            pointerEvents: 'none',
            zIndex: 5,
          }} />
        )}
        {/* Playhead */}
        <div style={{ ...styles.playhead, left: `${playheadX}px` }} />
        {/* Bar markers */}
        {Array.from({ length: TOTAL_BARS + 1 }).map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.barMarker,
              left: `${i * beatsPerBar * pixelsPerBeat}px`,
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // TRACK MODE — single track's clips
  // ═══════════════════════════════════════════

  const track = tracks.find((t) => t.id === trackId);
  if (!track) return null;

  const getCursorForPosition = (e: React.MouseEvent, clip: Clip): string => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const clipWidth = clip.duration * pixelsPerBeat;
    if (localX < RESIZE_HANDLE_WIDTH) return 'ew-resize';
    if (localX > clipWidth - RESIZE_HANDLE_WIDTH) return 'ew-resize';
    return 'grab';
  };

  const getDragMode = (e: React.MouseEvent, clip: Clip): DragMode => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const clipWidth = clip.duration * pixelsPerBeat;
    if (localX < RESIZE_HANDLE_WIDTH) return 'resize-left';
    if (localX > clipWidth - RESIZE_HANDLE_WIDTH) return 'resize-right';
    return 'move';
  };

  const handleClipMouseDown = (e: React.MouseEvent, clip: Clip) => {
    e.preventDefault();
    e.stopPropagation();
    selectClip(clip.id);
    setDragState({
      mode: getDragMode(e, clip),
      clipId: clip.id,
      sourceTrackId: track.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      originalStartBeat: clip.startBeat,
      originalDuration: clip.duration,
    });
  };

  const handleLaneClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectClip(null);
      // Seek playhead to click position
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const beat = x / pixelsPerBeat;
      const timeInSeconds = (beat / bpm) * 60;
      seekTo(timeInSeconds);
    }
  };

  const handleLaneDoubleClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      addClip(track.id, x / pixelsPerBeat);
    }
  };

  return (
    <div
      style={{
        width: `${totalWidth}px`,
        height: '100%',
        position: 'relative',
        opacity: track.muted ? 0.5 : 1,
      }}
      onClick={handleLaneClick}
      onDoubleClick={handleLaneDoubleClick}
    >
      {/* Playhead */}
      <div style={{ ...styles.playhead, left: `${playheadX}px` }} />

      {/* Clips */}
      {track.clips.map((clip) => {
        const isSelected = selectedClipId === clip.id;
        const isDragging = dragState?.clipId === clip.id;

        return (
          <div
            key={clip.id}
            onMouseDown={(e) => handleClipMouseDown(e, clip)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (track.type === 'instrument' || track.type === 'drums') {
                openPianoRoll(clip.id, track.id);
              }
            }}
            onMouseMove={(e) => {
              if (!dragState) {
                (e.currentTarget as HTMLElement).style.cursor = getCursorForPosition(e, clip);
              }
            }}
            style={{
              ...styles.clip,
              backgroundColor: track.color,
              left: `${clip.startBeat * pixelsPerBeat}px`,
              width: `${clip.duration * pixelsPerBeat}px`,
              outline: isSelected ? '2px solid #ffffff' : 'none',
              outlineOffset: isSelected ? '-1px' : '0',
              boxShadow: isSelected
                ? '0 0 12px rgba(255,255,255,0.3)'
                : isDragging
                ? '0 4px 16px rgba(0,0,0,0.4)'
                : 'none',
              opacity: isDragging ? 0.85 : 1,
              zIndex: isDragging ? 50 : isSelected ? 10 : 1,
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
          >
            <div style={styles.resizeHandleLeft} />
            <span style={styles.clipName}>{clip.name}</span>

            {/* Mini note preview */}
            {clip.notes.length > 0 && (() => {
              const pitches = clip.notes.map((n) => n.pitch);
              const minPitch = Math.min(...pitches) - 1;
              const maxPitch = Math.max(...pitches) + 1;
              const pitchRange = Math.max(maxPitch - minPitch, 1);
              return (
                <div style={styles.notePreviewContainer}>
                  {clip.notes.map((note) => (
                    <div
                      key={note.id}
                      style={{
                        position: 'absolute',
                        left: `${(note.startBeat / clip.duration) * 100}%`,
                        width: `${Math.max((note.duration / clip.duration) * 100, 0.5)}%`,
                        top: `${((maxPitch - note.pitch) / pitchRange) * 100}%`,
                        height: `${Math.max(100 / pitchRange, 2)}%`,
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        borderRadius: '1px',
                        minWidth: '2px',
                        minHeight: '2px',
                      }}
                    />
                  ))}
                </div>
              );
            })()}

            {clip.notes.length === 0 && (
              <div style={styles.emptyClipLabel}>
                {track.type === 'audio' ? '♪ Audio' : 'Empty'}
              </div>
            )}

            <div style={styles.resizeHandleRight} />
          </div>
        );
      })}

      {/* Global drag handler */}
      <TimelineDragHandler
        dragState={dragState}
        setDragState={setDragState}
        pixelsPerBeat={pixelsPerBeat}
        trackHeight={trackHeight}
        snapEnabled={snapEnabled}
        pianoRollClipId={pianoRollClipId}
      />
    </div>
  );
};

// Separate component for global drag + keyboard handlers to avoid hooks-in-conditional issues
const TimelineDragHandler: React.FC<{
  dragState: DragState | null;
  setDragState: (s: DragState | null) => void;
  pixelsPerBeat: number;
  trackHeight: number;
  snapEnabled: boolean;
  pianoRollClipId: number | null;
}> = ({ dragState, setDragState, pixelsPerBeat, trackHeight, snapEnabled, pianoRollClipId }) => {
  const tracks = useDawStore((s) => s.tracks);
  const moveClip = useDawStore((s) => s.moveClip);
  const resizeClip = useDawStore((s) => s.resizeClip);
  const deleteClip = useDawStore((s) => s.deleteClip);
  const selectedClipId = useDawStore((s) => s.selectedClipId);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState) return;
      const deltaX = e.clientX - dragState.startMouseX;
      const deltaBeat = deltaX / pixelsPerBeat;

      if (dragState.mode === 'move') {
        let newStartBeat = dragState.originalStartBeat + deltaBeat;
        if (snapEnabled) newStartBeat = Math.round(newStartBeat);
        newStartBeat = Math.max(0, newStartBeat);

        // Find which track row we're hovering over
        const scrollContainer = document.querySelector('[data-scroll-container]');
        if (scrollContainer) {
          const rows = scrollContainer.querySelectorAll('[data-track-row]');
          for (let i = 0; i < rows.length; i++) {
            const rect = rows[i].getBoundingClientRect();
            if (e.clientY >= rect.top && e.clientY < rect.bottom) {
              const tid = Number(rows[i].getAttribute('data-track-row'));
              if (tid) moveClip(dragState.clipId, newStartBeat, tid);
              break;
            }
          }
        }
      } else if (dragState.mode === 'resize-right') {
        let newDuration = dragState.originalDuration + deltaBeat;
        if (snapEnabled) newDuration = Math.round(newDuration);
        resizeClip(dragState.clipId, Math.max(1, newDuration), false);
      } else if (dragState.mode === 'resize-left') {
        let newDuration = dragState.originalDuration - deltaBeat;
        if (snapEnabled) newDuration = Math.round(newDuration);
        resizeClip(dragState.clipId, Math.max(1, newDuration), true);
      }
    },
    [dragState, pixelsPerBeat, snapEnabled, tracks, moveClip, resizeClip]
  );

  const handleMouseUp = useCallback(() => {
    if (dragState) setDragState(null);
  }, [dragState, setDragState]);

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

  // Keyboard delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (pianoRollClipId !== null) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipId !== null) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        deleteClip(selectedClipId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, deleteClip, pianoRollClipId]);

  return null; // Render nothing, just manages effects
};

const styles: { [key: string]: React.CSSProperties } = {
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '2px',
    backgroundColor: '#00d4ff',
    zIndex: 20,
    pointerEvents: 'none',
  },
  barMarker: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '12px',
    color: '#888',
  },
  clip: {
    position: 'absolute',
    top: '8px',
    height: 'calc(100% - 16px)',
    borderRadius: '6px',
    overflow: 'hidden',
    transition: 'box-shadow 0.15s, outline 0.15s',
    userSelect: 'none',
  },
  resizeHandleLeft: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: `${RESIZE_HANDLE_WIDTH}px`,
    cursor: 'ew-resize',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRight: '1px solid rgba(255,255,255,0.1)',
    zIndex: 2,
  },
  resizeHandleRight: {
    position: 'absolute',
    right: 0, top: 0, bottom: 0,
    width: `${RESIZE_HANDLE_WIDTH}px`,
    cursor: 'ew-resize',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderLeft: '1px solid rgba(255,255,255,0.1)',
    zIndex: 2,
  },
  clipName: {
    position: 'absolute',
    top: '3px', left: '10px',
    fontSize: '10px', fontWeight: 600,
    color: 'rgba(255,255,255,0.9)',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    pointerEvents: 'none', zIndex: 3,
    letterSpacing: '0.2px',
  },
  notePreviewContainer: {
    position: 'absolute',
    top: '18px', bottom: '4px', left: '6px', right: '6px',
    pointerEvents: 'none', zIndex: 1,
  },
  emptyClipLabel: {
    position: 'absolute',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '10px',
    color: 'rgba(255,255,255,0.3)',
    pointerEvents: 'none',
  },
};

export default Timeline;