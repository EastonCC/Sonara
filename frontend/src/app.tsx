import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import ProfilePage from './ProfilePage';
import ListenerHome from './ListenerHome';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/home" element={<ListenerHome />} />
      <Route path="/listenerHome" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default App;