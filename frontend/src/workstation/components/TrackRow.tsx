import React, { useState } from 'react';
import { Track } from '../models/types';

interface TrackRowProps {
  track: Track;
  onToggleMute: (trackId: number) => void;
  onToggleSolo: (trackId: number) => void;
  onDelete: (trackId: number) => void;
}

const TrackRow: React.FC<TrackRowProps> = ({ track, onToggleMute, onToggleSolo, onDelete }) => {
  const [showVolumeDropdown, setShowVolumeDropdown] = useState(false);

  const trackIcon = track.type === 'audio' ? '🎤' : track.type === 'drums' ? '🥁' : '🎹';

  return (
    <div style={styles.trackRow}>
      <div style={styles.trackControls}>
        <button
          onClick={() => onToggleMute(track.id)}
          style={{
            ...styles.muteButton,
            ...(track.muted ? styles.muteButtonActive : {}),
          }}
        >
          M
        </button>
        <button
          onClick={() => onToggleSolo(track.id)}
          style={{
            ...styles.soloButton,
            ...(track.solo ? styles.soloButtonActive : {}),
          }}
        >
          S
        </button>
      </div>

      <div style={styles.trackInfo}>
        <div style={styles.trackHeader}>
          <span style={{ ...styles.trackIcon, backgroundColor: track.color }}>
            {trackIcon}
          </span>
          <span style={styles.trackName}>{track.name}</span>
          <button onClick={() => onDelete(track.id)} style={styles.trackMenuButton}>
            ···
          </button>
        </div>

        <div style={styles.trackVolumeRow}>
          <div style={styles.volumeDropdown}>
            <button
              onClick={() => setShowVolumeDropdown(!showVolumeDropdown)}
              style={styles.volumeDropdownButton}
            >
              Volume ▼
            </button>
            {showVolumeDropdown && (
              <div style={styles.volumeDropdownMenu}>
                <div
                  style={styles.volumeDropdownItem}
                  onClick={() => setShowVolumeDropdown(false)}
                >
                  Volume
                </div>
                <div
                  style={styles.volumeDropdownItem}
                  onClick={() => setShowVolumeDropdown(false)}
                >
                  Pan
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  trackRow: {
    display: 'flex',
    padding: '12px',
    borderBottom: '1px solid #2a2a4e',
    minHeight: '80px',
  },
  trackControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginRight: '12px',
  },
  muteButton: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#3a3a5e',
    color: '#888',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  muteButtonActive: {
    backgroundColor: '#e74c3c',
    color: '#ffffff',
  },
  soloButton: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#3a3a5e',
    color: '#888',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  soloButtonActive: {
    backgroundColor: '#f1c40f',
    color: '#000000',
  },
  trackInfo: {
    flex: 1,
  },
  trackHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  trackIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
  },
  trackName: {
    flex: 1,
    fontSize: '14px',
    fontWeight: 500,
  },
  trackMenuButton: {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px',
  },
  trackVolumeRow: {
    display: 'flex',
    alignItems: 'center',
  },
  volumeDropdown: {
    position: 'relative' as const,
  },
  volumeDropdownButton: {
    background: '#252542',
    border: '1px solid #3a3a5e',
    color: '#ffffff',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left' as const,
    fontFamily: "'Poppins', sans-serif",
  },
  volumeDropdownMenu: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    backgroundColor: '#ffffff',
    border: '1px solid #ddd',
    borderRadius: '4px',
    zIndex: 100,
    minWidth: '100px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  },
  volumeDropdownItem: {
    padding: '8px 12px',
    fontSize: '12px',
    color: '#333',
    cursor: 'pointer',
  },
};

export default TrackRow;