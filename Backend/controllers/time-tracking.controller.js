import TimeEntry from '../Models/time-entry.model.js';
import Task from '../Models/task.model.js';
import Project from '../Models/project.model.js';
import User from '../Models/user.model.js';
import mongoose from 'mongoose';

/**
 * Get all time entries for a task
 */
export const getTimeEntries = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;
    
    // Verify task exists
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ 
        success: false,
        message: 'Task not found' 
      });
    }
    
    // Check if user has access to the project
    const project = await Project.findById(task.project);
    
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }
    
    const isMember = project.members.some(m => m.user.equals(userId)) || 
                   project.createdBy.equals(userId);
                   
    if (!isMember) {
      return res.status(403).json({ 
        success: false,
        message: 'You do not have access to this task' 
      });
    }
    
    // Get time entries for the task
    const timeEntries = await TimeEntry.find({ 
      taskId: mongoose.Types.ObjectId(taskId) 
    })
    .populate('userId', 'username email avatar')
    .sort({ startTime: -1 });
    
    // Calculate total time
    const totalMs = timeEntries.reduce((total, entry) => total + (entry.durationMs || 0), 0);
    
    return res.status(200).json({
      success: true,
      timeEntries,
      totalTime: {
        totalMs,
        totalMinutes: Math.round(totalMs / 60000),
        totalHours: Math.round((totalMs / 3600000) * 100) / 100
      }
    });
  } catch (error) {
    console.error('Error in getTimeEntries:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving time entries',
      error: error.message
    });
  }
};

/**
 * Start time tracking for a task
 */
export const startTimeTracking = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid task ID' 
      });
    }
    
    // Verify task exists
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ 
        success: false,
        message: 'Task not found' 
      });
    }
    
    // Check if user has access to the project
    const project = await Project.findById(task.project);
    
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }
    
    const isMember = project.members.some(m => m.user.equals(userId)) || 
                   project.createdBy.equals(userId);
                   
    if (!isMember) {
      return res.status(403).json({ 
        success: false,
        message: 'You do not have access to this task' 
      });
    }
    
    // Check if user already has an active time tracking session for any task
    const activeTracking = await TimeEntry.findOne({
      userId,
      endTime: { $exists: false }
    });
    
    if (activeTracking) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active time tracking session. Please stop it before starting a new one.'
      });
    }
    
    // Create new time entry
    const timeEntry = new TimeEntry({
      taskId,
      userId,
      projectId: task.project,
      startTime: new Date()
    });
    
    await timeEntry.save();
    
    // Update task status to "In Progress" if not already
    if (task.status !== 'In Progress') {
      task.status = 'In Progress';
      await task.save();
      
      // Add activity to project with task status change
      await project.addActivity(
        'time_tracking_started',
        `Time tracking started on task "${task.title}"`, 
        userId
      );
    }
    
    return res.status(201).json({
      success: true,
      message: 'Time tracking started successfully',
      timeEntry
    });
  } catch (error) {
    console.error('Error in startTimeTracking:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while starting time tracking',
      error: error.message
    });
  }
};

/**
 * Stop time tracking for a task
 */
export const stopTimeTracking = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { notes } = req.body;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid task ID' 
      });
    }
    
    // Find active time entry for the user and task
    const timeEntry = await TimeEntry.findOne({
      taskId,
      userId,
      endTime: { $exists: false }
    });
    
    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'No active time tracking session found for this task'
      });
    }
    
    // Update time entry with end time and notes
    timeEntry.endTime = new Date();
    if (notes) {
      timeEntry.notes = notes;
    }
    
    // Calculate duration
    timeEntry.calculateDuration();
    await timeEntry.save();
    
    // Get task and project for activity log
    const task = await Task.findById(taskId);
    if (task) {
      // Update task's actual hours
      const totalHours = timeEntry.durationHours;
      task.actualHours = (task.actualHours || 0) + totalHours;
      await task.save();
      
      // Recalculate task health
      await task.calculateHealth();
      
      // Log activity
      const project = await Project.findById(task.project);
      if (project) {
        const hours = Math.floor(timeEntry.durationMinutes / 60);
        const minutes = timeEntry.durationMinutes % 60;
        
        await project.addActivity(
          'time_tracking_stopped',
          `Time tracking stopped on task "${task.title}" (${hours}h ${minutes}m)`,
          userId
        );
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Time tracking stopped successfully',
      timeEntry
    });
  } catch (error) {
    console.error('Error in stopTimeTracking:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while stopping time tracking',
      error: error.message
    });
  }
};

