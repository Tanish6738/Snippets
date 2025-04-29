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
        const newProject = await projectService.createProject({
          title: projectTitle,
          description: projectDescription,
          projectType
        });
        
        projectId = newProject.data.project._id;
      }
      
      // Save the generated tasks
      await aiTaskService.saveGeneratedTasks(projectId, generatedTasks);
      
      setSuccess(mode === 'new' 
        ? 'Project and tasks created successfully!' 
        : 'Tasks added to project successfully!');
      
      setShowConfirmDialog(true);
      setLoading(false);
    } catch (err) {
      setError('Failed to save tasks. Please try again.');
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
      <Typography variant="h6" gutterBottom>
        Step 1: Select Project Type
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              p: 2, 
              cursor: 'pointer', 
              border: mode === 'new' ? '2px solid #1976d2' : '1px solid #e0e0e0',
              height: '100%'
            }}
            onClick={() => setMode('new')}
          >
            <CardContent>
              <Box display="flex" justifyContent="center" mb={2}>
                <MdAdd size={28} color="#1976d2" /> {/* Replaced AddIcon */}
              </Box>
              <Typography variant="h6" align="center" gutterBottom>
                Create New Project
              </Typography>
              <Typography variant="body2" align="center" color="textSecondary">
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
              border: mode === 'existing' ? '2px solid #1976d2' : '1px solid #e0e0e0',
              height: '100%'
            }}
            onClick={() => setMode('existing')}
          >
            <CardContent>
              <Box display="flex" justifyContent="center" mb={2}>
                <MdEdit size={28} color="#1976d2" /> {/* Replaced EditIcon */}
              </Box>
              <Typography variant="h6" align="center" gutterBottom>
                Use Existing Project
              </Typography>
              <Typography variant="body2" align="center" color="textSecondary">
                Generate new tasks, update existing ones, or optimize your project schedule.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box mt={4}>
        {mode === 'new' ? (
          <Box>
            <Typography variant="h6" gutterBottom>
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
            <Typography variant="h6" gutterBottom>
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
                        border: selectedProject?._id === project._id ? '2px solid #1976d2' : '1px solid #e0e0e0'
                      }}
                      onClick={() => handleProjectSelect(project)}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
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
                        <Typography variant="body2" color="textSecondary" noWrap>
                          {project.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">
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
      <Typography variant="h6" gutterBottom>
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
          <Typography variant="subtitle1" gutterBottom>
            Select a task to {taskAction === 'update' ? 'update' : 'break down'}:
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : existingTasks.length > 0 ? (
            renderTaskList(existingTasks)
          ) : (
            <Alert severity="info">
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
      <Typography variant="h6" gutterBottom>
        Step 3: Review Generated Tasks
      </Typography>
      
      <Box mb={4}>
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : generatedTasks.length > 0 ? (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              AI has generated {generatedTasks.length} {generatedTasks.length === 1 ? 'task' : 'tasks'} based on your input.
            </Alert>
            {renderTaskList(generatedTasks, true)}
          </>
        ) : (
          <Alert severity="warning" icon={<MdWarning />}> {/* Replaced WarningIcon */}
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
      
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Success!</DialogTitle>
        <DialogContent>
          <Typography>
            {mode === 'new' 
              ? 'Your project has been created with the generated tasks.' 
              : 'The tasks have been added to your project.'}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          AI Task Generator
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Use AI to generate tasks, optimize schedules, and improve your project management workflow.
        </Typography>
      </Box>
      
      {/* Error and success messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)} icon={<MdWarning />}> {/* Replaced WarningIcon */}
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)} icon={<MdCheckCircle />}> {/* Replaced CheckCircleIcon */}
          {success}
        </Alert>
      )}
      
      {/* Stepper */}
      <Stepper activeStep={step - 1} sx={{ mb: 4 }}>
        <Step>
          <StepLabel>Select Project</StepLabel>
        </Step>
        <Step>
          <StepLabel>
            {mode === 'new' ? 'Generate Tasks' : 'Choose Action'}
          </StepLabel>
        </Step>
        <Step>
          <StepLabel>Review & Save</StepLabel>
        </Step>
      </Stepper>
      
      {/* Dynamic content based on current step */}
      <Paper sx={{ p: 3 }}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </Paper>
    </Container>
  );
};

export default AiTaskGenerator;