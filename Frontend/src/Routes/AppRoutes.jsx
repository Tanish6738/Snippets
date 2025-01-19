import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from '../Context/UserContext';
import Navbar from '../components/User/Navbar';
import Home from '../components/User/Home';
import Login from '../components/User/Login';
import Register from '../components/User/Register';
import Profile from '../components/User/Profile';
import CreateDirectory from '../components/Directory/CreateDirectory';
import DirectoryComponent from '../components/Directory/DirectoryComponent';
import EditDirectoryDetails from '../components/Directory/EditDirectoryDetails';
import GroupLayout from '../components/Group/GroupLayout';
import CreateGroup from '../components/Group/CreateGroup';

const AppRoutes = () => {
  const { isAuthenticated } = useUser();

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/directories" element={isAuthenticated ? <DirectoryComponent /> : <Navigate to="/login" />} />
        <Route path="/directories/new" element={isAuthenticated ? <CreateDirectory /> : <Navigate to="/login" />} />
        <Route path="/directories/:id/edit" element={isAuthenticated ? <EditDirectoryDetails /> : <Navigate to="/login" />} />
        
        {/* Group Routes */}
        <Route path="/groups" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
        <Route path="/groups/:id/*" element={isAuthenticated ? <GroupLayout /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;