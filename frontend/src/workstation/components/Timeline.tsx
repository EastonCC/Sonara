import React, { useRef, useCallback, useEffect, useState } from 'react';
import useDawStore from '../state/dawStore';
import { Clip } from '../models/types';

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
  scrollRef?: React.RefObject<HTMLDivElement>;
  onScroll?: () => void;
}

const Timeline: React.FC<TimelineProps> = ({ scrollRef, onScroll }) => {
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

  const internalRef = useRef<HTMLDivElement>(null);
  const timelineRef = scrollRef || internalRef;
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoverTrackId, setHoverTrackId] = useState<number | null>(null);

  const beatsPerBar = timeSignature.numerator;
  const pixelsPerBeat = 50 * zoom;
  const trackHeight = 80;
  const clipPadding = 8; // top/bottom padding inside clip
  const clipContentHeight = trackHeight - 16 - clipPadding * 2; // minus top/bottom track padding minus clip padding

  // Determine cursor style based on mouse position over a clip
  const getCursorForPosition = (e: React.MouseEvent, clip: Clip): string => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const clipWidth = clip.duration * pixelsPerBeat;

    if (localX < RESIZE_HANDLE_WIDTH) return 'ew-resize';
    if (localX > clipWidth - RESIZE_HANDLE_WIDTH) return 'ew-resize';
    return 'grab';
  };

  // Determine drag mode based on click position
  const getDragMode = (e: React.MouseEvent, clip: Clip): DragMode => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const clipWidth = clip.duration * pixelsPerBeat;

    if (localX < RESIZE_HANDLE_WIDTH) return 'resize-left';
    if (localX > clipWidth - RESIZE_HANDLE_WIDTH) return 'resize-right';
    return 'move';
  };

  // Start drag on mousedown
  const handleClipMouseDown = (
    e: React.MouseEvent,
    clip: Clip,
    trackId: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    selectClip(clip.id);

    const mode = getDragMode(e, clip);
    setDragState({
      mode,
      clipId: clip.id,
      sourceTrackId: trackId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      originalStartBeat: clip.startBeat,
      originalDuration: clip.duration,
    });
  };

  // Handle drag movement
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState) return;

      const deltaX = e.clientX - dragState.startMouseX;
      const deltaBeat = deltaX / pixelsPerBeat;

      if (dragState.mode === 'move') {
        let newStartBeat = dragState.originalStartBeat + deltaBeat;
        if (snapEnabled) newStartBeat = Math.round(newStartBeat);
        newStartBeat = Math.max(0, newStartBeat);

        // Determine which track we're hovering over
        const timelineEl = timelineRef.current;
        if (timelineEl) {
          const tracksContainer = timelineEl.querySelector('[data-tracks]');
          if (tracksContainer) {
            const rect = tracksContainer.getBoundingClientRect();
            const relativeY = e.clientY - rect.top;
            const trackIndex = Math.floor(relativeY / trackHeight);
            const clampedIndex = Math.max(0, Math.min(trackIndex, tracks.length - 1));
            const targetTrack = tracks[clampedIndex];

            if (targetTrack) {
              setHoverTrackId(targetTrack.id);
              moveClip(dragState.clipId, newStartBeat, targetTrack.id);
            }
          }
        }
      } else if (dragState.mode === 'resize-right') {
        let newDuration = dragState.originalDuration + deltaBeat;
        if (snapEnabled) newDuration = Math.round(newDuration);
        newDuration = Math.max(1, newDuration);
        resizeClip(dragState.clipId, newDuration, false);
      } else if (dragState.mode === 'resize-left') {
        let newDuration = dragState.originalDuration - deltaBeat;
        if (snapEnabled) newDuration = Math.round(newDuration);
        newDuration = Math.max(1, newDuration);
        resizeClip(dragState.clipId, newDuration, true);
      }
    },
    [dragState, pixelsPerBeat, snapEnabled, tracks, moveClip, resizeClip]
  );

  // End drag on mouseup
  const handleMouseUp = useCallback(() => {
    if (dragState) {
      setDragState(null);
      setHoverTrackId(null);
    }
  }, [dragState]);

  // Click empty area to deselect
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectClip(null);
    }
  };

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

  // Keyboard: delete/backspace to remove selected clip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't delete clips when piano roll is open — let it handle its own keys
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

  return (
    <div style={styles.timelineContainer} ref={timelineRef as any} onScroll={onScroll}>
      {/* Timeline Header */}
      <div style={styles.timelineHeader}>
        <div
          style={{
            ...styles.playhead,
            left: `${(currentTime / 60) * bpm * pixelsPerBeat}px`,
          }}
        />
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

      {/* Track Lanes */}
      <div style={styles.timelineTracks} data-tracks onClick={handleTimelineClick}>
        {tracks.map((track) => (
          <div
            key={track.id}
            style={{
              ...styles.timelineTrack,
              opacity: track.muted ? 0.5 : 1,
            }}
            onClick={handleTimelineClick}
            onDoubleClick={(e) => {
              // Only trigger if clicking empty space, not on a clip
              if (e.target === e.currentTarget) {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const x = e.clientX - rect.left;
                const startBeat = x / pixelsPerBeat;
                addClip(track.id, startBeat);
              }
            }}
          >
            {track.clips.map((clip) => {
              const isSelected = selectedClipId === clip.id;
              const isDragging = dragState?.clipId === clip.id;

              return (
                <div
                  key={clip.id}
                  onMouseDown={(e) => handleClipMouseDown(e, clip, track.id)}
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
                  {/* Left resize handle */}
                  <div style={styles.resizeHandleLeft} />

                  {/* Clip content */}
                  <span style={styles.clipName}>{clip.name}</span>

                  {/* Mini note preview */}
                  {clip.notes.length > 0 && (() => {
                    // Calculate pitch range for this clip to scale notes vertically
                    const pitches = clip.notes.map((n) => n.pitch);
                    const minPitch = Math.min(...pitches) - 1;
                    const maxPitch = Math.max(...pitches) + 1;
                    const pitchRange = Math.max(maxPitch - minPitch, 1);

                    return (
                      <div style={styles.notePreviewContainer}>
                        {clip.notes.map((note) => {
                          const leftPct = (note.startBeat / clip.duration) * 100;
                          const widthPct = (note.duration / clip.duration) * 100;
                          const topPct = ((maxPitch - note.pitch) / pitchRange) * 100;

                          return (
                            <div
                              key={note.id}
                              style={{
                                position: 'absolute',
                                left: `${leftPct}%`,
                                width: `${Math.max(widthPct, 0.5)}%`,
                                top: `${topPct}%`,
                                height: `${Math.max(100 / pitchRange, 2)}%`,
                                backgroundColor: 'rgba(255,255,255,0.7)',
                                borderRadius: '1px',
                                minWidth: '2px',
                                minHeight: '2px',
                              }}
                            />
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Empty clip placeholder */}
                  {clip.notes.length === 0 && (
                    <div style={styles.emptyClipLabel}>
                      {track.type === 'audio' ? '♪ Audio' : 'Empty'}
                    </div>
                  )}

                  {/* Right resize handle */}
                  <div style={styles.resizeHandleRight} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  timelineContainer: {
    flex: 1,
    overflow: 'auto',
    position: 'relative',
  },
  timelineHeader: {
    height: '32px',
    backgroundColor: '#252542',
    borderBottom: '1px solid #3a3a5e',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    minWidth: '2000px',
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '2px',
    backgroundColor: '#00d4ff',
    zIndex: 20,
  },
  barMarker: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '12px',
    color: '#888',
  },
  timelineTracks: {
    minWidth: '2000px',
  },
  timelineTrack: {
    height: '80px',
    borderBottom: '1px solid #2a2a4e',
    position: 'relative',
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
    left: 0,
    top: 0,
    bottom: 0,
    width: `${RESIZE_HANDLE_WIDTH}px`,
    cursor: 'ew-resize',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRight: '1px solid rgba(255,255,255,0.1)',
    zIndex: 2,
  },
  resizeHandleRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: `${RESIZE_HANDLE_WIDTH}px`,
    cursor: 'ew-resize',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderLeft: '1px solid rgba(255,255,255,0.1)',
    zIndex: 2,
  },
  clipName: {
    position: 'absolute',
    top: '3px',
    left: '10px',
    fontSize: '10px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.9)',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    pointerEvents: 'none',
    zIndex: 3,
    letterSpacing: '0.2px',
  },
  notePreviewContainer: {
    position: 'absolute',
    top: '18px',
    bottom: '4px',
    left: '6px',
    right: '6px',
    pointerEvents: 'none',
    zIndex: 1,
  },
  emptyClipLabel: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '10px',
    color: 'rgba(255,255,255,0.3)',
    pointerEvents: 'none',
  },
};

export default Timeline;