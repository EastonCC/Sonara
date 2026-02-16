import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ListenerHome = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Check if the user is logged in
    document.title = 'Home | Sonara';
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
    } else {
      // Optionally, fetch user data or display personalized content
      const storedUsername = localStorage.getItem('username');
      if (storedUsername) setUsername(storedUsername);
    }
  }, [navigate]);

  const handleLogout = () => {
    // Clear tokens and redirect to login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.logo}>SONARA</h1>
        <div style={styles.searchBar}>
          <input type="text" placeholder="Search" style={styles.searchInput} />
          <button style={styles.settingsButton}>⚙️</button>
          <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
        </div>
      </div>
      <div style={styles.navTabs}>
        <span style={styles.tab}>Home</span>
        <span style={styles.tab}>Explore</span>
        <span style={styles.tab}>Create</span>
        <span style={styles.tab}>Profile</span>
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
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#0a0a23',
    color: 'white',
    minHeight: '100vh',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  logo: {
    color: '#fc00ff',
    fontSize: '2em',
    fontWeight: 'bold',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  searchInput: {
    padding: '8px 12px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: '#16213e',
    color: 'white',
    width: '200px',
  },
  settingsButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '1.2em',
    cursor: 'pointer',
  },
  logoutButton: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid #fc00ff',
    backgroundColor: 'transparent',
    color: '#fc00ff',
    cursor: 'pointer',
    fontSize: '0.9em',
  },
  navTabs: {
    display: 'flex',
    gap: '30px',
    marginBottom: '30px',
    borderBottom: '1px solid #333',
    paddingBottom: '10px',
  },
  tab: {
    color: '#00dbde',
    cursor: 'pointer',
    paddingBottom: '5px',
    borderBottom: '2px solid transparent',
  },
  section: {
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '1.5em',
    marginBottom: '15px',
    color: '#00dbde',
  },
  songsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
  },
  songCard: {
    textAlign: 'center',
  },
  albumArt: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'linear-gradient(45deg, #00dbde, #fc00ff)',
    margin: '0 auto 10px',
  },
  songTitle: {
    fontSize: '1em',
    margin: '5px 0',
  },
  artistName: {
    color: '#aaa',
    fontSize: '0.9em',
  },
};

export default ListenerHome;
