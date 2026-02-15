import { useNavigate } from 'react-router-dom';

const Congrats = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <div style={styles.congratsBox}>
        <h1 style={styles.title}>Congrats, you're in!</h1>
        <p style={styles.message}>You have successfully logged in and accessed the protected area.</p>
        <button onClick={handleLogout} style={styles.button}>Logout</button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#0a0a23',
    color: 'white',
  },
  congratsBox: {
    width: '400px',
    padding: '40px',
    textAlign: 'center' as const,
    backgroundColor: '#16213e',
    borderRadius: '10px',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
  },
  title: {
    marginBottom: '20px',
    color: '#00dbde',
    fontSize: '28px',
  },
  message: {
    marginBottom: '30px',
    fontSize: '18px',
    color: 'white',
  },
  button: {
    width: '100%',
    padding: '12px 20px',
    margin: '10px 0',
    border: 'none',
    borderRadius: '30px',
    background: 'linear-gradient(45deg, #00dbde, #fc00ff)',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
};

export default Congrats;
