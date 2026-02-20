import React from 'react';

interface TransportProps {
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;
  bpm: number;
  timeSignature: { numerator: number; denominator: number };
  musicalKey: string;
  onTogglePlay: () => void;
  onStop: () => void;
  onRewind: () => void;
  onToggleRecord: () => void;
  onBpmChange: (bpm: number) => void;
  onKeyChange: (key: string) => void;
}

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
};

const Transport: React.FC<TransportProps> = ({
  isPlaying,
  isRecording,
  currentTime,
  bpm,
  timeSignature,
  musicalKey,
  onTogglePlay,
  onStop,
  onRewind,
  onToggleRecord,
  onBpmChange,
  onKeyChange,
}) => {
  return (
    <div style={styles.transportBar}>
      <div style={styles.transportLeft}>
        <button style={styles.transportIcon}>↶</button>
        <button style={styles.transportIcon}>↷</button>
        <span style={styles.transportDivider}></span>
        <button style={styles.transportIcon}>🔁</button>
        <button style={styles.transportIcon}>⊞</button>
      </div>

      <div style={styles.transportCenter}>
        <button onClick={onRewind} style={styles.transportButton}>
          ⏮
        </button>
        <button
          onClick={onTogglePlay}
          style={{ ...styles.transportButton, ...styles.playButton }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={onStop} style={styles.transportButton}>
          ⏭
        </button>
        <button
          onClick={onToggleRecord}
          style={{
            ...styles.transportButton,
            ...styles.recordButton,
            ...(isRecording ? styles.recordButtonActive : {}),
          }}
        >
          ⏺
        </button>
        <span style={styles.timeDisplay}>{formatTime(currentTime)}</span>
      </div>

      <div style={styles.transportRight}>
        <div style={styles.controlGroup}>
          <span style={styles.controlLabel}>{musicalKey}</span>
          <select
            value={musicalKey}
            onChange={(e) => onKeyChange(e.target.value)}
            style={styles.controlSelect}
          >
            {KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div style={styles.controlGroup}>
          <input
            type="number"
            value={bpm}
            onChange={(e) => onBpmChange(Number(e.target.value))}
            style={styles.bpmInput}
            min={20}
            max={300}
          />
          <span style={styles.controlLabel}>bpm</span>
        </div>
        <div style={styles.controlGroup}>
          <span style={styles.controlLabel}>
            {timeSignature.numerator}/{timeSignature.denominator}
          </span>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  transportBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#252542',
    borderBottom: '1px solid #3a3a5e',
  },
  transportLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  transportCenter: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  transportRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  transportIcon: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px',
  },
  transportDivider: {
    width: '1px',
    height: '24px',
    backgroundColor: '#3a3a5e',
    margin: '0 8px',
  },
  transportButton: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    border: '2px solid #3a3a5e',
    backgroundColor: '#1a1a2e',
    color: '#ffffff',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  playButton: {
    backgroundColor: '#1a1a2e',
  },
  recordButton: {
    color: '#e74c3c',
  },
  recordButtonActive: {
    backgroundColor: '#e74c3c',
    color: '#ffffff',
    borderColor: '#e74c3c',
  },
  timeDisplay: {
    fontFamily: 'monospace',
    fontSize: '24px',
    fontWeight: 600,
    marginLeft: '16px',
    minWidth: '120px',
    color: '#ffffff',
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  controlLabel: {
    fontSize: '14px',
    color: '#888',
  },
  controlSelect: {
    background: '#1a1a2e',
    border: '1px solid #3a3a5e',
    color: '#ffffff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  bpmInput: {
    width: '60px',
    background: '#1a1a2e',
    border: '1px solid #3a3a5e',
    color: '#ffffff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '14px',
    textAlign: 'center' as const,
    fontFamily: "'Poppins', sans-serif",
  },
};

export default Transport;