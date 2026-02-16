import { Routes, Route } from 'react-router-dom';
import Home from './home';
import Login from './login';
import Signup from './signup';
import Congrats from './congrats';
import Profile from './src/Profile';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/home" element={<Home />} />
      <Route path="/congrats" element={<Congrats />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
};

export default App;

