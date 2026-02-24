import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useDawStore from './state/dawStore';
import { initAudio, dispose, play as enginePlay, pause as enginePause } from './engine/TransportSync';
import MenuBar from './components/MenuBar';
import Transport from './components/Transport';
import TrackRow from './components/TrackRow';
import Timeline from './components/Timeline';
import PianoRoll from './components/PianoRoll';

const TRACK_LIST_WIDTH = 280;
const AUTOMATION_LANE_HEIGHT = 60;

const DAW = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const projectName = useDawStore((s) => s.projectName);
  const pianoRollClipId = useDawStore((s) => s.pianoRollClipId);
  const tracks = useDawStore((s) => s.tracks);
  const addTrack = useDawStore((s) => s.addTrack);

  const [automationOpen, setAutomationOpen] = useState<Set<number>>(new Set());

  const toggleAutomation = (trackId: number) => {
    setAutomationOpen((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  };

  useEffect(() => {
    document.title = `${projectName} | Sonara DAW`;
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) navigate('/login');
  }, [navigate, projectName]);

  useEffect(() => { return () => dispose(); }, []);

  const handleUserGesture = async () => {
    await initAudio();
    document.removeEventListener('click', handleUserGesture);
  };

  useEffect(() => {
    document.addEventListener('click', handleUserGesture);
    return () => document.removeEventListener('click', handleUserGesture);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture shortcuts when typing in an input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const state = useDawStore.getState();

      // Play/Pause
      if (e.key === ' ') {
        e.preventDefault();
        if (state.isPlaying) {
          enginePause();
        } else {
          initAudio().then(() => enginePlay());
        }
        state.togglePlay();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        state.undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        state.redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        if (state.pianoRollClipId && state.selectedNoteIds.size > 0) {
          state.copyNotes();
        } else {
          state.copyClip();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        if (state.pianoRollClipId) {
          state.pasteNotes();
        } else {
          state.pasteClip();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        state.duplicateClip();
      }
      // Zoom
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        state.setZoom(Math.min(4, state.zoom + 0.25));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        state.setZoom(Math.max(0.25, state.zoom - 0.25));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        state.setZoom(1);
      }
      // Snap toggle
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
        state.toggleSnap();
      }
      // Save (placeholder)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
      }
      // Delete: notes if selected in piano roll, otherwise selected clip
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.pianoRollClipId && state.selectedNoteIds.size > 0) {
          // PianoRoll handler will handle this
          return;
        }
        if (state.selectedClipId) {
          e.preventDefault();
          state.deleteClip(state.selectedClipId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div style={styles.container}>
      <MenuBar />
      <Transport />

      {/*
        Single scroll container for everything.
        - Scrolls both X (timeline) and Y (tracks).
        - Track list column is position:sticky left:0, so it stays
          pinned to the left while horizontal scroll moves the timeline.
        - Because there's only ONE scrollable div, vertical alignment
          between track list and timeline is guaranteed.
      */}
      <div style={styles.scrollContainer} data-scroll-container>
        <div style={styles.scrollContent}>

          {/* ═══ Header row ═══ */}
          <div style={styles.headerRow}>
            <div style={styles.trackListHeader}>
              <button onClick={() => addTrack('instrument')} style={styles.addTrackButton}>+ Instrument</button>
              <button onClick={() => addTrack('audio')} style={styles.addTrackButton}>+ Audio</button>
            </div>
            <div style={styles.timelineHeaderCell}>
              <Timeline mode="header" />
            </div>
          </div>

          {/* ═══ Track rows ═══ */}
          {(() => {
            const hasSolo = tracks.some((t) => t.solo);
            return tracks.map((track) => {
              const isGrayed = hasSolo && !track.solo;
              return (
              <React.Fragment key={track.id}>
                <div style={{
                  ...styles.bodyRow,
                  height: automationOpen.has(track.id) ? `${80 + 60}px` : '80px',
                  opacity: isGrayed ? 0.35 : 1,
                  transition: 'opacity 0.2s',
                }} data-track-row={track.id}>
                  <div style={{
                    ...styles.trackListCell,
                    height: automationOpen.has(track.id) ? `${80 + 60}px` : '80px',
                  }}>
                    <div style={{ height: '80px' }}>
                      <TrackRow
                        trackId={track.id}
                        automationOpen={automationOpen.has(track.id)}
                        onToggleAutomation={() => toggleAutomation(track.id)}
                      />
                    </div>
                    {automationOpen.has(track.id) && (
                      <div style={styles.automationLabel}>
                        <span style={styles.automationLabelText}>Vol</span>
                      </div>
                    )}
                  </div>
                  <div style={styles.timelineCell}>
                    <Timeline
                      mode="track"
                      trackId={track.id}
                      showAutomation={automationOpen.has(track.id)}
                    />
                  </div>
                </div>
              </React.Fragment>
              );
            });
          })()}
        </div>
      </div>

      {pianoRollClipId && <PianoRoll />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #1a1a2e; }
        ::-webkit-scrollbar-thumb { background: #3a3a5e; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #4a4a7e; }
      `}</style>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: '100vh',
    width: '100%',
    backgroundColor: '#1a1a2e',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Poppins', sans-serif",
    color: '#ffffff',
    overflow: 'hidden',
  },
  scrollContainer: {
    flex: 1,
    overflow: 'auto',
    minHeight: 0,
    position: 'relative',
  },
  scrollContent: {
    display: 'inline-block',
    minWidth: '100%',
  },
  /* ─── Rows ─── */
  headerRow: {
    display: 'flex',
    height: '32px',
    position: 'sticky',
    top: 0,
    zIndex: 30,
  },
  bodyRow: {
    display: 'flex',
    borderBottom: '1px solid #2a2a4e',
  },
  /* ─── Track list cells (sticky left) ─── */
  trackListHeader: {
    width: `${TRACK_LIST_WIDTH}px`,
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 16px',
    backgroundColor: '#252542',
    borderBottom: '1px solid #3a3a5e',
    borderRight: '1px solid #3a3a5e',
    position: 'sticky',
    left: 0,
    zIndex: 20,
  },
  trackListCell: {
    width: `${TRACK_LIST_WIDTH}px`,
    flexShrink: 0,
    backgroundColor: '#1e1e38',
    borderRight: '1px solid #3a3a5e',
    position: 'sticky',
    left: 0,
    zIndex: 10,
  },
  /* ─── Timeline cells ─── */
  timelineHeaderCell: {
    height: '32px',
    backgroundColor: '#252542',
    borderBottom: '1px solid #3a3a5e',
    position: 'relative',
  },
  timelineCell: {
    position: 'relative',
  },
  /* ─── Automation label ─── */
  automationLabel: {
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '42px',
    borderTop: '1px solid #252542',
    backgroundColor: '#151528',
  },
  automationLabelText: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#00d4ff',
    opacity: 0.6,
  },
  /* ─── Buttons ─── */
  addTrackButton: {
    background: 'none',
    border: 'none',
    color: '#00d4ff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
  },
  trackTools: { display: 'flex', gap: '8px' },
  toolButton: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#3a3a5e',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default DAW;