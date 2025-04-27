import React, { useMemo } from 'react';
import { useProject } from '../../Context/ProjectContext';
import { FiClock, FiUsers, FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiActivity } from 'react-icons/fi';
import LoadingSpinner from '../Common/LoadingSpinner';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const ProjectDashboard = ({ projectId }) => {
  const { currentProject, tasks, projectMembers, loading } = useProject();

  // Calculate project statistics
  const stats = useMemo(() => {
    if (!tasks.length) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        blocked: 0,
        completionRate: 0,
        upcomingDueTasks: [],
        recentActivities: [],
      };
    }

    // Flatten all tasks including subtasks
    const flattenTasks = (taskList) => {
      let flattened = [];
      
      taskList.forEach(task => {
        flattened.push(task);
        
        if (task.subtasks && task.subtasks.length > 0) {
          flattened = [...flattened, ...flattenTasks(task.subtasks)];
        }
      });
      
      return flattened;
    };
    
    const allTasks = flattenTasks(tasks);
    
    // Calculate counts
    const total = allTasks.length;
    const completed = allTasks.filter(task => task.status === 'Completed').length;
    const inProgress = allTasks.filter(task => task.status === 'In Progress').length;
    const blocked = allTasks.filter(task => task.status === 'Blocked').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Get upcoming tasks due in the next 7 days
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingDueTasks = allTasks
      .filter(task => {
        if (!task.dueDate || task.status === 'Completed') return false;
        
        const dueDate = new Date(task.dueDate);
        return dueDate >= today && dueDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);
    
    // Get recent activities
    const recentActivities = (currentProject.activities || [])
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
    
    return {
      total,
      completed,
      inProgress,
      blocked,
      completionRate,
      upcomingDueTasks,
      recentActivities,
    };
  }, [tasks, currentProject]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <FiActivity className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Tasks</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.total}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <FiCheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed Tasks</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.completed}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <FiClock className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.inProgress}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <FiAlertCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Blocked Tasks</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.blocked}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Project Progress</h3>
          <div className="mt-4">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium text-gray-500">
                {stats.completed} of {stats.total} tasks completed
              </div>
              <div className="text-sm font-medium text-gray-900">{stats.completionRate}%</div>
            </div>
            <div className="mt-2 relative">
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                <div
                  style={{ width: `${stats.completionRate}%` }}
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                    stats.completionRate < 30
                      ? 'bg-red-500'
                      : stats.completionRate < 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Due Tasks */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Upcoming Deadlines</h3>
            {stats.upcomingDueTasks.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {stats.upcomingDueTasks.map(task => (
                  <li key={task._id} className="py-3">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-4 w-4 rounded-full ${getDueDateIndicatorColor(task.dueDate)}`}></div>
                      <div className="ml-3 flex-1">
                        <Link
                          to={`/projects/${projectId}/tasks/${task._id}`}
                          className="text-sm font-medium text-gray-900 hover:text-primary-600"
                        >
                          {task.title}
                        </Link>
                        <p className="text-sm text-gray-500">
                          Due {format(new Date(task.dueDate), 'MMM d')}
                          {task.assignedTo && task.assignedTo.username && ` • Assigned to ${task.assignedTo.username}`}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            getPriorityClasses(task.priority || 'Medium')
                          }`}
                        >
                          {task.priority || 'Medium'}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>No upcoming deadlines in the next 7 days</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
            {stats.recentActivities.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {stats.recentActivities.map(activity => (
                  <li key={activity._id} className="py-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {activity.user.avatar ? (
                            <img
                              src={activity.user.avatar}
                              alt={activity.user.username}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-500">
                              {activity.user.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{activity.user.username}</span>{' '}
                          {activity.action}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Team Members</h3>
            <Link
              to={`/projects/${projectId}/members`}
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('button[data-tab="members"]').click();
              }}
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View All
            </Link>
          </div>
          <div className="flex overflow-auto -space-x-2">
            {projectMembers && projectMembers.length > 0 ? (
              projectMembers.slice(0, 10).map(member => (
                <div key={member._id} className="flex-shrink-0 relative">
                  <div
                    className="h-10 w-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center"
                    title={`${member.user.username} (${member.role})`}
                  >
                    {member.user.avatar ? (
                      <img
                        src={member.user.avatar}
                        alt={member.user.username}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-500">
                        {member.user.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500">No members yet</div>
            )}
            
            {projectMembers && projectMembers.length > 10 && (
              <div className="flex-shrink-0 relative">
                <div className="h-10 w-10 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    +{projectMembers.length - 10}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to determine due date color
const getDueDateIndicatorColor = (dueDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDateObj = new Date(dueDate);
  dueDateObj.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.round((dueDateObj - today) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 0) {
    return 'bg-red-600'; // Overdue
  } else if (daysDiff === 0) {
    return 'bg-orange-500'; // Due today
  } else if (daysDiff <= 2) {
    return 'bg-yellow-500'; // Due soon
  } else {
    return 'bg-green-500'; // Due later
  }
};

// Helper function for priority classes
const getPriorityClasses = (priority) => {
  switch (priority) {
    case 'Low':
      return 'bg-green-100 text-green-800';
    case 'Medium':
      return 'bg-blue-100 text-blue-800';
    case 'High':
      return 'bg-orange-100 text-orange-800';
    case 'Urgent':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default ProjectDashboard;