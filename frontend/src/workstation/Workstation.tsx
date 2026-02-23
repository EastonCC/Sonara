import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useDawStore from './state/dawStore';
import { initAudio, dispose } from './engine/TransportSync';
import MenuBar from './components/MenuBar';
import Transport from './components/Transport';
import TrackList from './components/TrackList';
import Timeline from './components/Timeline';
import PianoRoll from './components/PianoRoll';

const DAW = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const projectName = useDawStore((s) => s.projectName);
  const pianoRollClipId = useDawStore((s) => s.pianoRollClipId);

  const trackListRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  // Sync vertical scroll between track list and timeline
  const handleTrackListScroll = useCallback(() => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    if (trackListRef.current && timelineRef.current) {
      timelineRef.current.scrollTop = trackListRef.current.scrollTop;
    }
    isSyncing.current = false;
  }, []);

  const handleTimelineScroll = useCallback(() => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    if (trackListRef.current && timelineRef.current) {
      trackListRef.current.scrollTop = timelineRef.current.scrollTop;
    }
    isSyncing.current = false;
  }, []);

  useEffect(() => {
    document.title = `${projectName} | Sonara DAW`;
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/login');
    }
  }, [navigate, projectName]);

  // Clean up audio engine on unmount
  useEffect(() => {
    return () => dispose();
  }, []);

  // Initialize audio on first user interaction
  const handleUserGesture = async () => {
    await initAudio();
    // Remove listener after first init
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
      <div style={styles.mainContent}>
        <TrackList scrollRef={trackListRef} onScroll={handleTrackListScroll} />
        <Timeline scrollRef={timelineRef} onScroll={handleTimelineScroll} />
      </div>

      {pianoRollClipId && <PianoRoll />}

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