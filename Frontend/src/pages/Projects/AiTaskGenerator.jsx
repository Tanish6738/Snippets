// AI Task Generator Page
import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, Button, TextField, Select,
  MenuItem, FormControl, InputLabel, Divider, Card, CardContent,
  CircularProgress, Chip, Grid, Paper, List, ListItem, ListItemText, 
  ListItemIcon, Stepper, Step, StepLabel,
  Alert, Accordion, AccordionSummary, AccordionDetails, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
  FormHelperText 
} from '@mui/material'; // Assuming you're using Material UI
// Import icons from react-icons/md
import { 
  MdAdd,
  MdExpandMore,
  MdPlayArrow,
  MdEdit,
  MdDelete,
  MdRefresh,
  MdArrowForward,
  MdCloud,
  MdCheckCircle,
  MdWarning
} from 'react-icons/md'; 
import aiTaskService from '../../services/aiTaskService';
// Import specific functions using named imports
import * as projectService from '../../services/projectService'; 
import { Link } from 'react-router-dom';

const AiTaskGenerator = () => {
  // State management
  const [step, setStep] = useState(1); // For the wizard steps
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [mode, setMode] = useState('new'); // 'new' or 'existing'
  
  // Project data
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDescription, setProjectDescription] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectType, setProjectType] = useState('Standard');
  
  // Task data
  const [existingTasks, setExistingTasks] = useState([]);
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [taskInput, setTaskInput] = useState('');
  const [taskAction, setTaskAction] = useState('create'); // 'create', 'update', 'breakdown'
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Advanced features
  const [generateDependencies, setGenerateDependencies] = useState(true);
  const [taskVisualization, setTaskVisualization] = useState('list'); // 'list', 'kanban', 'gantt'
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Load projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        // Use the correct function to fetch projects
        const response = await projectService.getUserProjects();
        // Defensive: handle both {projects: [...]} and {data: {projects: [...]}} 
        const projectsList = response.projects || response.data?.projects || [];
        setProjects(projectsList);
        setLoading(false);
      } catch (err) {
        setError('Failed to load projects. Please try again.');
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);
  
  // Load existing tasks when a project is selected
  useEffect(() => {
    if (selectedProject && mode === 'existing') {
      const fetchTasks = async () => {
        try {
          setLoading(true);
          // Assuming this function exists in your project service
          const response = await projectService.getTasksByProject(selectedProject._id);
          // Defensive: handle both {tasks: [...]} and {data: {tasks: [...]}} and fallback to []
          const tasksList = (response && (response.tasks || response.data?.tasks)) || [];
          setExistingTasks(tasksList);
          setLoading(false);
        } catch (err) {
          console.log(err);
          setError('Failed to load tasks. Please try again.');
          setLoading(false);
        }
      };
      
      fetchTasks();
    }
  }, [selectedProject, mode]);
  
  // Handle project selection
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setProjectTitle(project.title);
    setProjectDescription(project.description);
    setProjectType(project.projectType);
    setStep(2);
  };
  
  // Handle task generation for new project
  const handleGenerateNewProjectTasks = async () => {
    if (!projectDescription.trim()) {
      setError('Please enter a project description.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await aiTaskService.generateTasks(null, {
        description: projectDescription,
        projectTitle,
        projectType,
        generateDependencies
      });
      
      setGeneratedTasks(response.data.tasks);
      setSuccess('Tasks generated successfully!');
      setStep(3);
      setLoading(false);
    } catch (err) {
      setError('Failed to generate tasks. Please try again.');
      setLoading(false);
    }
  };
  
  // Handle saving generated tasks
  const handleSaveTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let projectId = selectedProject?._id;
      
      // If creating a new project, create it first
      if (mode === 'new') {
        console.log('Creating new project:', { title: projectTitle, description: projectDescription, projectType });
        
        const newProjectResponse = await projectService.createProject({
          title: projectTitle,
          description: projectDescription,
          projectType
        });
        
        console.log('Project created response:', newProjectResponse);
        
        // The response might have the project directly or nested in a 'data' or 'project' field
        // Try all possible paths to find the project ID
        if (newProjectResponse && newProjectResponse.project && newProjectResponse.project._id) {
          projectId = newProjectResponse.project._id;
        } else if (newProjectResponse && newProjectResponse.project) {
          projectId = newProjectResponse.project;
        } else if (newProjectResponse && newProjectResponse._id) {
          projectId = newProjectResponse._id;
        } else if (newProjectResponse && newProjectResponse.data && newProjectResponse.data.project && newProjectResponse.data.project._id) {
          projectId = newProjectResponse.data.project._id;
        } else {
          // If we still can't find the ID, log the entire response for debugging
          console.error('Project creation response structure:', JSON.stringify(newProjectResponse));
          throw new Error('Failed to get project ID from creation response');
        }
        
        console.log('New project ID:', projectId);
        
        // Update selectedProject state with the newly created project
        setSelectedProject({
          _id: projectId,
          title: projectTitle,
          description: projectDescription,
          projectType
        });
      }
      
      // Verify project ID exists before saving tasks
      if (!projectId) {
        throw new Error('No project ID available to save tasks');
      }
      
      console.log('Saving tasks to project:', projectId, generatedTasks);
      
      // Save the generated tasks
      const saveResponse = await aiTaskService.saveGeneratedTasks(projectId, generatedTasks);
      console.log('Tasks saved response:', saveResponse);
      
      setSuccess(mode === 'new' 
        ? 'Project and tasks created successfully!' 
        : 'Tasks added to project successfully!');
      
      setShowConfirmDialog(true);
      setLoading(false);
    } catch (err) {
      console.error('Error in handleSaveTasks:', err);
      setError(`Failed to save tasks: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  };
  
  // Handle AI action for existing project
  const handleExistingProjectAction = async () => {
    if (!taskInput.trim()) {
      setError('Please enter your task request.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      switch (taskAction) {
        case 'create':
          // Generate new tasks based on description
          response = await aiTaskService.generateTasks(selectedProject._id, {
            description: taskInput,
            projectTitle: selectedProject.title,
            projectType: selectedProject.projectType,
            generateDependencies
          });
          
          setGeneratedTasks(response.data.tasks);
          break;
          
        case 'update':
          if (!selectedTask) {
            setError('Please select a task to update.');
            setLoading(false);
            return;
          }
          
          // Get AI suggestions for task updates
          response = await aiTaskService.getTaskUpdateRecommendations(
            selectedProject._id, 
            selectedTask._id,
            { description: taskInput }
          );
          
          setGeneratedTasks([response.data.updatedTask]);
          break;
          
        case 'breakdown':
          if (!selectedTask) {
            setError('Please select a task to break down.');
            setLoading(false);
            return;
          }
          
          // Break down task into subtasks
          response = await aiTaskService.getTaskBreakdownRecommendations(
            selectedProject._id,
            selectedTask._id,
            { description: taskInput }
          );
          
          setGeneratedTasks([{
            ...selectedTask,
            subtasks: response.data.subtasks
          }]);
          break;
          
        case 'optimize':
          // Get AI suggestions for task priority optimization
          response = await aiTaskService.getTaskPriorityRecommendations(
            selectedProject._id
          );
          
          setGeneratedTasks(response.data.optimizedTasks);
          break;
          
        case 'deadlines':
          // Get AI-suggested deadline adjustments
          response = await aiTaskService.getDeadlineRecommendations(
            selectedProject._id
          );
          
          setGeneratedTasks(response.data.taskDeadlines);
          break;
          
        default:
          setError('Invalid action selected.');
          break;
      }
      
      setSuccess('AI recommendations generated!');
      setStep(3);
      setLoading(false);
    } catch (err) {
      setError('Failed to get AI recommendations. Please try again.');
      setLoading(false);
    }
  };
  
  // Handle task selection for update/breakdown
  const handleTaskSelect = (task) => {
    setSelectedTask(task);
    // If we're breaking down a task, pre-populate the input
    if (taskAction === 'breakdown') {
      setTaskInput(`Break down "${task.title}" into smaller, more manageable subtasks.`);
    } else if (taskAction === 'update') {
      setTaskInput(`Suggest improvements for the task "${task.title}".`);
    }
  };
  
  // Render task list
  const renderTaskList = (tasks, isGenerated = false) => {
    if (!tasks || tasks.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="textSecondary">
            {isGenerated ? 'No tasks generated yet.' : 'No tasks available.'}
          </Typography>
        </Box>
      );
    }
    
    const renderTask = (task, level = 0) => {
      return (
        <Box key={task._id || `new-${Math.random()}`}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 2, 
              mb: 1, 
              ml: level * 4,
              borderLeft: level > 0 ? '2px solid #1976d2' : 'none',
              bgcolor: selectedTask?._id === task._id ? 'rgba(25, 118, 210, 0.08)' : 'white'
            }}
            onClick={() => !isGenerated && handleTaskSelect(task)}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={7}>
                <Typography variant="subtitle1" fontWeight={500}>
                  {task.title}
                </Typography>
                {task.description && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    {task.description.length > 100 
                      ? `${task.description.substring(0, 100)}...` 
                      : task.description
                    }
                  </Typography>
                )}
              </Grid>
              <Grid item xs={3}>
                <Box display="flex" gap={1}>
                  <Chip 
                    size="small" 
                    label={task.priority || 'Medium'} 
                    color={task.priority === 'High' || task.priority === 'Urgent' ? 'error' : 'default'}
                  />
                  {task.status && (
                    <Chip 
                      size="small" 
                      label={task.status} 
                      color={task.status === 'Completed' ? 'success' : 
                             task.status === 'In Progress' ? 'primary' : 
                             task.status === 'Blocked' ? 'error' : 
                             'default'
                      }
                    />
                  )}
                </Box>
                {task.tags && task.tags.length > 0 && (
                  <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
                    {task.tags.slice(0, 2).map((tag, i) => (
                      <Chip key={i} label={tag} size="small" variant="outlined" />
                    ))}
                    {task.tags.length > 2 && (
                      <Chip label={`+${task.tags.length - 2}`} size="small" variant="outlined" />
                    )}
                  </Box>
                )}
              </Grid>
              <Grid item xs={2} textAlign="right">
                {task.dueDate && (
                  <Typography variant="caption" display="block">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </Typography>
                )}
                {task.estimatedHours && (
                  <Typography variant="caption" display="block">
                    Est: {task.estimatedHours}h
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Paper>
          {task.subtasks && task.subtasks.length > 0 && (
            <Box>
              {task.subtasks.map(subtask => renderTask(subtask, level + 1))}
            </Box>
          )}
        </Box>
      );
    };
    
    return (
      <Box sx={{ mt: 2 }}>
        {tasks.map(task => renderTask(task))}
      </Box>
    );
  };
  
  // Step 1: Choose mode and project
  const renderStep1 = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#e2e8f0' }}>
        Step 1: Select Project Type
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              p: 2, 
              cursor: 'pointer', 
              border: mode === 'new' ? '2px solid #38bdf8' : '1px solid rgba(226,232,240,0.2)',
              height: '100%'
            }}
            onClick={() => setMode('new')}
          >
            <CardContent>
              <Box display="flex" justifyContent="center" mb={2}>
                <MdAdd size={28} color="#38bdf8" />
              </Box>
              <Typography variant="h6" align="center" gutterBottom sx={{ color: '#f1f5f9' }}>
                Create New Project
              </Typography>
              <Typography variant="body2" align="center" sx={{ color: '#94a3b8' }}>
                Start from scratch with AI-generated tasks based on your project description.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              p: 2, 
              cursor: 'pointer', 
              border: mode === 'existing' ? '2px solid #38bdf8' : '1px solid rgba(226,232,240,0.2)',
              height: '100%'
            }}
            onClick={() => setMode('existing')}
          >
            <CardContent>
              <Box display="flex" justifyContent="center" mb={2}>
                <MdEdit size={28} color="#38bdf8" />
              </Box>
              <Typography variant="h6" align="center" gutterBottom sx={{ color: '#f1f5f9' }}>
                Use Existing Project
              </Typography>
              <Typography variant="body2" align="center" sx={{ color: '#94a3b8' }}>
                Generate new tasks, update existing ones, or optimize your project schedule.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box mt={4}>
        {mode === 'new' ? (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: '#e2e8f0' }}>
              New Project Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Project Title"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Project Type</InputLabel>
                  <Select
                    value={projectType}
                    label="Project Type"
                    onChange={(e) => setProjectType(e.target.value)}
                  >
                    <MenuItem value="Standard">Standard</MenuItem>
                    <MenuItem value="Development">Software Development</MenuItem>
                    <MenuItem value="Marketing">Marketing Campaign</MenuItem>
                    <MenuItem value="Research">Research Project</MenuItem>
                    <MenuItem value="Event">Event Planning</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Task Dependencies</InputLabel>
                  <Select
                    value={generateDependencies}
                    label="Task Dependencies"
                    onChange={(e) => setGenerateDependencies(e.target.value)}
                  >
                    <MenuItem value={true}>Generate task dependencies</MenuItem>
                    <MenuItem value={false}>No dependencies needed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Project Description"
                  placeholder="Describe your project in detail to generate relevant tasks..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  required
                />
              </Grid>
            </Grid>
            <Box mt={2}>
              <Button
                variant="contained"
                disabled={!projectTitle || !projectDescription || loading}
                onClick={handleGenerateNewProjectTasks}
                endIcon={loading ? <CircularProgress size={20} /> : <MdPlayArrow />}
              >
                Generate Tasks
              </Button>
            </Box>
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: '#e2e8f0' }}>
              Select Existing Project
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : projects.length > 0 ? (
              <Grid container spacing={2}>
                {projects.map(project => (
                  <Grid item xs={12} md={6} lg={4} key={project._id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        border: selectedProject?._id === project._id ? '2px solid #38bdf8' : '1px solid rgba(226,232,240,0.2)'
                      }}
                      onClick={() => handleProjectSelect(project)}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ color: '#f1f5f9' }}>
                          {project.title}
                        </Typography>
                        <Box display="flex" gap={1} mb={1}>
                          <Chip size="small" label={project.projectType} color="primary" />
                          <Chip 
                            size="small" 
                            label={project.status} 
                            color={project.status === 'Completed' ? 'success' : 
                                   project.status === 'In Progress' ? 'info' : 
                                   'default'} 
                          />
                        </Box>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }} noWrap>
                          {project.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info" sx={{ background: 'rgba(56,189,248,0.1)', color: '#93c5fd' }}>
                No projects found. Create a new project instead.
              </Alert>
            )}
          </Box>
        )}
      </Box>
      
      <Box mt={4} display="flex" justifyContent="space-between">
        <Button variant="outlined" disabled>Back</Button>
        <Button 
          variant="contained"
          disabled={(mode === 'new' && (!projectTitle || !projectDescription)) || 
                  (mode === 'existing' && !selectedProject) ||
                  loading}
          onClick={() => mode === 'new' ? handleGenerateNewProjectTasks() : setStep(2)}
        >
          {mode === 'new' ? 'Generate Tasks' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
  
  // Step 2: Input for task actions (for existing projects)
  const renderStep2 = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#e2e8f0' }}>
        Step 2: Choose Task Action
      </Typography>
      
      <Box mb={4}>
        <FormControl fullWidth>
          <InputLabel>What would you like to do?</InputLabel>
          <Select
            value={taskAction}
            label="What would you like to do?"
            onChange={(e) => setTaskAction(e.target.value)}
          >
            <MenuItem value="create">Create new tasks</MenuItem>
            <MenuItem value="update">Update an existing task</MenuItem>
            <MenuItem value="breakdown">Break down a task into subtasks</MenuItem>
            <MenuItem value="optimize">Optimize task priorities</MenuItem>
            <MenuItem value="deadlines">Get deadline recommendations</MenuItem>
          </Select>
          <FormHelperText>
            {taskAction === 'create' ? 'Generate new tasks based on your description' :
             taskAction === 'update' ? 'Get AI suggestions to improve a task' :
             taskAction === 'breakdown' ? 'Split a complex task into smaller subtasks' :
             taskAction === 'optimize' ? 'Reorder tasks for optimal workflow' :
             'Adjust task deadlines based on dependencies and priorities'}
          </FormHelperText>
        </FormControl>
      </Box>
      
      {(taskAction === 'update' || taskAction === 'breakdown') && (
        <Box mb={4}>
          <Typography variant="subtitle1" gutterBottom sx={{ color: '#cbd5e1' }}>
            Select a task to {taskAction === 'update' ? 'update' : 'break down'}:
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : existingTasks.length > 0 ? (
            renderTaskList(existingTasks)
          ) : (
            <Alert severity="info" sx={{ background: 'rgba(56,189,248,0.1)', color: '#93c5fd' }}>
              No tasks found in this project. Create some tasks first.
            </Alert>
          )}
        </Box>
      )}
      
      {taskAction !== 'optimize' && taskAction !== 'deadlines' && (
        <Box mb={4}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={taskAction === 'create' ? "Task Description" : taskAction === 'update' ? "Update Instructions" : "Breakdown Instructions"}
            placeholder={taskAction === 'create' ? "Describe the tasks you'd like to create..." : taskAction === 'update' ? "Describe how you'd like to update this task..." : "Describe how you'd like to break down this task..."}
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
          />
        </Box>
      )}
      
      <Box mt={4} display="flex" justifyContent="space-between">
        <Button variant="outlined" onClick={() => setStep(1)}>Back</Button>
        <Button 
          variant="contained"
          disabled={(taskAction !== 'optimize' && taskAction !== 'deadlines' && !taskInput) ||
                  ((taskAction === 'update' || taskAction === 'breakdown') && !selectedTask) ||
                  loading}
          onClick={handleExistingProjectAction}
          endIcon={loading ? <CircularProgress size={20} /> : <MdPlayArrow />}
        >
          Generate AI Recommendations
        </Button>
      </Box>
    </Box>
  );
  
  // Step 3: Review and save generated tasks
  const renderStep3 = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#e2e8f0' }}>
        Step 3: Review Generated Tasks
      </Typography>
      
      <Box mb={4}>
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : generatedTasks.length > 0 ? (
          <>
            <Alert severity="success" sx={{ mb: 2, background: 'rgba(34,197,94,0.15)', color: '#86efac' }}>
              AI has generated {generatedTasks.length} {generatedTasks.length === 1 ? 'task' : 'tasks'} based on your input.
            </Alert>
            {renderTaskList(generatedTasks, true)}
          </>
        ) : (
          <Alert severity="warning" icon={<MdWarning />} sx={{ background: 'rgba(234,179,8,0.15)', color: '#fcd34d' }}>
            No tasks were generated. Try again with a more detailed description.
          </Alert>
        )}
      </Box>
      
      <Box mt={4} display="flex" justifyContent="space-between">
        <Button 
          variant="outlined" 
          onClick={() => mode === 'new' ? setStep(1) : setStep(2)}
        >
          Back
        </Button>
        <Button 
          variant="contained"
          disabled={generatedTasks.length === 0 || loading}
          onClick={handleSaveTasks}
          endIcon={loading ? <CircularProgress size={20} /> : <MdCheckCircle />}
        >
          Save Tasks
        </Button>
      </Box>
      
      <Dialog 
        open={showConfirmDialog} 
        onClose={() => setShowConfirmDialog(false)}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.9) 100%)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(51,65,85,0.4)',
          }
        }}
      >
        <DialogTitle sx={{ color: '#f1f5f9' }}>Success!</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#e2e8f0' }}>
            {mode === 'new' 
              ? 'Your project has been created with the generated tasks.' 
              : 'The tasks have been added to your project.'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, color: '#94a3b8' }}>
            What would you like to do next?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => window.location.reload()}>Create More Tasks</Button>
          <Button
            variant="contained"
            component={Link}
            to={`/projects/${selectedProject?._id || 'new'}`}
            onClick={() => setShowConfirmDialog(false)}
          >
            Go to Project
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
  
  return (
    <Container maxWidth="lg" sx={{
      position: 'relative',
      py: { xs: 3, md: 6 },
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, rgba(15,23,42,0.99) 0%, rgba(30,41,59,0.95) 100%)',
      borderRadius: { xs: 0, md: 2 },
      overflow: 'hidden',
      mt: { xs: 0, md: 2 },
      mb: { xs: 0, md: 2 },
      fontFamily: `'Inter', 'Plus Jakarta Sans', 'SF Pro Display', 'Segoe UI', sans-serif`,
      zIndex: 1,
    }}>
      {/* Premium Background Elements */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: -1,
      }}>
        {/* Dark Mesh Gradient */}
        <Box sx={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '70%',
          height: '70%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, rgba(30,58,138,0.03) 50%, rgba(15,23,42,0) 70%)',
          filter: 'blur(40px)',
        }} />
        
        {/* Accent Gradient */}
        <Box sx={{
          position: 'absolute',
          bottom: '-30%',
          left: '-10%',
          width: '60%',
          height: '60%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,70,229,0.06) 0%, rgba(124,58,237,0.03) 50%, rgba(15,23,42,0) 70%)',
          filter: 'blur(45px)',
        }} />
        
        {/* Subtle Grid Pattern */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.4,
          backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(to right, #334155 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      </Box>

      {/* Enterprise Brand Header */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 800,
          mb: { xs: 3, md: 4 },
          position: 'relative',
        }}
      >
        {/* Premium Badge */}
        <Box sx={{
          position: 'absolute',
          top: { xs: -6, md: -10 },
          right: { xs: 10, md: -30 },
          zIndex: 2,
          transform: 'rotate(20deg)',
          display: { xs: 'none', md: 'block' }
        }}>
          <Box sx={{
            px: 2,
            py: 0.5,
            borderRadius: '20px',
            border: '1px solid rgba(99,102,241,0.3)',
            background: 'rgba(30,41,59,0.8)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 24px -2px rgba(56,189,248,0.18)',
            fontWeight: 600,
            fontSize: '0.75rem',
            color: '#a5b4fc',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            Enterprise
          </Box>
        </Box>

        {/* Main Title with Professional Typography */}
        <Box sx={{ position: 'relative', mb: 1.5 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              fontSize: { xs: '2.4rem', sm: '3rem', md: '3.5rem' },
              textAlign: { xs: 'center', md: 'left' },
              background: 'linear-gradient(90deg, #e0f2fe 10%, #bfdbfe 35%, #c7d2fe 60%, #ddd6fe 85%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.3))',
            }}
          >
            <Box component="span" sx={{ display: 'inline-block', position: 'relative' }}>
              AI Task Generator
              <Box 
                sx={{
                  position: 'absolute',
                  height: '6px',
                  width: '45%',
                  bottom: '-4px',
                  left: '5%',
                  background: 'linear-gradient(90deg, rgba(56,189,248,0.7) 0%, rgba(99,102,241,0.5) 100%)',
                  borderRadius: '3px',
                  filter: 'blur(2px)',
                }}
              />
            </Box>
          </Typography>
        </Box>

        {/* Professional Subtitle */}
        <Typography 
          variant="h6" 
          sx={{
            color: '#94a3b8',
            fontWeight: 400,
            fontSize: { xs: '1.05rem', md: '1.2rem' },
            lineHeight: 1.5,
            mb: 2,
            maxWidth: '800px',
            textAlign: { xs: 'center', md: 'left' },
            textShadow: '0 1px 2px rgba(0,0,0,0.15)',
            letterSpacing: '0.01em',
          }}
        >
          Leverage enterprise-grade AI to transform your workflow, automate task generation, 
          and optimize your project management with precision.
        </Typography>
      </Box>

      {/* Notification Alerts with Premium Styling */}
      <Box sx={{ width: '100%', maxWidth: 800, mb: 3 }}>
        {error && (
          <Box 
            sx={{
              py: 1.5,
              px: 2.5,
              mb: 2, 
              borderRadius: 2, 
              background: 'rgba(239,68,68,0.15)', 
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(239,68,68,0.3)',
              boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05), 0 8px 16px -2px rgba(239,68,68,0.18)',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              animation: 'fadeIn 0.5s ease-out'
            }}
          >
            <Box sx={{ 
              p: 0.8, 
              borderRadius: '50%', 
              backgroundColor: 'rgba(239,68,68,0.2)',
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <MdWarning size={20} color="#f87171" />
            </Box>
            <Typography 
              sx={{ 
                fontSize: '0.95rem', 
                fontWeight: 500, 
                color: '#fca5a5',
                flex: 1 
              }}
            >
              {error}
            </Typography>
            <IconButton 
              onClick={() => setError(null)} 
              sx={{ 
                color: '#f87171', 
                p: 0.5, 
                '&:hover': { 
                  backgroundColor: 'rgba(239,68,68,0.1)' 
                } 
              }}
            >
              <MdRefresh size={18} />
            </IconButton>
          </Box>
        )}
        
        {success && (
          <Box 
            sx={{
              py: 1.5,
              px: 2.5,
              mb: 2, 
              borderRadius: 2, 
              background: 'rgba(34,197,94,0.15)', 
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(34,197,94,0.3)',
              boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.025), 0 8px 16px -2px rgba(34,197,94,0.18)',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            <Box sx={{ 
              p: 0.8, 
              borderRadius: '50%', 
              backgroundColor: 'rgba(34,197,94,0.2)',
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <MdCheckCircle size={20} color="#4ade80" />
            </Box>
            <Typography 
              sx={{ 
                fontSize: '0.95rem', 
                fontWeight: 500, 
                color: '#86efac',
                flex: 1 
              }}
            >
              {success}
            </Typography>
            <IconButton 
              onClick={() => setSuccess(null)} 
              sx={{ 
                color: '#4ade80', 
                p: 0.5, 
                '&:hover': { 
                  backgroundColor: 'rgba(34,197,94,0.1)' 
                } 
              }}
            >
              <MdRefresh size={18} />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Professional Stepper with Premium Styling */}
      <Paper 
        elevation={0} 
        sx={{
          width: '100%',
          maxWidth: 800,
          mb: { xs: 3, md: 4 },
          p: { xs: 1.5, md: 2.5 },
          background: 'linear-gradient(180deg, rgba(30,41,59,0.85) 0%, rgba(30,41,59,0.75) 100%)',
          backdropFilter: 'blur(16px)',
          borderRadius: 3,
          border: '1px solid rgba(71,85,105,0.3)',
          boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(15,23,42,0.5), 0 8px 24px -4px rgba(15,23,42,0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Glow Effect */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: step === 1 ? '15%' : step === 2 ? '50%' : '85%',
          width: '30%',
          height: '100%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, rgba(15,23,42,0) 70%)',
          filter: 'blur(20px)',
          transition: 'left 0.3s ease-out',
          zIndex: 0,
        }} />

        <Stepper 
          activeStep={step - 1} 
          alternativeLabel={true} 
          sx={{
            position: 'relative',
            zIndex: 2,
            '& .MuiStepLabel-label': {
              fontWeight: 600,
              fontSize: { xs: '0.9rem', md: '1.1rem' },
              mt: 1,
              color: '#cbd5e1',
              transition: 'color 0.3s ease',
              '&.Mui-active': {
                color: '#e2e8f0',
                fontWeight: 700,
                textShadow: '0 0 20px rgba(56,189,248,0.3)'
              },
              '&.Mui-completed': {
                color: '#94a3b8'
              }
            },
            '& .MuiStepIcon-root': {
              fontSize: { xs: '1.75rem', md: '2rem' },
              color: 'rgba(51,65,85,0.8)',
              transition: 'all 0.3s ease',
              filter: 'drop-shadow(0 2px 1px rgba(15,23,42,0.5))',
              '&.Mui-active': { 
                color: '#0ea5e9',
                filter: 'drop-shadow(0 0 10px rgba(56,189,248,0.5))'
              },
              '&.Mui-completed': { 
                color: '#4ade80',
              },
            },
            '& .MuiStepConnector-root': {
              marginTop: { xs: 1, md: 1.25 }
            },
            '& .MuiStepConnector-line': {
              borderColor: 'rgba(71,85,105,0.4)',
              borderTopWidth: 2,
              transition: 'border-color 0.3s ease'
            },
            '& .Mui-active .MuiStepConnector-line': {
              borderColor: 'rgba(56,189,248,0.4)'
            },
            '& .Mui-completed .MuiStepConnector-line': {
              borderColor: 'rgba(74,222,128,0.4)'
            },
          }}
        >
          <Step>
            <StepLabel>Define Project</StepLabel>
          </Step>
          <Step>
            <StepLabel>
              {mode === 'new' ? 'Generate Tasks' : 'Configure AI'}
            </StepLabel>
          </Step>
          <Step>
            <StepLabel>Deploy & Integrate</StepLabel>
          </Step>
        </Stepper>
      </Paper>

      {/* Main Content Card with Premium Glass Effect */}
      <Paper 
        elevation={0} 
        sx={{
          width: '100%',
          maxWidth: 800,
          p: { xs: 2.5, md: 4 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.9) 100%)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(51,65,85,0.4)',
          boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.025), 0 0 0 1px rgba(15,23,42,0.5), 0 20px 40px -8px rgba(0,0,0,0.5)',
          mb: { xs: 3, md: 6 },
          minHeight: { xs: 350, md: 450 },
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Gradient Accent Overlay */}
        <Box sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(to top, rgba(15,23,42,0.7) 0%, rgba(15,23,42,0) 100%)',
          zIndex: 0,
        }} />

        {/* Main Content Body with Professional Spacing */}
        <Box sx={{ position: 'relative', zIndex: 1, flex: 1 }}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </Box>
      </Paper>

      {/* Enterprise Brand Footer */}
      <Box 
        sx={{ 
          width: '100%', 
          maxWidth: 800, 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: { xs: 1, md: 2 },
          opacity: 0.7,
          mb: 1
        }}
      >
        <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
          © 2025 CodeArc Enterprise ⋅ v3.2.1
        </Typography>
        <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
          Enterprise AI Solutions
        </Typography>
      </Box>

      {/* Professional Global Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Premium Input Styling */
        .MuiInputBase-root, .MuiOutlinedInput-root {
          background: rgba(30,41,59,0.5) !important;
          color: #e2e8f0 !important;
          border-radius: 12px !important;
          backdrop-filter: blur(4px);
          box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.1);
          transition: all 0.2s ease;
          font-weight: 500;
        }
        
        .MuiInputBase-root:hover {
          background: rgba(30,41,59,0.7) !important;
        }
        
        .MuiInputLabel-root {
          color: #94a3b8 !important;
          font-weight: 500;
          letter-spacing: 0.01em;
        }
        
        .MuiOutlinedInput-notchedOutline {
          border-color: rgba(71,85,105,0.5) !important;
          transition: all 0.2s ease;
        }
        
        .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
          border-color: rgba(99,102,241,0.5) !important;
        }
        
        .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
          border-width: 1.5px !important;
          border-color: rgba(99,102,241,0.7) !important;
          box-shadow: 0 0 0 4px rgba(99,102,241,0.2);
        }
        
        .MuiFormHelperText-root {
          color: #94a3b8 !important;
          margin-top: 6px !important;
          font-size: 0.75rem !important;
          font-weight: 500;
        }
        
        /* Premium Button Styling */
        .MuiButton-contained {
          background: linear-gradient(135deg, #38bdf8 0%, #6366f1 100%) !important;
          color: white !important;
          font-weight: 600 !important;
          letter-spacing: 0.01em !important;
          text-transform: none !important;
          padding: 10px 22px !important;
          box-shadow: 0 0 0 1px rgba(16,24,40,0.1), 0 4px 8px -2px rgba(16,24,40,0.1), 0 0 0 4px rgba(56,189,248,0.08) !important;
          border-radius: 12px !important;
          transition: all 0.2s ease !important;
          position: relative !important;
          overflow: hidden !important;
          font-size: 0.95rem !important;
        }
        
        .MuiButton-contained:hover {
          background: linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%) !important;
          box-shadow: 0 0 0 1px rgba(16,24,40,0.1), 0 6px 12px -2px rgba(16,24,40,0.2), 0 0 0 4px rgba(56,189,248,0.16) !important;
          transform: translateY(-1px) !important;
        }
        
        .MuiButton-contained:active {
          transform: translateY(0px) !important;
        }
        
        .MuiButton-contained::after {
          content: '';
          position: absolute;
          top: 0;
          left: -50%;
          width: 150%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: skewX(-20deg);
          transition: 0.7s;
          opacity: 0;
        }
        
        .MuiButton-contained:hover::after {
          left: 100%;
          opacity: 1;
        }
        
        .MuiButton-contained:disabled {
          background: linear-gradient(135deg, rgba(56,189,248,0.2) 0%, rgba(99,102,241,0.2) 100%) !important;
          color: rgba(226,232,240,0.5) !important;
        }

        .MuiButton-outlined {
          border: 1px solid rgba(71,85,105,0.5) !important;
          color: #94a3b8 !important;
          font-weight: 600 !important;
          letter-spacing: 0.01em !important;
          text-transform: none !important;
          padding: 10px 22px !important;
          border-radius: 12px !important;
          background: rgba(30,41,59,0.2) !important;
          backdrop-filter: blur(4px) !important;
          transition: all 0.2s ease !important;
          font-size: 0.95rem !important;
        }
        
        .MuiButton-outlined:hover {
          border: 1px solid rgba(99,102,241,0.5) !important;
          background: rgba(30,41,59,0.4) !important;
          color: #e2e8f0 !important;
        }
        
        /* Premium Card Styling */
        .MuiCard-root {
          background: linear-gradient(135deg, rgba(30,41,59,0.5) 0%, rgba(15,23,42,0.5) 100%) !important;
          border: 1px solid rgba(51,65,85,0.4) !important;
          box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(15,23,42,0.1), 0 10px 20px -5px rgba(15,23,42,0.4) !important;
          backdrop-filter: blur(12px) !important;
          border-radius: 16px !important;
          overflow: hidden !important;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
        }
        
        .MuiCard-root:hover {
          box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.1), 0 0 0 1px rgba(15,23,42,0.1), 0 12px 24px -6px rgba(15,23,42,0.5) !important;
          transform: translateY(-2px) !important;
          border-color: rgba(71,85,105,0.7) !important;
        }
        
        .MuiCardContent-root {
          padding: 20px !important;
        }
        
        /* Premium Chip Styling */
        .MuiChip-root {
          font-weight: 600 !important;
          letter-spacing: 0.01em !important;
          height: 28px !important;
          border-radius: 8px !important;
          backdrop-filter: blur(4px) !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
        }
        
        .MuiChip-colorPrimary {
          background: rgba(56,189,248,0.2) !important;
          color: #7dd3fc !important;
        }
        
        .MuiChip-colorSuccess {
          background: rgba(34,197,94,0.2) !important;
          color: #86efac !important;
        }
        
        .MuiChip-colorError {
          background: rgba(239,68,68,0.2) !important;
          color: #fca5a5 !important;
        }
        
        /* Premium Select Styling */
        .MuiSelect-select {
          padding: 12px 16px !important;
        }
        
        /* Scrollbar Styling */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(15,23,42,0.3);
          border-radius: 6px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(71,85,105,0.4);
          border-radius: 6px;
          border: 2px solid rgba(15,23,42,0.3);
          transition: all 0.2s ease;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(99,102,241,0.5);
        }
        
        /* Paper Styling for cards and containers */
        .MuiPaper-root {
          font-family: 'Inter', 'Plus Jakarta Sans', 'SF Pro Display', 'Segoe UI', sans-serif !important;
          letter-spacing: -0.01em !important;
        }
      `}</style>
    </Container>
  );
};

export default AiTaskGenerator;