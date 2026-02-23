import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useDawStore from './state/dawStore';
import MenuBar from './components/MenuBar';
import Transport from './components/Transport';
import TrackList from './components/TrackList';
import Timeline from './components/Timeline';

const DAW = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const projectName = useDawStore((s) => s.projectName);
  const isPlaying = useDawStore((s) => s.isPlaying);
  const setCurrentTime = useDawStore((s) => s.setCurrentTime);

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
        setCurrentTime(useDawStore.getState().currentTime + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, setCurrentTime]);

  return (
    <div style={styles.container}>
      <MenuBar />
      <Transport />
      <div style={styles.mainContent}>
        <TrackList />
        <Timeline />
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