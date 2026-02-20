import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Track } from './models/types';
import MenuBar from './components/MenuBar';
import Transport from './components/Transport';
import TrackList from './components/TrackList';
import Timeline from './components/Timeline';

const TRACK_COLORS = ['#e74c3c', '#9b59b6', '#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#1abc9c'];

const DEFAULT_TRACKS: Track[] = [
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
];

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
  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);
  const [zoom, setZoom] = useState(1);

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

  const handleAddTrack = () => {
    const newTrack: Track = {
      id: Date.now(),
      name: `Track ${tracks.length + 1}`,
      type: 'instrument',
      color: TRACK_COLORS[tracks.length % TRACK_COLORS.length],
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

  const handleSave = async () => {
    console.log('Saving project...', { projectName, bpm, timeSignature, key, tracks });
    alert('Project saved!');
  };

  return (
    <div style={styles.container}>
      <MenuBar
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onSave={handleSave}
        onExit={() => navigate('/create')}
      />

      <Transport
        isPlaying={isPlaying}
        isRecording={isRecording}
        currentTime={currentTime}
        bpm={bpm}
        timeSignature={timeSignature}
        musicalKey={key}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onStop={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onRewind={() => setCurrentTime(0)}
        onToggleRecord={() => setIsRecording(!isRecording)}
        onBpmChange={setBpm}
        onKeyChange={setKey}
      />

      <div style={styles.mainContent}>
        <TrackList
          tracks={tracks}
          onAddTrack={handleAddTrack}
          onToggleMute={toggleMute}
          onToggleSolo={toggleSolo}
          onDeleteTrack={handleDeleteTrack}
        />
        <Timeline
          tracks={tracks}
          currentTime={currentTime}
          bpm={bpm}
          timeSignature={timeSignature}
          zoom={zoom}
        />
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
  mainContent: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
};

export default DAW;