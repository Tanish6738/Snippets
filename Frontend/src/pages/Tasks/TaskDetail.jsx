// Task Detail Page
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchTaskById, fetchProjectById } from '../../services/projectService';
import TaskSubtasks from '../../components/Task/TaskSubtasks';
import TaskDependencies from '../../components/Task/TaskDependencies';
import TaskComments from '../../components/Task/TaskComments';
import TaskChecklist from '../../components/Task/TaskChecklist';
import TaskAssignment from '../../components/Task/TaskAssignment';

const TaskDetail = () => {
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const fetchTaskAndProject = async () => {
    try {
      const taskData = await fetchTaskById(taskId);
      setTask(taskData.task || taskData);
      
      // If we have project data
      if (taskData.task?.project || taskData.project) {
        const projectId = taskData.task?.project || taskData.project;
        try {
          // Fetch project data to get members for assignment
          const projectData = await fetchProjectById(projectId);
          setProject(projectData.project || projectData);
          setProjectMembers(projectData.project?.members || projectData.members || []);

          // Determine if current user is admin
          const currentUser = getCurrentUser(); // Assuming this function exists in your auth context
          const isUserAdmin = determineIfUserIsAdmin(currentUser, projectData.project || projectData);
          setIsAdmin(isUserAdmin);
        } catch (err) {
          console.error("Error fetching project data:", err);
          setError("Failed to load project details");
        }
      }
    } catch (err) {
      console.error("Error fetching task data:", err);
      setError("Failed to load task details");
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to determine if user is admin
  const determineIfUserIsAdmin = (user, project) => {
    if (!user || !project) return false;
    
    // Check if user is project creator
    if (project.createdBy && project.createdBy._id === user.id) {
      return true;
    }
    
    // Check if user is admin in members array
    if (project.members && Array.isArray(project.members)) {
      const userMember = project.members.find(m => m.user._id === user.id);
      if (userMember && userMember.role === 'Admin') {
        return true;
      }
    }
    
    return false;
  };
  
  // Get current user from auth context or localStorage
  const getCurrentUser = () => {
    // This is a placeholder - replace with your actual auth logic
    const userString = localStorage.getItem('user');
    if (!userString) return null;
    try {
      return JSON.parse(userString);
    } catch (e) {
      console.error("Error parsing user data:", e);
      return null;
    }
  };
  
  useEffect(() => {
    if (taskId) {
      fetchTaskAndProject();
    }
  }, [taskId]);
  
  // Handle assigning users to the task
  const handleAssignUsers = async (selectedUserIds) => {
    try {
      setLoading(true);
      // Call the assignment service function (implement in projectService.js)
      const response = await assignUsersToTask(taskId, selectedUserIds);
      
      // Update the task with new assignees
      if (response.success) {
        setTask({
          ...task,
          assignedTo: response.task.assignedTo
        });
      }
    } catch (err) {
      setError("Failed to assign users to this task");
      console.error("Assignment error:", err);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="p-4">Loading task details...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }
  
  if (!task) {
    return <div className="p-4">Task not found</div>;
  }
  
  return (
    <div className="p-4">
      {/* Task header with title, status, and priority */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{task.title}</h1>
        <div className="flex space-x-2">
          <span className={`px-3 py-1 rounded text-white ${getStatusColor(task.status)}`}>
            {task.status}
          </span>
          <span className={`px-3 py-1 rounded text-white ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>
      </div>
      
      {/* Task metadata: due date, created by, etc. */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-gray-600">Created by: {task.createdBy?.username || 'Unknown'}</p>
          <p className="text-gray-600">
            Due date: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
          </p>
        </div>
        <div>
          <p className="text-gray-600">Created: {new Date(task.createdAt).toLocaleDateString()}</p>
          {task.parentTask && <p className="text-gray-600">Parent task: {task.parentTask.title}</p>}
        </div>
      </div>
      
      {/* Task description */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Description</h2>
        <div className="bg-gray-50 p-4 rounded-md">
          {task.description || 'No description provided.'}
        </div>
      </div>
      
      {/* Task assignment section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Assigned To</h2>
        <TaskAssignment 
          taskId={taskId}
          currentAssignees={task.assignedTo || []}
          projectMembers={projectMembers}
          onAssign={handleAssignUsers}
          isAdmin={isAdmin} 
        />
      </div>
      
      {/* Subtasks section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Subtasks</h2>
        <TaskSubtasks 
          taskId={taskId}
          subtasks={task.subtasks || []}
          projectMembers={projectMembers}
          isAdmin={isAdmin}
        />
      </div>
      
      {/* Dependencies section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Dependencies</h2>
        <TaskDependencies taskId={taskId} dependencies={task.dependencies || []} />
      </div>
      
      {/* Comments section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Comments</h2>
        <TaskComments taskId={taskId} comments={task.comments || []} />
      </div>
      
      {/* Checklist section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Checklist</h2>
        <TaskChecklist taskId={taskId} checklist={task.checklist || []} />
      </div>
      
      {/* Actions section */}
      <div className="flex justify-end space-x-2 mt-8">
        <button 
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
        {isAdmin && (
          <Link 
            to={`/tasks/${taskId}/edit`}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Edit Task
          </Link>
        )}
      </div>
    </div>
  );
};

// Helper functions for status and priority colors
const getStatusColor = (status) => {
  switch (status) {
    case 'To Do': return 'bg-gray-500';
    case 'In Progress': return 'bg-blue-500';
    case 'On Hold': return 'bg-yellow-500';
    case 'Completed': return 'bg-green-500';
    case 'Cancelled': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'Low': return 'bg-gray-400';
    case 'Medium': return 'bg-blue-400';
    case 'High': return 'bg-orange-400';
    case 'Urgent': return 'bg-red-400';
    default: return 'bg-gray-400';
  }
};

export default TaskDetail;