/**
 * Update a time entry
 */
export const updateTimeEntry = async (req, res) => {
  try {
    const { taskId, entryId } = req.params;
    const { notes, startTime, endTime } = req.body;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(entryId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ID format' 
      });
    }
    
    // Find the time entry
    const timeEntry = await TimeEntry.findOne({
      _id: entryId,
      taskId,
      userId
    });
    
    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found or you do not have access to modify it'
      });
    }
    
    // Update fields if provided
    if (notes !== undefined) {
      timeEntry.notes = notes;
    }
    
    // Only allow changing times if the entry is completed (has endTime)
    if (timeEntry.endTime) {
      let oldDuration = timeEntry.durationMs;
      
      if (startTime) {
        timeEntry.startTime = new Date(startTime);
      }
      
      if (endTime) {
        timeEntry.endTime = new Date(endTime);
      }
      
      // Recalculate duration if start or end time changed
      if (startTime || endTime) {
        timeEntry.calculateDuration();
        
        // Update task's actual hours based on the change in duration
        if (timeEntry.durationMs !== oldDuration) {
          const task = await Task.findById(taskId);
          if (task) {
            const hoursDifference = (timeEntry.durationMs - oldDuration) / 3600000;
            task.actualHours = (task.actualHours || 0) + hoursDifference;
            await task.save();
            
            // Recalculate task health
            await task.calculateHealth();
          }
        }
      }
    }
    
    await timeEntry.save();
    
    return res.status(200).json({
      success: true,
      message: 'Time entry updated successfully',
      timeEntry
    });
  } catch (error) {
    console.error('Error in updateTimeEntry:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating time entry',
      error: error.message
    });
  }
};

/**
 * Delete a time entry
 */
export const deleteTimeEntry = async (req, res) => {
  try {
    const { taskId, entryId } = req.params;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(entryId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ID format' 
      });
    }
    
    // Find the time entry first to get its duration for task hour adjustment
    const timeEntry = await TimeEntry.findOne({
      _id: entryId,
      taskId,
      userId
    });
    
    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found or you do not have access to delete it'
      });
    }
    
    // If the entry has a duration, update the task's actual hours
    if (timeEntry.durationMs && timeEntry.endTime) {
      const task = await Task.findById(taskId);
      if (task) {
        const hoursToSubtract = timeEntry.durationMs / 3600000;
        task.actualHours = Math.max(0, (task.actualHours || 0) - hoursToSubtract);
        await task.save();
        
        // Recalculate task health
        await task.calculateHealth();
      }
    }
    
    // Delete the time entry
    await TimeEntry.deleteOne({ _id: entryId });
    
    return res.status(200).json({
      success: true,
      message: 'Time entry deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteTimeEntry:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting time entry',
      error: error.message
    });
  }
};

/**
 * Get time reports for a project
 */
export const getProjectTimeReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate, userId } = req.query;
    const currentUserId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid project ID' 
      });
    }
    
    // Check if user has access to the project
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }
    
    const isMember = project.members.some(m => m.user.equals(currentUserId)) || 
                   project.createdBy.equals(currentUserId);
                   
    if (!isMember) {
      return res.status(403).json({ 
        success: false,
        message: 'You do not have access to this project' 
      });
    }
    
    // Build query
    const query = {
      projectId,
      endTime: { $exists: true } // Only include completed time entries
    };
    
    // Add date filters if provided
    if (startDate || endDate) {
      query.startTime = {};
      
      if (startDate) {
        query.startTime.$gte = new Date(startDate);
      }
      
      if (endDate) {
        query.startTime.$lte = new Date(endDate);
      }
    }
    
    // Add user filter if provided
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.userId = mongoose.Types.ObjectId(userId);
    }
    
    // Get time entries
    const timeEntries = await TimeEntry.find(query)
      .populate('taskId', 'title')
      .populate('userId', 'username email avatar')
      .sort({ startTime: -1 });
    
    // Calculate summary statistics
    const totalTimeMs = timeEntries.reduce((total, entry) => {
      return total + entry.durationMs;
    }, 0);
    
    // Group by user
    const userSummary = {};
    timeEntries.forEach(entry => {
      const userId = entry.userId._id.toString();
      if (!userSummary[userId]) {
        userSummary[userId] = {
          user: entry.userId,
          totalTimeMs: 0,
          entryCount: 0
        };
      }
      userSummary[userId].totalTimeMs += entry.durationMs;
      userSummary[userId].entryCount += 1;
    });
    
    // Group by task
    const taskSummary = {};
    timeEntries.forEach(entry => {
      const taskId = entry.taskId._id.toString();
      if (!taskSummary[taskId]) {
        taskSummary[taskId] = {
          task: entry.taskId,
          totalTimeMs: 0,
          entryCount: 0
        };
      }
      taskSummary[taskId].totalTimeMs += entry.durationMs;
      taskSummary[taskId].entryCount += 1;
    });
    
    return res.status(200).json({
      success: true,
      timeEntries,
      summary: {
        totalTimeMs,
        totalHours: Math.round(totalTimeMs / 3600000 * 10) / 10, // Round to 1 decimal
        entryCount: timeEntries.length,
        userSummary: Object.values(userSummary),
        taskSummary: Object.values(taskSummary)
      }
    });
  } catch (error) {
    console.error('Error in getProjectTimeReport:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving project time report',
      error: error.message
    });
  }
};

