import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import sonaraLogo from './assets/sonara_logo.svg';
import waveLeft from './assets/wave-left.svg';
import waveRight from './assets/wave-right.svg';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Home | Sonara';
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      {/* Background gradient overlay */}
      <div style={styles.backgroundOverlay}></div>

      {/* Wave decorations */}
      <img src={waveLeft} alt="" style={styles.waveLeft} />
      <img src={waveRight} alt="" style={styles.waveRight} />

      <div style={styles.content}>
        {/* Logo */}
        <img src={sonaraLogo} alt="Sonara" style={styles.logo} />

        <h1 style={styles.title}>Welcome to Sonara</h1>
        <p style={styles.subtitle}>You are logged in!</p>

        <div style={styles.linksContainer}>
          <Link to="/profile" style={styles.profileLink}>Go to your Profile</Link>
        </div>

        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        a:hover {
          color: #00d4ff !important;
        }

        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(255, 100, 100, 0.4);
        }

        button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    width: '100%',
    background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Poppins', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(ellipse at 50% 0%, rgba(100, 100, 200, 0.1) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
  waveLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: 'auto',
    maxWidth: '350px',
    pointerEvents: 'none',
    opacity: 0.8,
  },
  waveRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: '100%',
    width: 'auto',
    maxWidth: '350px',
    pointerEvents: 'none',
    opacity: 0.8,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 1,
    padding: '20px',
    width: '100%',
    maxWidth: '600px',
    textAlign: 'center',
  },
  logo: {
    width: '100%',
    maxWidth: '300px',
    height: 'auto',
    marginBottom: '40px',
    filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))',
  },
  title: {
    fontSize: '36px',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '18px',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '30px',
  },
  linksContainer: {
    marginBottom: '30px',
  },
  profileLink: {
    color: '#00d4ff',
    fontSize: '18px',
    textDecoration: 'none',
    transition: 'color 0.3s ease',
  },
  logoutButton: {
    padding: '14px 50px',
    fontSize: '18px',
    fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 50%, #dd4a4a 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 20px rgba(255, 100, 100, 0.3)',
  },
};

export default Home;
