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

// Import Project Management components
import { ProjectProvider } from '../Context/ProjectContext';
import { ProjectTasksProvider } from '../Context/ProjectTasksContext';
import ProjectList from '../components/Projects/ProjectList';
import ProjectForm from '../components/Projects/ProjectForm';
import ProjectDetails from '../components/Projects/ProjectDetails';
import ProjectDashboard from '../components/ProjectManagement/ProjectDashboard';
import TaskList from "../components/Tasks/TaskList";
import TaskForm from "../components/Tasks/TaskForm";
import TaskDetailsPanel from "../components/Tasks/TaskDetailsPanel";
import AiTaskGenerator from "../components/ProjectManagement/AiTaskGenerator";

// Project Management route wrapper component
const ProjectManagementRoute = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return (
    <ProjectProvider>
      {children}
    </ProjectProvider>
  );
};

// Project-specific route with task context
const ProjectTasksRoute = ({ children }) => {
  const { projectId } = useParams();
  
  return (
    <ProjectTasksProvider projectId={projectId}>
      {children}
    </ProjectTasksProvider>
  );
};

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

          {/* Project Management Routes */}
          <Route path="/projects" element={
            <ProjectManagementRoute>
              <ProjectList />
            </ProjectManagementRoute>
          } />
          
          <Route path="/projects/new" element={
            <ProjectManagementRoute>
              <ProjectForm />
            </ProjectManagementRoute>
          } />
          
          <Route path="/projects/dashboard" element={
            <ProjectManagementRoute>
              <ProjectDashboard />
            </ProjectManagementRoute>
          } />
          
          <Route path="/projects/:projectId" element={
            <ProjectManagementRoute>
              <ProjectTasksRoute>
                <ProjectDetails />
              </ProjectTasksRoute>
            </ProjectManagementRoute>
          } />
          
          <Route path="/projects/:projectId/dashboard" element={
            <ProjectManagementRoute>
              <ProjectTasksRoute>
                <ProjectDashboard />
              </ProjectTasksRoute>
            </ProjectManagementRoute>
          } />
          
          <Route path="/tasks" element={
            <ProjectManagementRoute>
              <TaskList />
            </ProjectManagementRoute>
          } />
          
          <Route path="/projects/:projectId/tasks/new" element={
            <ProjectManagementRoute>
              <ProjectTasksRoute>
                <TaskForm />
              </ProjectTasksRoute>
            </ProjectManagementRoute>
          } />
          
          <Route path="/projects/:projectId/tasks/:taskId" element={
            <ProjectManagementRoute>
              <ProjectTasksRoute>
                <TaskDetailsPanel />
              </ProjectTasksRoute>
            </ProjectManagementRoute>
          } />
          
          <Route path="/projects/:projectId/tasks/:taskId/edit" element={
            <ProjectManagementRoute>
              <ProjectTasksRoute>
                <TaskForm isEditing={true} />
              </ProjectTasksRoute>
            </ProjectManagementRoute>
          } />
          
          <Route path="/projects/ai-tasks" element={
            <ProjectManagementRoute>
              <div className="max-w-3xl mx-auto px-4 py-10">
                <h1 className="text-2xl font-bold text-slate-100 mb-6">AI Task Generator</h1>
                <p className="text-slate-400 mb-8">
                  Select a project to generate AI-powered tasks for your project based on your description.
                </p>
                <AiTaskGenerator isOpen={true} standalone={true} />
              </div>
            </ProjectManagementRoute>
          } />

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
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default AppRoutes;