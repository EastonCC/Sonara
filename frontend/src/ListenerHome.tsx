import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import sonaraLogo from './assets/sonara_logo.svg';

const ListenerHome = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  document.title = 'Home | Sonara';
  
  const verifyAuth = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        // Token invalid or expired - clear and redirect
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/login');
        return;
      }
      
      const data = await response.json();
      setUsername(data.username);
      setLoading(false);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      navigate('/login');
    }
  };
  
  verifyAuth();
}, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      {/* Background overlay */}
      <div style={styles.backgroundOverlay}></div>

      <div style={styles.content}>
        <div style={styles.header}>
          <img src={sonaraLogo} alt="Sonara" style={styles.logo} />
          <div style={styles.searchBar}>
            <input type="text" placeholder="Search" style={styles.searchInput} />
            <button style={styles.settingsButton}>⚙️</button>
            <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
          </div>
        </div>

        <div style={styles.navTabs}>
          <span style={{...styles.tab, ...styles.tabActive}}>Home</span>
          <span style={styles.tab}>Explore</span>
          <span style={styles.tab}><Link to="/create" className="top-nav-link" style={styles.topNavLink}>Create</Link></span>
          <span style={styles.tab}><Link to="/profile" className="top-nav-link" style={styles.topNavLink}>Profile</Link></span>
          <span style={styles.tab}>Library</span>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Trending</h2>
          <div style={styles.songsGrid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={styles.songCard}>
                <div style={styles.albumArt}></div>
                <p style={styles.songTitle}>Song Title</p>
                <p style={styles.artistName}>Artist Name</p>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Recommended</h2>
          <div style={styles.songsGrid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={styles.songCard}>
                <div style={styles.albumArt}></div>
                <p style={styles.songTitle}>Song Title</p>
                <p style={styles.artistName}>Artist Name</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        input:focus {
          outline: none;
          border-color: #00d4ff;
          box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
        }

        button:hover {
          transform: translateY(-2px);
        }

        a.top-nav-link:hover {
          color: #00d4ff !important;
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    width: '100%',
    background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%)',
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
  content: {
    position: 'relative',
    zIndex: 1,
    padding: '20px 40px',
    color: 'white',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  logo: {
    height: '50px',
    width: 'auto',
    filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.2))',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  searchInput: {
    padding: '12px 20px',
    borderRadius: '12px',
    border: '2px solid rgba(100, 150, 200, 0.3)',
    backgroundColor: 'rgba(30, 45, 80, 0.6)',
    color: 'white',
    width: '250px',
    fontSize: '14px',
    fontFamily: "'Poppins', sans-serif",
    transition: 'all 0.3s ease',
  },
  settingsButton: {
    background: 'rgba(30, 45, 80, 0.6)',
    border: '2px solid rgba(100, 150, 200, 0.3)',
    borderRadius: '12px',
    color: 'white',
    fontSize: '1.2em',
    cursor: 'pointer',
    padding: '10px 15px',
    transition: 'all 0.3s ease',
  },
  logoutButton: {
    padding: '12px 24px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 50%, #dd4a4a 100%)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
    boxShadow: '0 4px 15px rgba(255, 100, 100, 0.3)',
    transition: 'all 0.3s ease',
  },
  navTabs: {
    display: 'flex',
    gap: '40px',
    marginBottom: '40px',
    borderBottom: '1px solid rgba(100, 150, 200, 0.2)',
    paddingBottom: '15px',
  },
  tab: {
    color: 'rgba(255, 255, 255, 0.6)',
    cursor: 'pointer',
    paddingBottom: '10px',
    fontSize: '16px',
    fontWeight: 500,
    transition: 'color 0.3s ease',
    borderBottom: '2px solid transparent',
  },
  tabActive: {
    color: '#00d4ff',
    borderBottom: '2px solid #00d4ff',
  },
  topNavLink: {
    color: 'rgba(255, 255, 255, 0.6)',
    textDecoration: 'none',
  },
  section: {
    marginBottom: '50px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '25px',
    color: '#ffffff',
  },
  songsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '15px',  // was 30px
  },
  songCard: {
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'transform 0.3s ease',
  },
  albumArt: {
    width: '200px',   // was 150px
    height: '200px',  // was 150px
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #00d4ff 0%, #9b59b6 50%, #ff6b9d 100%)',
    margin: '0 auto 15px',
    boxShadow: '0 4px 20px rgba(0, 212, 255, 0.3)',
},
  songTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: '8px 0',
    color: '#ffffff',
  },
  artistName: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '14px',
  },
};

export default ListenerHome;
