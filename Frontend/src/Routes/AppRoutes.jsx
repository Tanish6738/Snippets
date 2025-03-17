import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useUser } from '../Context/UserContext';
import Navbar from '../components/User/Navbar';
import Home from '../components/User/Home';
import Login from '../components/User/Login';
import Register from '../components/User/Register';
import Profile from '../components/User/Profile';
import SnippetLayout from '../components/Layouts/SnippetLayout';
import GroupLayout from '../components/Layouts/GroupLayout';
import DirectoryLayout from '../components/Layouts/DirectoryLayout';
import PublicData from '../components/Layouts/PublicData';
import SharedSnippet from '../components/SharedSnippet/SharedSnippet';
import BlogLayout from '../components/Blog/BlogLayout';
import Landing from '../components/Landing/Landing';
import CodeRunner from '../components/Layouts/CodeRunner';
import Scrapper from '../components/Layouts/Scrapper';
import Pdf from '../components/Layouts/Pdf';
import Snippets from '../components/Modals/SnippetModals/Snippets';
import Directories from '../components/Modals/DirectoryModals/Directories';

const AppRoutes = () => {
  const { isAuthenticated } = useUser();

  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/home" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/home" />} />
        <Route path="/public" element={<PublicData />}>
          <Route path="snippets" element={<SnippetLayout />} />
          <Route path="directories" element={<DirectoryLayout />} />
        </Route>
        <Route path="/shared-snippet/:snippetId" element={<SharedSnippet />} />

        {/* Blog Routes with wildcard */}
        <Route path="/blog/*" element={<BlogLayout />} />

        {/* Protected Routes */}
        <Route path="/home" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/directories" element={isAuthenticated ? <DirectoryLayout /> : <Navigate to="/login" />} />
        <Route path="/snippets" element={isAuthenticated ? <SnippetLayout /> : <Navigate to="/login" />} />
        <Route path="/groups" element={isAuthenticated ? <Navigate to="/home" /> : <Navigate to="/login" />} />
        <Route 
          path="/groups/:groupId" 
          element={
            isAuthenticated ? 
            <GroupLayout /> : 
            <Navigate to="/login" />
          } 
        />
        <Route 
          path="/run-code" 
          element={ <CodeRunner /> } 
        />
        <Route
          path="/scrape"
          element={ <Scrapper /> }
        />
        <Route
          path="/create-pdf"
          element={ <Pdf /> }
        />
        <Route
          path="/my-snippets"
          element={isAuthenticated ? <SnippetLayout /> : <Navigate to="/login" />}
        />
        <Route
          path="/my-directories"
          element={isAuthenticated ? <Directories /> : <Navigate to="/login" />}
        />
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;