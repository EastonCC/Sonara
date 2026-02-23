import React from 'react';
import { InstrumentPreset } from '../models/types';
import useDawStore from '../state/dawStore';
import { rebuildTrackSynth } from '../engine/TransportSync';

interface TrackRowProps {
  trackId: number;
}

const INSTRUMENT_LABELS: Record<InstrumentPreset, string> = {
  triangle: 'Triangle',
  sawtooth: 'Sawtooth',
  square: 'Square',
  sine: 'Sine',
  fm: 'FM Synth',
  am: 'AM Synth',
  fat: 'Fat Saw',
  membrane: 'Membrane',
  metal: 'Metal',
  pluck: 'Pluck',
};

const TrackRow: React.FC<TrackRowProps> = ({ trackId }) => {
  const track = useDawStore((s) => s.tracks.find((t) => t.id === trackId));
  const toggleMute = useDawStore((s) => s.toggleMute);
  const toggleSolo = useDawStore((s) => s.toggleSolo);
  const deleteTrack = useDawStore((s) => s.deleteTrack);
  const setTrackInstrument = useDawStore((s) => s.setTrackInstrument);

  if (!track) return null;

  const trackIcon = track.type === 'audio' ? '🎤' : track.type === 'drums' ? '🥁' : '🎹';

  const handleInstrumentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newInstrument = e.target.value as InstrumentPreset;
    setTrackInstrument(track.id, newInstrument);
    // Rebuild the synth in the audio engine with the new preset
    const updatedTrack = { ...track, instrument: newInstrument };
    rebuildTrackSynth(updatedTrack);
  };

  return (
    <div style={styles.trackRow}>
      <div style={styles.trackControls}>
        <button
          onClick={() => toggleMute(track.id)}
          style={{
            ...styles.muteButton,
            ...(track.muted ? styles.muteButtonActive : {}),
          }}
        >
          M
        </button>
        <button
          onClick={() => toggleSolo(track.id)}
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
          <button onClick={() => deleteTrack(track.id)} style={styles.trackMenuButton}>
            ···
          </button>
        </div>

        {/* Instrument selector for instrument/drum tracks */}
        {track.type !== 'audio' && (
          <div style={styles.instrumentRow}>
            <select
              value={track.instrument}
              onChange={handleInstrumentChange}
              style={styles.instrumentSelect}
            >
              {Object.entries(INSTRUMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
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
  instrumentRow: {
    display: 'flex',
    alignItems: 'center',
  },
  instrumentSelect: {
    background: '#252542',
    border: '1px solid #3a3a5e',
    color: '#ffffff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    width: '100%',
  },
};

export default TrackRow;