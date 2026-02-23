import React, { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useDawStore from './state/dawStore';
import { initAudio, dispose } from './engine/TransportSync';
import MenuBar from './components/MenuBar';
import Transport from './components/Transport';
import TrackRow from './components/TrackRow';
import Timeline from './components/Timeline';
import PianoRoll from './components/PianoRoll';

const TRACK_LIST_WIDTH = 280;

const DAW = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const projectName = useDawStore((s) => s.projectName);
  const pianoRollClipId = useDawStore((s) => s.pianoRollClipId);
  const tracks = useDawStore((s) => s.tracks);
  const addTrack = useDawStore((s) => s.addTrack);

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
        {/* Wide inner container: trackList + timeline width */}
        <div style={styles.scrollContent}>

          {/* ═══ Header row ═══ */}
          <div style={styles.headerRow}>
            {/* Track list header — sticky left + sticky top */}
            <div style={styles.trackListHeader}>
              <button onClick={addTrack} style={styles.addTrackButton}>+ Add Track</button>
              <div style={styles.trackTools}>
                <button style={styles.toolButton}>○</button>
                <button style={styles.toolButton}>✎</button>
              </div>
            </div>
            {/* Timeline header (bar numbers) */}
            <div style={styles.timelineHeaderCell}>
              <Timeline mode="header" />
            </div>
          </div>

          {/* ═══ Track rows ═══ */}
          {tracks.map((track) => (
            <div key={track.id} style={styles.bodyRow} data-track-row={track.id}>
              {/* Track info — sticky left */}
              <div style={styles.trackListCell}>
                <TrackRow trackId={track.id} />
              </div>
              {/* Timeline lane */}
              <div style={styles.timelineCell}>
                <Timeline mode="track" trackId={track.id} />
              </div>
            </div>
          ))}
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
    height: '80px',
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
    height: '80px',
    position: 'relative',
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