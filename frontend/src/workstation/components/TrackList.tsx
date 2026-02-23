import React from 'react';
import useDawStore from '../state/dawStore';
import TrackRow from './TrackRow';

const TrackList: React.FC = () => {
  const tracks = useDawStore((s) => s.tracks);
  const addTrack = useDawStore((s) => s.addTrack);

  return (
    <div style={styles.trackList}>
      <div style={styles.addTrackRow}>
        <button onClick={addTrack} style={styles.addTrackButton}>
          + Add Track
        </button>
        <div style={styles.trackTools}>
          <button style={styles.toolButton}>○</button>
          <button style={styles.toolButton}>✎</button>
        </div>
      </div>

      {tracks.map((track) => (
        <TrackRow key={track.id} trackId={track.id} />
      ))}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  trackList: {
    width: '280px',
    backgroundColor: '#1e1e38',
    borderRight: '1px solid #3a3a5e',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  addTrackRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #3a3a5e',
  },
  addTrackButton: {
    background: 'none',
    border: 'none',
    color: '#00d4ff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
  },
  trackTools: {
    display: 'flex',
    gap: '8px',
  },
  toolButton: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: '1px solid #3a3a5e',
    backgroundColor: '#252542',
    color: '#888',
    cursor: 'pointer',
    fontSize: '12px',
  },
};

export default TrackList;