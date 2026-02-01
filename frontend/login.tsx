import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error('Login failed. Please check your credentials.');
      }

      const data = await response.json();
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      navigate('/congrats'); // Redirect to the congrats page after login
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h1 style={styles.title}>Login/Sign Up</h1>
        <div style={styles.logo}>SONARA</div>
        <div style={styles.avatar}>👤</div>
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <button type="submit" style={styles.button}>Login</button>
        </form>
        <div style={styles.links}>
          <Link to="/forgot-password" style={styles.link}>Forgot Password?</Link>
          <div>
            Don't have an account? <Link to="/signup" style={styles.link}>Sign Up</Link>
          </div>
        </div>
        {error && <p style={styles.error}>{error}</p>}
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
  loginBox: {
    width: '400px',
    padding: '40px',
    textAlign: 'center' as const,
    backgroundColor: '#16213e',
    borderRadius: '10px',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
  },
  title: {
    marginBottom: '20px',
    color: '#e94560',
    fontSize: '18px',
  },
  logo: {
    fontSize: '48px',
    fontWeight: 'bold' as const,
    marginBottom: '20px',
    background: 'linear-gradient(45deg, #00dbde, #fc00ff, #00dbde)',
    WebkitBackgroundClip: 'text' as const,
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textShadow: '0 3px 5px rgba(0, 0, 0, 0.2)',
  },
  avatar: {
    fontSize: '40px',
    margin: '20px auto',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: '#e94560',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  inputGroup: {
    textAlign: 'left' as const,
  },
  input: {
    width: '100%',
    padding: '12px 20px',
    margin: '8px 0',
    boxSizing: 'border-box' as const,
    border: '2px solid #00dbde',
    borderRadius: '30px',
    backgroundColor: 'transparent',
    color: 'white',
    fontSize: '16px',
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
  links: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    fontSize: '14px',
  },
  link: {
    color: '#00dbde',
    textDecoration: 'none',
  },
  error: {
    color: '#e94560',
    marginTop: '20px',
  },
};

export default Login;