/**
 * Get time reports for a user across all projects
 */
export const getUserTimeReport = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, projectId } = req.query;
    const currentUserId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID' 
      });
    }
    
    // Verify access (only allow users to see their own reports or admins to see any)
    const user = await User.findById(currentUserId);
    if (userId !== currentUserId.toString() && (!user || !user.isAdmin)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own time reports'
      });
    }
    
    // Build query
    const query = {
      userId,
      endTime: { $exists: true } // Only include completed time entries
    };
    
    // Add date filters if provided
    if (startDate || endDate) {
      query.startTime = {};
      
      if (startDate) {
        query.startTime.$gte = new Date(startDate);
      }
      
      if (endDate) {
        query.startTime.$lte = new Date(endDate);
      }
    }
    
    // Add project filter if provided
    if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
      query.projectId = mongoose.Types.ObjectId(projectId);
    }
    
    // Get time entries
    const timeEntries = await TimeEntry.find(query)
      .populate('taskId', 'title')
      .populate('projectId', 'title')
      .sort({ startTime: -1 });
    
    // Calculate summary statistics
    const totalTimeMs = timeEntries.reduce((total, entry) => {
      return total + entry.durationMs;
    }, 0);
    
    // Group by project
    const projectSummary = {};
    timeEntries.forEach(entry => {
      if (!entry.projectId) return; // Skip if project is missing
      
      const projectId = entry.projectId._id.toString();
      if (!projectSummary[projectId]) {
        projectSummary[projectId] = {
          project: entry.projectId,
          totalTimeMs: 0,
          entryCount: 0
        };
      }
      projectSummary[projectId].totalTimeMs += entry.durationMs;
      projectSummary[projectId].entryCount += 1;
    });
    
    // Group by task
    const taskSummary = {};
    timeEntries.forEach(entry => {
      if (!entry.taskId) return; // Skip if task is missing
      
      const taskId = entry.taskId._id.toString();
      if (!taskSummary[taskId]) {
        taskSummary[taskId] = {
          task: entry.taskId,
          projectId: entry.projectId?._id,
          totalTimeMs: 0,
          entryCount: 0
        };
      }
      taskSummary[taskId].totalTimeMs += entry.durationMs;
      taskSummary[taskId].entryCount += 1;
    });
    
    // Group by day
    const dailySummary = {};
    timeEntries.forEach(entry => {
      const day = new Date(entry.startTime).toISOString().split('T')[0];
      if (!dailySummary[day]) {
        dailySummary[day] = {
          date: day,
          totalTimeMs: 0,
          entryCount: 0
        };
      }
      dailySummary[day].totalTimeMs += entry.durationMs;
      dailySummary[day].entryCount += 1;
    });
    
    return res.status(200).json({
      success: true,
      timeEntries,
      summary: {
        totalTimeMs,
        totalHours: Math.round(totalTimeMs / 3600000 * 10) / 10, // Round to 1 decimal
        entryCount: timeEntries.length,
        projectSummary: Object.values(projectSummary),
        taskSummary: Object.values(taskSummary),
        dailySummary: Object.values(dailySummary).sort((a, b) => a.date.localeCompare(b.date))
      }
    });
  } catch (error) {
    console.error('Error in getUserTimeReport:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving user time report',
      error: error.message
    });
  }
};