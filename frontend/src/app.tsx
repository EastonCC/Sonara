import { Routes, Route } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
import Signup from './Signup';
import ProfilePage from './ProfilePage';
import ListenerHome from './ListenerHome';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/listenerHome" element={<ListenerHome />} />
    </Routes>
  );
};

export default App;

