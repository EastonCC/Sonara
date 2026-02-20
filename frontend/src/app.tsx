import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import ProfilePage from './ProfilePage';
import ListenerHome from './ListenerHome';
import NotFound from './NotFound';
import Create from './Create';
import Workstation from './Workstation';


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
      <Route path="*" element={<NotFound />} />
      <Route path="/create" element={<Create />} />
      <Route path="/workstation" element={<Workstation />} />
    </Routes>
  );
};

export default App;