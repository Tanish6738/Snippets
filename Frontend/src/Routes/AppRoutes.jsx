import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../Context/UserContext';
import { NotificationProvider } from '../Context/NotificationContext';
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
import ProjectList from '../pages/Projects/ProjectList';
import ProjectDetail from '../pages/Projects/ProjectDetail';
import ProjectDashboard from '../pages/Projects/ProjectDashboard';
import ProjectCreate from '../pages/Projects/ProjectCreate';
import ProjectEdit from '../pages/Projects/ProjectEdit';
import TaskDetail from '../pages/Tasks/TaskDetail';
import TaskCreate from '../pages/Tasks/TaskCreate';
import TaskEdit from '../pages/Tasks/TaskEdit';
import RecurringTaskList from '../pages/Tasks/RecurringTaskList';
import AiTaskGenerator from '../pages/Projects/AiTaskGenerator';
import ProjectTasks from '../pages/Projects/ProjectTasks';


const AppRoutes = () => {
  const { currentUser, isAuthenticated } = useAuth();

  return (
    <Router>
      <Navbar />
      <div className="pt-20 min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
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
            path="/projects" 
            element={isAuthenticated ? <ProjectList /> : <Navigate to="/login" />}
          />
          <Route 
            path="/projects/new" 
            element={isAuthenticated ? <ProjectCreate /> : <Navigate to="/login" />}
          />
          <Route 
            path="/projects/:projectId" 
            element={isAuthenticated ? <ProjectDetail /> : <Navigate to="/login" />}
          />
          <Route 
            path="/projects/:projectId/edit" 
            element={isAuthenticated ? <ProjectEdit /> : <Navigate to="/login" />}
          />
          <Route 
            path="/projects/:projectId/dashboard" 
            element={isAuthenticated ? <ProjectDashboard /> : <Navigate to="/login" />}
          />
          <Route 
            path="/tasks/:taskId" 
            element={isAuthenticated ? <TaskDetail /> : <Navigate to="/login" />}
          />
          <Route 
            path="/tasks/:taskId/edit" 
            element={isAuthenticated ? <TaskEdit /> : <Navigate to="/login" />}
          />
          <Route 
            path="/projects/:projectId/tasks/new" 
            element={isAuthenticated ? <TaskCreate /> : <Navigate to="/login" />}
          />
          <Route 
            path="/projects/:projectId/recurring-tasks" 
            element={isAuthenticated ? <RecurringTaskList /> : <Navigate to="/login" />}
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
            element={isAuthenticated ? <Snippets /> : <Navigate to="/login" />}
          />
          <Route
            path="/my-directories"
            element={isAuthenticated ? <Directories /> : <Navigate to="/login" />}
          />
          <Route 
            path="/projects/ai-tasks" 
            element={isAuthenticated ? <AiTaskGenerator /> : <Navigate to="/login" />}
          />
          <Route 
            path="/projects/:projectId/tasks" 
            element={isAuthenticated ? <ProjectTasks /> : <Navigate to="/login" />}
          />
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default AppRoutes;