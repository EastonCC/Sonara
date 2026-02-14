import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/login');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  return (
    <div>
      <h1>Welcome to Sonara</h1>
      <p>You are logged in!</p> <p> Go to your <a href="/profile">Profile</a></p>
      <button onClick={handleLogout}>Logout</button>
    </div>

  );
};

export default Home;



