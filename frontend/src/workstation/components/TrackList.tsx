import React from 'react';
import { Track } from '../models/types';
import TrackRow from './TrackRow';

interface TrackListProps {
  tracks: Track[];
  onAddTrack: () => void;
  onToggleMute: (trackId: number) => void;
  onToggleSolo: (trackId: number) => void;
  onDeleteTrack: (trackId: number) => void;
}

const TrackList: React.FC<TrackListProps> = ({
  tracks,
  onAddTrack,
  onToggleMute,
  onToggleSolo,
  onDeleteTrack,
}) => {
  return (
    <div style={styles.trackList}>
      <div style={styles.addTrackRow}>
        <button onClick={onAddTrack} style={styles.addTrackButton}>
          + Add Track
        </button>
        <div style={styles.trackTools}>
          <button style={styles.toolButton}>○</button>
          <button style={styles.toolButton}>✎</button>
        </div>
      </div>

      {tracks.map((track) => (
        <TrackRow
          key={track.id}
          track={track}
          onToggleMute={onToggleMute}
          onToggleSolo={onToggleSolo}
          onDelete={onDeleteTrack}
        />
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