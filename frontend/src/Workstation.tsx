import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface Track {
  id: number;
  name: string;
  type: 'audio' | 'instrument' | 'drums';
  color: string;
  muted: boolean;
  solo: boolean;
  volume: number;
  pan: number;
  clips: Clip[];
}

interface Clip {
  id: number;
  name: string;
  startBeat: number;
  duration: number;
}

const DAW = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [projectName, setProjectName] = useState('Untitled Project');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState({ numerator: 4, denominator: 4 });
  const [key, setKey] = useState('C');
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: 1,
      name: 'Main Vocals',
      type: 'audio',
      color: '#e74c3c',
      muted: false,
      solo: false,
      volume: 80,
      pan: 0,
      clips: [{ id: 1, name: 'Vocal Take 1', startBeat: 0, duration: 16 }],
    },
    {
      id: 2,
      name: 'Keys',
      type: 'instrument',
      color: '#9b59b6',
      muted: false,
      solo: false,
      volume: 75,
      pan: -20,
      clips: [
        { id: 2, name: 'Instrument', startBeat: 4, duration: 8 },
        { id: 3, name: 'Instrument', startBeat: 14, duration: 6 },
      ],
    },
    {
      id: 3,
      name: 'Synth Line',
      type: 'instrument',
      color: '#f1c40f',
      muted: false,
      solo: false,
      volume: 70,
      pan: 30,
      clips: [{ id: 4, name: 'Synth Line', startBeat: 8, duration: 12 }],
    },
    {
      id: 4,
      name: 'Bass Drum',
      type: 'drums',
      color: '#3498db',
      muted: false,
      solo: false,
      volume: 85,
      pan: 0,
      clips: [{ id: 5, name: 'Instrument', startBeat: 12, duration: 10 }],
    },
  ]);
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showVolumeDropdown, setShowVolumeDropdown] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const totalBars = 32;
  const beatsPerBar = timeSignature.numerator;
  const pixelsPerBeat = 50 * zoom;

  useEffect(() => {
    document.title = `${projectName} | Sonara DAW`;
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/login');
    }
  }, [navigate, projectName]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const handleAddTrack = () => {
    const colors = ['#e74c3c', '#9b59b6', '#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#1abc9c'];
    const newTrack: Track = {
      id: Date.now(),
      name: `Track ${tracks.length + 1}`,
      type: 'instrument',
      color: colors[tracks.length % colors.length],
      muted: false,
      solo: false,
      volume: 75,
      pan: 0,
      clips: [],
    };
    setTracks([...tracks, newTrack]);
  };

  const handleDeleteTrack = (trackId: number) => {
    setTracks(tracks.filter((t) => t.id !== trackId));
  };

  const toggleMute = (trackId: number) => {
    setTracks(tracks.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t)));
  };

  const toggleSolo = (trackId: number) => {
    setTracks(tracks.map((t) => (t.id === trackId ? { ...t, solo: !t.solo } : t)));
  };

  const handleVolumeChange = (trackId: number, volume: number) => {
    setTracks(tracks.map((t) => (t.id === trackId ? { ...t, volume } : t)));
  };

  const handleExit = () => {
    navigate('/create');
  };

  const handleSave = async () => {
    // TODO: Implement save functionality
    console.log('Saving project...', { projectName, bpm, timeSignature, key, tracks });
    alert('Project saved!');
  };

  return (
    <div style={styles.container}>
      {/* Top Menu Bar */}
      <div style={styles.menuBar}>
        <div style={styles.menuLeft}>
          <button onClick={handleExit} style={styles.menuButton}>↩ Exit</button>
          <span style={styles.menuDivider}>|</span>
          <button style={styles.menuButton}>File</button>
          <button style={styles.menuButton}>Edit</button>
          <button style={styles.menuButton}>View</button>
          <button style={styles.menuButton}>Settings</button>
          <button style={styles.menuButton}>Help</button>
        </div>
        <div style={styles.menuRight}>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            style={styles.projectNameInput}
          />
          <button onClick={handleSave} style={styles.saveButton}>Save</button>
        </div>
      </div>

      {/* Transport Controls */}
      <div style={styles.transportBar}>
        <div style={styles.transportLeft}>
          <button style={styles.transportIcon}>↶</button>
          <button style={styles.transportIcon}>↷</button>
          <span style={styles.transportDivider}></span>
          <button style={styles.transportIcon}>🔁</button>
          <button style={styles.transportIcon}>⊞</button>
        </div>

        <div style={styles.transportCenter}>
          <button
            onClick={() => setCurrentTime(0)}
            style={styles.transportButton}
          >
            ⏮
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ ...styles.transportButton, ...styles.playButton }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            style={styles.transportButton}
          >
            ⏭
          </button>
          <button
            onClick={() => setIsRecording(!isRecording)}
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
            <span style={styles.controlLabel}>{key}</span>
            <select
              value={key}
              onChange={(e) => setKey(e.target.value)}
              style={styles.controlSelect}
            >
              {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div style={styles.controlGroup}>
            <input
              type="number"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
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

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Track List */}
        <div style={styles.trackList}>
          <div style={styles.addTrackRow}>
            <button onClick={handleAddTrack} style={styles.addTrackButton}>
              + Add Track
            </button>
            <div style={styles.trackTools}>
              <button style={styles.toolButton}>○</button>
              <button style={styles.toolButton}>✎</button>
            </div>
          </div>

          {tracks.map((track) => (
            <div key={track.id} style={styles.trackRow}>
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
                    {track.type === 'audio' ? '🎤' : track.type === 'drums' ? '🥁' : '🎹'}
                  </span>
                  <span style={styles.trackName}>{track.name}</span>
                  <button
                    onClick={() => handleDeleteTrack(track.id)}
                    style={styles.trackMenuButton}
                  >
                    ···
                  </button>
                </div>

                <div style={styles.trackVolumeRow}>
                  <div style={styles.volumeDropdown}>
                    <button
                      onClick={() =>
                        setShowVolumeDropdown(showVolumeDropdown === track.id ? null : track.id)
                      }
                      style={styles.volumeDropdownButton}
                    >
                      Volume ▼
                    </button>
                    {showVolumeDropdown === track.id && (
                      <div style={styles.volumeDropdownMenu}>
                        <div
                          style={styles.volumeDropdownItem}
                          onClick={() => setShowVolumeDropdown(null)}
                        >
                          Volume
                        </div>
                        <div
                          style={styles.volumeDropdownItem}
                          onClick={() => setShowVolumeDropdown(null)}
                        >
                          Pan
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div style={styles.timelineContainer} ref={timelineRef}>
          {/* Timeline Header */}
          <div style={styles.timelineHeader}>
            <div
              style={{
                ...styles.playhead,
                left: `${(currentTime / 60) * bpm * pixelsPerBeat}px`,
              }}
            />
            {Array.from({ length: totalBars + 1 }).map((_, i) => (
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

          {/* Timeline Tracks */}
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
                      {/* Simulated waveform */}
                      {Array.from({ length: Math.floor(clip.duration * 4) }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            ...styles.waveformBar,
                            height: `${20 + Math.random() * 60}%`,
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
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #1a1a2e;
        }

        ::-webkit-scrollbar-thumb {
          background: #3a3a5e;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #4a4a7e;
        }
      `}</style>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#1a1a2e',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Poppins', sans-serif",
    color: '#ffffff',
    overflow: 'hidden',
  },
  menuBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#252542',
    borderBottom: '1px solid #3a3a5e',
  },
  menuLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  menuRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  menuButton: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    borderRadius: '4px',
    transition: 'background 0.2s',
  },
  menuDivider: {
    color: '#3a3a5e',
    margin: '0 8px',
  },
  projectNameInput: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    textAlign: 'right',
    width: '200px',
    padding: '4px 8px',
    borderRadius: '4px',
    fontFamily: "'Poppins', sans-serif",
  },
  saveButton: {
    background: 'linear-gradient(135deg, #00d4ff 0%, #0096c7 100%)',
    border: 'none',
    color: '#ffffff',
    padding: '6px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    borderRadius: '6px',
    fontFamily: "'Poppins', sans-serif",
  },
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
    textAlign: 'center',
    fontFamily: "'Poppins', sans-serif",
  },
  mainContent: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
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
    position: 'relative',
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
    textAlign: 'left',
    fontFamily: "'Poppins', sans-serif",
  },
  volumeDropdownMenu: {
    position: 'absolute',
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

export default DAW;