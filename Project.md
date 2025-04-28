# Advanced Project Management System

This document provides an overview of the exclusive features in our advanced project management system, highlighting capabilities that set our solution apart from others, along with testing guides for API endpoints.

## Table of Contents
1. [System Overview](#system-overview)
2. [Exclusive Features](#exclusive-features)
   - [Task Dependencies](#task-dependencies)
   - [Time Tracking](#time-tracking)
   - [Task Health Analysis](#task-health-analysis)
   - [Recurring Tasks](#recurring-tasks)
   - [Task Cloning](#task-cloning)
   - [Version History](#version-history)
3. [AI-Powered Task Management](#ai-powered-task-management)
   - [Smart Task Generation](#smart-task-generation)
   - [Project Health Insights](#project-health-insights)
   - [Recurring Task Recommendations](#recurring-task-recommendations)
4. [Project Types and Visibility](#project-types-and-visibility)
5. [API Testing Guide with Postman](#api-testing-guide-with-postman)
6. [Detailed Postman Collection Setup for Testing](#detailed-postman-collection-setup-for-testing)

## System Overview

Our project management system offers a comprehensive solution for teams to manage projects, tasks, and collaboration. Beyond the standard project management capabilities, we've implemented several exclusive features that provide enhanced control, visibility, and efficiency.

## Exclusive Features

### Task Dependencies

Task dependencies allow you to create complex workflows where tasks depend on the completion of others, ensuring work is done in the right sequence.

#### Types of Dependencies:

- **Finish-to-Start**: The dependent task can only start after the prerequisite task is completed
- **Start-to-Start**: The dependent task can only start after the prerequisite task has started
- **Finish-to-Finish**: The dependent task can only finish after the prerequisite task is completed
- **Start-to-Finish**: The dependent task can only finish after the prerequisite task has started

#### Key Capabilities:

- Automatic task blocking when dependencies aren't met
- Circular dependency prevention
- Visual indicators for blocked tasks
- Delay settings between dependent tasks

#### Testing Endpoints:

```
POST /api/tasks/{taskId}/dependencies/{dependencyId}
DELETE /api/tasks/{taskId}/dependencies/{dependencyId}
```

### Time Tracking

The integrated time tracking system allows team members to record time spent on tasks, providing valuable data for estimations, billing, and productivity analysis.

#### Key Capabilities:

- Start/stop time tracking directly on tasks
- Automatic status changes when tracking starts
- Prevention of multiple active tracking sessions
- Notes for time entries
- Total time calculations by task, user, or project
- Activity logging with duration details

#### Testing Endpoints:

```
POST /api/tasks/{taskId}/time/start
POST /api/tasks/{taskId}/time/stop
GET /api/tasks/{taskId}/time
```

### Task Health Analysis

Automated health analysis provides real-time insights into task progress and risk, helping teams prioritize and address issues before they impact deadlines.

#### Health Status Categories:

- **On Track**: Task is progressing as expected
- **At Risk**: Task may miss deadline or is consuming more resources than estimated
- **Delayed**: Task has missed its deadline
- **Ahead**: Task is progressing faster than expected

#### Key Capabilities:

- Automatic health calculation based on multiple factors
- Health based on due dates, estimated vs. actual hours
- Project-wide health calculations for overall status
- Health trend monitoring

#### Testing Endpoints:

```
POST /api/tasks/{taskId}/health
POST /api/tasks/projects/{projectId}/health
```

### Recurring Tasks

Support for repeating tasks with flexible scheduling options allows teams to manage regular activities without manual recreation.

#### Recurrence Options:

- Daily, weekly, monthly, or yearly recurrence patterns
- Custom intervals (every X days, weeks, etc.)
- End date or occurrence limits
- Day of week selection for weekly recurrences

#### Key Capabilities:

- Template-based approach preserving task structure
- Automatic instance generation
- Modifications to individual instances without affecting the template
- Bulk generation of future instances

#### Testing Endpoints:

```
POST /api/tasks/recurring/projects/{projectId}
POST /api/tasks/recurring/generate
```

### Task Cloning

Powerful task duplication with fine-grained control allows for quick creation of similar tasks while maintaining structure.

#### Key Capabilities:

- Clone single tasks or entire task hierarchies
- Optional inclusion of subtasks, attachments, and assignments
- Date adjustment options for cloned tasks
- Customizable title for cloned tasks

#### Testing Endpoint:

```
POST /api/tasks/{taskId}/clone
```

### Version History

Complete audit trail of task changes for accountability and tracking.

#### Key Capabilities:

- History of all modifications with timestamps
- Field-level change tracking
- User attribution for changes
- Filtering by date, user, or field

## AI-Powered Task Management

Our system leverages artificial intelligence to supercharge project management workflows and improve team efficiency through intelligent automation and insights.

### Smart Task Generation

Automatically generate comprehensive task structures based on project descriptions, saving hours of manual planning work and ensuring nothing is overlooked.

#### Key Capabilities:

- Generate complete task hierarchies with proper parent-child relationships
- Create contextually appropriate tasks based on project type (Development, Marketing, Research, Event)
- Include realistic time estimates based on industry standards
- Generate appropriate priorities and tags automatically
- Create task dependencies with intelligent relationship types and delays
- Customize the level of detail in generated task structures

#### Testing Endpoints:

```
POST /api/ai/tasks/generate
```

**Request Body:**
```json
{
  "description": "Project description text",
  "projectTitle": "Optional project title",
  "projectType": "Development|Marketing|Research|Event|Standard",
  "generateDependencies": true
}
```

### Project Health Insights

Get AI-powered analysis of your project health based on task data, helping teams identify risks and bottlenecks before they impact delivery.

#### Key Capabilities:

- Calculate overall project health status with detailed explanation
- Identify critical tasks that require immediate attention
- Generate recommendations tailored to your specific project situation
- Analyze time tracking patterns and highlight resource allocation issues
- Provide dependency analysis to identify bottlenecks in workflow

#### Testing Endpoints:

```
POST /api/ai/tasks/health/:projectId
```

**Request Body:**
```json
{
  "tasks": [
    {
      "_id": "taskId",
      "title": "Task title",
      "status": "Task status",
      "priority": "Task priority",
      "dueDate": "2025-05-15T00:00:00.000Z",
      "estimatedHours": 10,
      "timeEntries": [{...time entries data...}],
      "dependencies": [{...dependencies data...}],
      "health": {
        "status": "on-track|at-risk|delayed|ahead"
      }
    }
  ]
}
```

### Recurring Task Recommendations

Receive intelligent recommendations for recurring tasks based on your project type, ensuring consistent processes and improving team coordination.

#### Key Capabilities:

- Get project-type specific recurring task suggestions
- Receive recommended frequencies based on industry best practices
- Automatically generate descriptions and time estimates
- Smart task priority recommendations
- Contextual recommendations that consider existing project tasks

#### Testing Endpoints:

```
POST /api/ai/tasks/recurring/:projectId
```

**Request Body:**
```json
{
  "projectType": "Development|Marketing|Research|Event|Standard",
  "existingTasks": [
    {
      "title": "Existing task title",
      "description": "Existing task description"
    }
  ]
}
```

## Project Types and Visibility

Our system offers flexible project categorization and privacy options to suit various team needs.

### Project Types

- **Standard**: General purpose projects
- **Development**: Software development projects with specialized features
- **Research**: Projects focused on research and data collection
- **Marketing**: Marketing campaign projects
- **Event**: Event planning and management projects
- **Other**: Custom project types

### Visibility Options

- **Private**: Only visible to project members and creator
- **Public**: Visible to all users in the system, ideal for shared resources

## API Testing Guide with Postman

This section provides detailed guidance for testing all API endpoints in this application using Postman. The guide covers authentication, project management, task management, and all exclusive features.

### Setting Up Postman

1. **Create a New Collection**
   - Name it "Project Management API"
   - Add a description (optional)

2. **Set Up Environment Variables**
   - Create a new environment (e.g., "Development")
   - Add the following variables:
     - `base_url`: Your API base URL (e.g., `http://localhost:5000` or your deployed URL)
     - `token`: Will store the authentication token
     - `project_id`: Will store a project ID for testing
     - `member_id`: Will store a member ID for testing
     - `task_id`: Will store a task ID for testing
     - `dependency_id`: Will store a dependency task ID for testing
     - `user_id1`: Will store a user ID for member testing
     - `ai_task_id`: Will store an AI-generated task ID for testing

3. **Import the Collection**
   - You can export this collection from Postman and share it with team members

## Detailed Postman Collection Setup for Testing

This section provides step-by-step instructions on setting up a Postman collection to thoroughly test all backend API endpoints. Follow these instructions to create a complete testing environment.

### Creating Your Postman Environment

1. **Launch Postman** and click on "Environments" in the sidebar
2. **Create a new environment** named "Project Management API"
3. **Add the following variables**:
   - `base_url`: Set to your backend URL (e.g., `http://localhost:5000`)
   - `token`: Leave this empty (will be populated after login)
   - `project_id`: Leave empty
   - `task_id`: Leave empty
   - `dependency_id`: Leave empty
   - `user_id`: Leave empty
   - `member_id`: Leave empty 
4. **Save the environment** and select it from the environment dropdown

### Creating the Collection

1. Click on "Collections" in the sidebar
2. Create a new collection named "Project Management API Testing"
3. Use the "..." menu on the collection to "Add Folder"
4. Create the following folders:
   - Authentication
   - Projects
   - Tasks
   - Task Dependencies
   - Task Comments
   - Time Tracking
   - Task Health
   - Advanced Features
   - AI Features

### Authentication Endpoints

#### Register User

1. Right-click on the Authentication folder → Add Request
2. Name it "Register User"
3. Set method to **POST**
4. URL: `{{base_url}}/api/users/register`
5. Headers:
   - Content-Type: application/json
6. Body (raw JSON):
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Password123!"
}
```

#### Login

1. Add another request named "Login"
2. Set method to **POST**
3. URL: `{{base_url}}/api/users/login`
4. Headers:
   - Content-Type: application/json
5. Body (raw JSON):
```json
{
  "email": "test@example.com",
  "password": "Password123!"
}
```
6. Tests tab (to automatically save the token):
```javascript
const jsonData = pm.response.json();
if (jsonData.token) {
    pm.environment.set("token", jsonData.token);
    console.log("Token saved to environment");
} else {
    console.error("No token found in response");
}
```

### Project Management Endpoints

#### Create Project

1. Right-click on the Projects folder → Add Request
2. Name it "Create Project"
3. Set method to **POST**
4. URL: `{{base_url}}/api/projects`
5. Headers:
   - Content-Type: application/json
   - Authorization: Bearer {{token}}
6. Body (raw JSON):
```json
{
  "title": "Development Project",
  "description": "A comprehensive project management system with task dependencies and time tracking",
  "deadline": "2025-06-30T00:00:00.000Z",
  "priority": "High",
  "tags": ["development", "api", "mongodb"],
  "projectType": "Development",
  "visibility": "private",
  "initialMembers": [
    {
      "email": "teammate@example.com",
      "role": "Contributor"
    }
  ]
}
```
7. Tests tab:
```javascript
const jsonData = pm.response.json();
if (jsonData.success && jsonData.project && jsonData.project._id) {
    pm.environment.set("project_id", jsonData.project._id);
    console.log("Project ID saved: " + jsonData.project._id);
}
```

#### Get All Projects

1. Add request: "Get All Projects"
2. Method: **GET**
3. URL: `{{base_url}}/api/projects`
4. Headers:
   - Authorization: Bearer {{token}}

#### Get Project By ID

1. Add request: "Get Project By ID"
2. Method: **GET**
3. URL: `{{base_url}}/api/projects/{{project_id}}`
4. Headers:
   - Authorization: Bearer {{token}}

#### Get Project Dashboard

1. Add request: "Get Project Dashboard"
2. Method: **GET**
3. URL: `{{base_url}}/api/projects/{{project_id}}/dashboard`
4. Headers:
   - Authorization: Bearer {{token}}

#### Update Project

1. Add request: "Update Project"
2. Method: **PATCH**
3. URL: `{{base_url}}/api/projects/{{project_id}}`
4. Headers:
   - Content-Type: application/json
   - Authorization: Bearer {{token}}
5. Body (raw JSON):
```json
{
  "description": "Updated description with more details",
  "priority": "Urgent",
  "status": "In Progress",
  "tags": ["development", "api", "mongodb", "urgent"]
}
```

#### Add Project Member

1. Add request: "Add Project Member"
2. Method: **POST**
3. URL: `{{base_url}}/api/projects/{{project_id}}/members`
4. Headers:
   - Content-Type: application/json
   - Authorization: Bearer {{token}}
5. Body (raw JSON):
```json
{
  "email": "teammate@example.com",
  "role": "Contributor"
}
```
6. Tests tab:
```javascript
const jsonData = pm.response.json();
if (jsonData.success && jsonData.member && jsonData.member.user && jsonData.member.user._id) {
    pm.environment.set("member_id", jsonData.member.user._id);
    console.log("Member ID saved: " + jsonData.member.user._id);
}
```

#### Update Member Role

1. Add request: "Update Member Role"
2. Method: **PATCH**
3. URL: `{{base_url}}/api/projects/{{project_id}}/members/{{member_id}}`
4. Headers:
   - Content-Type: application/json
   - Authorization: Bearer {{token}}
5. Body (raw JSON):
```json
{
  "role": "Admin"
}
```

#### Remove Project Member

1. Add request: "Remove Project Member"
2. Method: **DELETE**
3. URL: `{{base_url}}/api/projects/{{project_id}}/members/{{member_id}}`
4. Headers:
   - Authorization: Bearer {{token}}

### Task Management Endpoints

#### Create Task

1. Right-click on the Tasks folder → Add Request
2. Name it "Create Task"
3. Method: **POST**
4. URL: `{{base_url}}/api/tasks/projects/{{project_id}}`
5. Headers:
   - Content-Type: application/json
   - Authorization: Bearer {{token}}
6. Body (raw JSON):
```json
{
  "title": "Implement Authentication System",
  "description": "Create JWT authentication system with registration, login and password reset",
  "priority": "High",
  "dueDate": "2025-05-30T00:00:00.000Z",
  "tags": ["backend", "security", "authentication"],
  "estimatedHours": 20
}
```
7. Tests tab:
```javascript
const jsonData = pm.response.json();
if (jsonData.success && jsonData.task && jsonData.task._id) {
    pm.environment.set("task_id", jsonData.task._id);
    console.log("Task ID saved: " + jsonData.task._id);
}
```

#### Create Dependency Task

1. Add request: "Create Dependency Task"
2. Method: **POST**
3. URL: `{{base_url}}/api/tasks/projects/{{project_id}}`
4. Headers:
   - Content-Type: application/json
   - Authorization: Bearer {{token}}
5. Body (raw JSON):
```json
{
  "title": "Design Database Schema",
  "description": "Create MongoDB schema for users, projects, tasks and time tracking",
  "priority": "High",
  "dueDate": "2025-05-15T00:00:00.000Z",
  "tags": ["backend", "database", "mongodb"],
  "estimatedHours": 10
}
```
6. Tests tab:
```javascript
const jsonData = pm.response.json();
if (jsonData.success && jsonData.task && jsonData.task._id) {
    pm.environment.set("dependency_id", jsonData.task._id);
    console.log("Dependency Task ID saved: " + jsonData.task._id);
}
```

#### Get Tasks By Project

1. Add request: "Get Tasks By Project"
2. Method: **GET**
3. URL: `{{base_url}}/api/tasks/projects/{{project_id}}`
4. Headers:
   - Authorization: Bearer {{token}}

#### Get Task By ID

1. Add request: "Get Task By ID"
2. Method: **GET**
3. URL: `{{base_url}}/api/tasks/{{task_id}}`
4. Headers:
   - Authorization: Bearer {{token}}

#### Update Task

1. Add request: "Update Task"
2. Method: **PATCH**
3. URL: `{{base_url}}/api/tasks/{{task_id}}`
4. Headers:
   - Content-Type: application/json
   - Authorization: Bearer {{token}}
5. Body (raw JSON):
```json
{
  "status": "In Progress",
  "description": "Updated description with more implementation details",
  "priority": "Urgent"
}
```

#### Assign Task

1. Add request: "Assign Task"
2. Method: **POST**
3. URL: `{{base_url}}/api/tasks/{{task_id}}/assign`
4. Headers:
   - Content-Type: application/json
   - Authorization: Bearer {{token}}
5. Body (raw JSON):
```json
{
  "userIds": ["{{member_id}}"]
}
```

### Task Dependencies

#### Add Task Dependency

1. Right-click on the Task Dependencies folder → Add Request
2. Name it "Add Task Dependency"
3. Method: **POST**
4. URL: `{{base_url}}/api/tasks/{{task_id}}/dependencies/{{dependency_id}}`
5. Headers:
   - Content-Type: application/json
   - Authorization: Bearer {{token}}
6. Body (raw JSON):
```json
{
  "type": "finish-to-start",
  "delay": 0
}
```

#### Remove Task Dependency

1. Add request: "Remove Task Dependency"
2. Method: **DELETE**
3. URL: `{{base_url}}/api/tasks/{{task_id}}/dependencies/{{dependency_id}}`
4. Headers:
   - Authorization: Bearer {{token}}

### Task Comments

#### Add Comment

1. Right-click on the Task Comments folder → Add Request
2. Name it "Add Comment"
3. Method: **POST**
4. URL: `{{base_url}}/api/tasks/{{task_id}}/comments`
5. Headers:
   - Content-Type: application/json
   - Authorization: Bearer {{token}}
6. Body (raw JSON):
```json
{
  "text": "We should consider using Passport.js for authentication strategies",
  "mentions": ["{{member_id}}"]
}
```

### Time Tracking

#### Start Time Tracking

1. Right-click on the Time Tracking folder → Add Request
2. Name it "Start Time Tracking"
3. Method: **POST**
4. URL: `{{base_url}}/api/tasks/{{task_id}}/time/start`
5. Headers:
   - Authorization: Bearer {{token}}

#### Stop Time Tracking

1. Add request: "Stop Time Tracking"
2. Method: **POST**
3. URL: `{{base_url}}/api/tasks/{{task_id}}/time/stop`
4. Headers:
   - Content-Type: application/json
   - Authorization: Bearer {{token}}
5. Body (raw JSON):
```json
{
  "notes": "Implemented JWT authentication middleware and token validation"
}
```

#### Get Time Entries

1. Add request: "Get Time Entries"
2. Method: **GET**
3. URL: `{{base_url}}/api/tasks/{{task_id}}/time`
4. Headers:
   - Authorization: Bearer {{token}}

### Task Health

#### Calculate Task Health

1. Right-click on the Task Health folder → Add Request
2. Name it "Calculate Task Health"
3. Method: **POST**
4. URL: `{{base_url}}/api/tasks/{{task_id}}/health`
5. Headers:
   - Authorization: Bearer {{token}}

#### Calculate Project Tasks Health

1. Add request: "Calculate Project Tasks Health"
2. Method: **POST**
3. URL: `{{base_url}}/api/tasks/projects/{{project_id}}/health`
4. Headers:
   - Authorization: Bearer {{token}}

### Advanced Features

#### Create Recurring Task

1. Right-click on the Advanced Features folder → Add Request
2. Name it "Create Recurring Task"
3. Method: **POST**
4. URL: `{{base_url}}/api/tasks/recurring/projects/{{project_id}}`
5. Headers:
   - Content-Type: application/json
   - Authorization: Bearer {{token}}
6. Body (raw JSON):
```json
{
  "title": "Weekly Team Meeting",
  "description": "Regular team sync to discuss progress and blockers",
  "priority": "Medium",
  "estimatedHours": 1,
  "recurrence": {
    "frequency": "weekly",
    "interval": 1,
    "daysOfWeek": [1],
    "occurrences": 12
  },
  "tags": ["meeting", "team", "recurring"],
  "createFirstInstance": true
}
```

#### Clone Task

1. Add request: "Clone Task"
2. Method: **POST**
3. URL: `{{base_url}}/api/tasks/{{task_id}}/clone`
4. Headers:
   - Content-Type: application/json
   - Authorization: Bearer {{token}}
5. Body (raw JSON):
```json
{
  "options": {
    "title": "Implement OAuth Authentication",
    "includeSubtasks": true,
    "includeAttachments": true,
    "includeAssignees": true
  }
}
```

### AI Features

#### Generate Tasks with AI

1. Right-click on the AI Features folder → Add Request
2. Name it "Generate Tasks with AI"
3. Method: **POST**
4. URL: `{{base_url}}/api/tasks/ai/generate/{{project_id}}`
5. Headers:
   - Content-Type: application/json
   - Authorization: Bearer {{token}}
6. Body (raw JSON):
```json
{
  "description": "Build a responsive project management web application with user authentication, project creation, task management, time tracking, and reporting features."
}
```
7. Tests tab:
```javascript
const jsonData = pm.response.json();
if (jsonData.success && jsonData.tasks) {
    pm.environment.set("generated_tasks", JSON.stringify(jsonData.tasks));
    console.log("AI-generated tasks saved to environment");
}
```

#### Save AI-Generated Tasks

1. Add request: "Save AI-Generated Tasks"
2. Method: **POST**
3. URL: `{{base_url}}/api/tasks/ai/save/{{project_id}}`
4. Headers:
   - Content-Type: application/json
   - Authorization: Bearer {{token}}
5. Body (raw JSON):
```json
{
  "tasks": {{generated_tasks}}
}
```
6. Tests tab:
```javascript
const jsonData = pm.response.json();
if (jsonData.success && jsonData.tasks && jsonData.tasks[0] && jsonData.tasks[0]._id) {
    pm.environment.set("ai_task_id", jsonData.tasks[0]._id);
    console.log("AI Task ID saved: " + jsonData.tasks[0]._id);
}
```

#### Generate Health Insights with AI

1. Add request: "Generate Health Insights"
2. Method: **POST**
3. URL: `{{base_url}}/api/ai/tasks/health/{{project_id}}`
4. Headers:
   - Content-Type: application/json
   - Authorization: Bearer {{token}}
5. Body (raw JSON):
```json
{
  "tasks": [
    {
      "_id": "{{task_id}}",
      "title": "Implement Authentication System",
      "status": "In Progress",
      "priority": "High",
      "dueDate": "2025-05-30T00:00:00.000Z",
      "estimatedHours": 20,
      "timeEntries": [{"duration": 8}],
      "dependencies": [{"task": "{{dependency_id}}"}],
      "health": {"status": "on-track"}
    },
    {
      "_id": "{{dependency_id}}",
      "title": "Design Database Schema",
      "status": "Completed",
      "priority": "High",
      "dueDate": "2025-05-15T00:00:00.000Z",
      "estimatedHours": 10,
      "timeEntries": [{"duration": 12}],
      "health": {"status": "completed"}
    }
  ]
}
```

#### Get Recurring Task Recommendations

1. Add request: "Get Recurring Task Recommendations"
2. Method: **POST**
3. URL: `{{base_url}}/api/ai/tasks/recurring/{{project_id}}`
4. Headers:
   - Content-Type: application/json
   - Authorization: Bearer {{token}}
5. Body (raw JSON):
```json
{
  "projectType": "Development",
  "existingTasks": [
    {
      "title": "Implement Authentication System",
      "description": "Create JWT authentication system with registration, login and password reset"
    },
    {
      "title": "Design Database Schema",
      "description": "Create MongoDB schema for users, projects, tasks and time tracking"
    }
  ]
}
```

## Sequential API Testing Instructions

To thoroughly test the backend API endpoints, follow this testing sequence. This will help you verify that all features are working properly while ensuring dependencies are satisfied.

### 1. Initial Setup

1. First run the **Register User** request (skip if you already have a user)
2. Run the **Login** request to get an authentication token
3. Verify in the Postman console that the token was saved to your environment

### 2. Project Management Testing

1. Run **Create Project** request
   - Verify response contains a success message and project details
   - Confirm the project_id was saved to your environment
   
2. Run **Get All Projects** request
   - Verify your new project appears in the list
   
3. Run **Get Project By ID** request
   - Confirm you can retrieve your specific project
   
4. Run **Get Project Dashboard** request
   - This should show project analytics including task status

5. Run **Add Project Member** request
   - Verify a team member was added successfully
   - Confirm the member_id was saved to environment

### 3. Task Management Testing

1. Run **Create Task** request
   - This creates your main task
   - Verify the task_id is saved to environment
   
2. Run **Create Dependency Task** request
   - This creates a task that will be a dependency for the main task
   - Verify the dependency_id is saved to environment
   
3. Run **Get Tasks By Project** request
   - Confirm both tasks appear in the project
   
4. Run **Add Task Dependency** request
   - This establishes the dependency relationship

5. Run **Get Task By ID** on the main task
   - Verify that the dependency appears in the task's dependencies array

6. Run **Assign Task** request
   - This assigns the main task to a team member

### 4. Time Tracking Testing

1. Run **Start Time Tracking** on the dependency task
   - Verify time tracking started successfully

2. Wait a minute or two to simulate work time
   
3. Run **Stop Time Tracking** request
   - Verify time entry was completed with duration
   
4. Run **Get Time Entries** request
   - Confirm the completed time entry appears with the right duration and notes

### 5. Health Analysis Testing

1. Run **Calculate Task Health** on the main task
   - Verify health status is calculated

2. Run **Calculate Project Tasks Health**
   - This calculates health for all tasks in the project

### 6. Advanced Features Testing

1. Run **Create Recurring Task** request
   - Verify the recurring task template and first instance were created
   
2. Run **Clone Task** request
   - Verify a new cloned task was created with the specified options
   
3. Run **Update Task** on the dependency task
   - Set status to "Completed" to satisfy the dependency

4. Run **Add Comment** to the main task
   - Verify comment was added with proper mention

### 7. AI Features Testing

1. Run **Generate Tasks with AI** request
   - Verify AI-generated task structures are returned
   - Confirm the generated_tasks are saved to environment
   
2. Run **Save AI-Generated Tasks** request
   - Verify the tasks were saved to the database
   
3. Run **Generate Health Insights with AI** request
   - Verify project health analysis is provided
   
4. Run **Get Recurring Task Recommendations** request
   - Verify AI suggests appropriate recurring tasks for your project type

### 8. Project Updates Testing

1. Run **Update Project** request
   - Verify project details are updated
   
2. Run **Update Member Role** request
   - Verify team member's role is updated

### 9. API Test Completion (Optional)

1. Run **Remove Project Member** request (optional)
   - Verify member was removed from project
   
2. Run **Delete Task** on one of the AI-generated tasks (optional)
   - Verify task was deleted successfully

### Suggested Timeline for Testing

For a comprehensive test of all backend functionality, allow approximately 30-45 minutes. This will give you time to examine responses, verify data consistency, and ensure everything is working properly.

1. **Authentication & Project Setup**: 5 minutes
2. **Task Creation & Dependency Setup**: 10 minutes
3. **Time Tracking & Health Analysis**: 5 minutes
4. **Advanced Features**: 10 minutes
5. **AI Features**: 10 minutes
6. **Project Updates & Cleanup**: 5 minutes

## Common Testing Issues and Solutions

### Authentication Problems

**Issue**: Token not recognized or 401 errors
**Solution**: 
- Check that the token was saved correctly to environment
- Try logging in again to refresh the token
- Verify token format in Authorization header (should be `Bearer [token]`)

### Task Creation Issues

**Issue**: Cannot create task in project
**Solution**:
- Verify project_id is correct
- Ensure you have sufficient permissions (Admin or Contributor role)
- Check that all required fields are provided (title is mandatory)

### Task Dependencies

**Issue**: Cannot add dependency between tasks
**Solution**:
- Make sure both tasks exist and IDs are correct
- Verify tasks are in the same project
- Check for circular dependency issues (task1 → task2 → task3 → task1)

### Time Tracking

**Issue**: Cannot stop time tracking
**Solution**:
- Verify you started tracking on the same task
- Check that you're using the same user account that started tracking
- Ensure backend server hasn't restarted (which might reset active tracking)

### AI Feature Issues

**Issue**: AI-generated tasks not saving
**Solution**:
- Check that the generated_tasks variable was properly set
- Verify the JSON structure matches what the API expects
- Ensure you have contributor permissions on the project