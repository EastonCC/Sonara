import React, { useRef, useMemo } from 'react';
import { Track } from '../models/types';

interface TimelineProps {
  tracks: Track[];
  currentTime: number;
  bpm: number;
  timeSignature: { numerator: number; denominator: number };
  zoom: number;
}

const TOTAL_BARS = 32;

const Timeline: React.FC<TimelineProps> = ({ tracks, currentTime, bpm, timeSignature, zoom }) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const beatsPerBar = timeSignature.numerator;
  const pixelsPerBeat = 50 * zoom;

  // Memoize waveform heights so they don't randomize on every render
  const waveformData = useMemo(() => {
    const data: Record<number, number[]> = {};
    tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        const barCount = Math.floor(clip.duration * 4);
        data[clip.id] = Array.from({ length: barCount }, () => 20 + Math.random() * 60);
      });
    });
    return data;
  }, [tracks]);

  return (
    <div style={styles.timelineContainer} ref={timelineRef}>
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
      <div style={styles.timelineTracks}>
        {tracks.map((track) => (
          <div
            key={track.id}
            style={{
              ...styles.timelineTrack,
              opacity: track.muted ? 0.5 : 1,
            }}
          >
            {track.clips.map((clip) => (
              <div
                key={clip.id}
                style={{
                  ...styles.clip,
                  backgroundColor: track.color,
                  left: `${clip.startBeat * pixelsPerBeat}px`,
                  width: `${clip.duration * pixelsPerBeat}px`,
                }}
              >
                <span style={styles.clipName}>{clip.name}</span>
                <div style={styles.waveform}>
                  {(waveformData[clip.id] || []).map((height, i) => (
                    <div
                      key={i}
                      style={{
                        ...styles.waveformBar,
                        height: `${height}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
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
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  clipName: {
    position: 'absolute',
    top: '4px',
    left: '8px',
    fontSize: '11px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.9)',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  },
  waveform: {
    position: 'absolute',
    bottom: '8px',
    left: '8px',
    right: '8px',
    height: '40%',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '2px',
  },
  waveformBar: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '1px',
  },
};

export default Timeline;