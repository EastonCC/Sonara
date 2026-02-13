import { Routes, Route } from 'react-router-dom';
import Home from './home';
import Login from './login';
import Signup from './signup';
import Congrats from './congrats';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/congrats" element={<Congrats />} />
    </Routes>
  );
};

export default App;

