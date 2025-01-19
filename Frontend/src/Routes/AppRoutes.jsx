import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from '../Context/UserContext';
import Navbar from '../components/User/Navbar';
import Home from '../components/User/Home';
import Login from '../components/User/Login';
import Register from '../components/User/Register';
import Profile from '../components/User/Profile';

// Layout Components
import SnippetLayout from '../components/Layouts/SnippetLayout';
import GroupLayout from '../components/Layouts/GroupLayout';
import DirectoryLayout from '../components/Layouts/DirectoryLayout';
import PublicData from '../components/Layouts/PublicData';

const AppRoutes = () => {
  const { isAuthenticated } = useUser();

  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
        <Route path="/public" element={<PublicData />} />

        {/* Protected Routes */}
        <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />

        {/* Directory Routes */}
        <Route path="/directories" element={isAuthenticated ? <DirectoryLayout /> : <Navigate to="/login" />} />

        {/* Snippet Routes */}
        <Route path="/snippets" element={isAuthenticated ? <SnippetLayout /> : <Navigate to="/login" />} />

        {/* Group Routes */}
        <Route path="/groups" element={isAuthenticated ? <GroupLayout /> : <Navigate to="/login" />}>
          <Route index element={<Home />} />
        </Route>

        {/* Catch-all route for 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;