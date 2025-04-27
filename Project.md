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

3. **Import the Collection**
   - You can export this collection from Postman and share it with team members

### Authentication

Before testing any endpoints, you need to authenticate:

#### Register a User (if needed)

```
POST {{base_url}}/api/users/register
```

Headers:
```
Content-Type: application/json
```

Body:
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Password123!"
}
```

#### Login

```
POST {{base_url}}/api/users/login
```

Headers:
```
Content-Type: application/json
```

Body:
```json
{
  "email": "test@example.com",
  "password": "Password123!"
}
```

After successful login, copy the token from the response and set it to your `token` environment variable.

### Project Management

All project endpoints require authentication. Include this header in all requests:

```
Authorization: Bearer {{token}}
```

#### Create a Project

```
POST {{base_url}}/api/projects
```

Headers:
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

Basic project creation:
```json
{
  "title": "Test Project",
  "description": "This is a test project created via Postman",
  "deadline": "2025-06-30T00:00:00.000Z",
  "priority": "Medium",
  "tags": ["api", "testing", "postman"]
}
```

Project with type and visibility settings:
```json
{
  "title": "Public Development Project",
  "description": "This is a public development project created via Postman",
  "deadline": "2025-06-30T00:00:00.000Z",
  "priority": "Medium",
  "tags": ["public", "development", "postman"],
  "projectType": "Development",
  "visibility": "public"
}
```

Project with initial members:
```json
{
  "title": "Team Project",
  "description": "Project with members added during creation",
  "deadline": "2025-06-30T00:00:00.000Z",
  "priority": "High",
  "projectType": "Research",
  "visibility": "private",
  "initialMembers": [
    {
      "email": "contributor@example.com",
      "role": "Contributor"
    },
    {
      "email": "viewer@example.com",
      "role": "Viewer"
    }
  ]
}
```

**Response**: After successful creation, save the project ID from the response to your `project_id` environment variable.

**Tests**:
```javascript
// Save project ID to environment variable
var jsonData = pm.response.json();
if (jsonData.success && jsonData.project && jsonData.project._id) {
    pm.environment.set("project_id", jsonData.project._id);
}

// Verify response structure
pm.test("Response is successful", function() {
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Project has required fields", function() {
    pm.expect(jsonData.project).to.have.property("title");
    pm.expect(jsonData.project).to.have.property("description");
    pm.expect(jsonData.project).to.have.property("createdBy");
    pm.expect(jsonData.project).to.have.property("members");
    
    // Check new fields
    if (pm.request.body) {
        const requestBody = JSON.parse(pm.request.body.raw);
        if (requestBody.projectType) {
            pm.expect(jsonData.project.projectType).to.equal(requestBody.projectType);
        }
        if (requestBody.visibility) {
            pm.expect(jsonData.project.visibility).to.equal(requestBody.visibility);
        }
    }
});
```

### Task Management with Exclusive Features

#### Create a Task

```
POST {{base_url}}/api/tasks/projects/{{project_id}}
```

Headers:
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

Body:
```json
{
  "title": "Test Task",
  "description": "This is a test task created via Postman",
  "priority": "High",
  "dueDate": "2025-05-30T00:00:00.000Z",
  "tags": ["bug", "frontend", "urgent"],
  "estimatedHours": 8
}
```

**Response**: After successful creation, save the task ID from the response to your `task_id` environment variable:

```javascript
var jsonData = pm.response.json();
if (jsonData.success && jsonData.task && jsonData.task._id) {
    pm.environment.set("task_id", jsonData.task._id);
}
```

#### Create a Second Task for Dependencies

To test dependencies, create another task and save its ID to the `dependency_id` variable:

```javascript
var jsonData = pm.response.json();
if (jsonData.success && jsonData.task && jsonData.task._id) {
    pm.environment.set("dependency_id", jsonData.task._id);
}
```

#### Add Task Dependency

```
POST {{base_url}}/api/tasks/{{task_id}}/dependencies/{{dependency_id}}
```

Headers:
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

Body:
```json
{
  "type": "finish-to-start",
  "delay": 0
}
```

**Tests**:
```javascript
var jsonData = pm.response.json();

pm.test("Response is successful", function() {
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Task has dependency", function() {
    pm.expect(jsonData.task.dependencies).to.be.an("array");
    pm.expect(jsonData.task.dependencies.length).to.be.greaterThan(0);
    pm.expect(jsonData.task.dependencies[0].task._id).to.equal(pm.environment.get("dependency_id"));
});
```

#### Remove Task Dependency

```
DELETE {{base_url}}/api/tasks/{{task_id}}/dependencies/{{dependency_id}}
```

Headers:
```
Authorization: Bearer {{token}}
```

**Tests**:
```javascript
var jsonData = pm.response.json();

pm.test("Response is successful", function() {
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Dependency was removed", function() {
    if (jsonData.task.dependencies) {
        const hasDependency = jsonData.task.dependencies.some(
            d => d.task._id === pm.environment.get("dependency_id")
        );
        pm.expect(hasDependency).to.be.false;
    }
});
```

#### Start Time Tracking

```
POST {{base_url}}/api/tasks/{{task_id}}/time/start
```

Headers:
```
Authorization: Bearer {{token}}
```

**Tests**:
```javascript
var jsonData = pm.response.json();

pm.test("Response is successful", function() {
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Time entry was created", function() {
    pm.expect(jsonData.timeEntry).to.have.property("startTime");
    pm.expect(jsonData.timeEntry).to.not.have.property("endTime");
});
```

#### Stop Time Tracking

```
POST {{base_url}}/api/tasks/{{task_id}}/time/stop
```

Headers:
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

Body:
```json
{
  "notes": "Fixed the login form validation issue"
}
```

**Tests**:
```javascript
var jsonData = pm.response.json();

pm.test("Response is successful", function() {
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Time entry was completed", function() {
    pm.expect(jsonData.timeEntry).to.have.property("startTime");
    pm.expect(jsonData.timeEntry).to.have.property("endTime");
    pm.expect(jsonData.timeEntry).to.have.property("duration");
    pm.expect(jsonData.timeEntry.notes).to.equal("Fixed the login form validation issue");
});
```

#### Get Time Entries

```
GET {{base_url}}/api/tasks/{{task_id}}/time
```

Headers:
```
Authorization: Bearer {{token}}
```

**Tests**:
```javascript
var jsonData = pm.response.json();

pm.test("Response is successful", function() {
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Time entries exist", function() {
    pm.expect(jsonData.timeEntries).to.be.an("array");
    pm.expect(jsonData.timeEntries.length).to.be.greaterThan(0);
});
```

### Get Task by ID

```
GET {{base_url}}/api/tasks/{{task_id}}
```

Headers:
```
Authorization: Bearer {{token}}
```

**Tests**:
```javascript
var jsonData = pm.response.json();

pm.test("Response is successful", function() {
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Task has correct ID", function() {
    pm.expect(jsonData.task._id).to.equal(pm.environment.get("task_id"));
});

pm.test("Subtasks array exists", function() {
    pm.expect(jsonData.task).to.have.property("subtasks");
});
```

### Update Task

```
PATCH {{base_url}}/api/tasks/{{task_id}}
```

Headers:
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

Body:
```json
{
  "title": "Updated Task Title",
  "description": "This description was updated via Postman",
  "status": "In Progress",
  "priority": "Urgent"
}
```

**Tests**:
```javascript
var jsonData = pm.response.json();

pm.test("Response is successful", function() {
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Task is updated", function() {
    pm.expect(jsonData.task.title).to.equal("Updated Task Title");
    pm.expect(jsonData.task.status).to.equal("In Progress");
    pm.expect(jsonData.task.priority).to.equal("Urgent");
});
```

### Assign Task

```
POST {{base_url}}/api/tasks/{{task_id}}/assign
```

Headers:
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

Body:
```json
{
  "userIds": ["{{user_id1}}", "{{user_id2}}"]
}
```

**Tests**:
```javascript
var jsonData = pm.response.json();

pm.test("Response is successful", function() {
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Task has assignees", function() {
    pm.expect(jsonData.task.assignedTo).to.be.an("array");
    pm.expect(jsonData.task.assignedTo.length).to.be.greaterThan(0);
});
```

### Add Comment to Task

```
POST {{base_url}}/api/tasks/{{task_id}}/comments
```

Headers:
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

Body:
```json
{
  "text": "This is a test comment from Postman",
  "mentions": ["{{user_id1}}"]
}
```

**Tests**:
```javascript
var jsonData = pm.response.json();

pm.test("Response is successful", function() {
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Comment is added", function() {
    pm.expect(jsonData.comment).to.have.property("text");
    pm.expect(jsonData.comment.text).to.equal("This is a test comment from Postman");
    
    if (jsonData.comment.mentions && jsonData.comment.mentions.length > 0) {
        pm.expect(jsonData.comment.mentions[0]).to.equal(pm.environment.get("user_id1"));
    }
});
```

### Delete Task

```
DELETE {{base_url}}/api/tasks/{{task_id}}
```

Headers:
```
Authorization: Bearer {{token}}
```

**Tests**:
```javascript
var jsonData = pm.response.json();

pm.test("Response is successful", function() {
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Success message exists", function() {
    pm.expect(jsonData.message).to.include("deleted successfully");
});
```

## AI-Assisted Features

These endpoints use AI capabilities to enhance project management functionalities.

### Generate Tasks with AI

```
POST {{base_url}}/api/tasks/ai/generate/{{project_id}}
```

Headers:
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

Body:
```json
{
  "description": "Create a responsive web application with user authentication, dashboard, and profile management using React, Node.js, and MongoDB."
}
```

**Tests**:
```javascript
var jsonData = pm.response.json();

pm.test("Response is successful", function() {
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Tasks were generated", function() {
    pm.expect(jsonData.tasks).to.be.an("array");
    pm.expect(jsonData.tasks.length).to.be.greaterThan(0);
});

pm.test("Generated tasks have required structure", function() {
    const firstTask = jsonData.tasks[0];
    pm.expect(firstTask).to.have.property("title");
    pm.expect(firstTask).to.have.property("description");
    pm.expect(firstTask).to.have.property("priority");
    
    if (firstTask.subtasks) {
        pm.expect(firstTask.subtasks).to.be.an("array");
    }
});

// Save the generated tasks to an environment variable for the next step
pm.environment.set("generated_tasks", JSON.stringify(jsonData.tasks));
```

### Save AI-Generated Tasks

```
POST {{base_url}}/api/tasks/ai/save/{{project_id}}
```

Headers:
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

Body:
```json
{
  "tasks": {{generated_tasks}}
}
```

Pre-request Script:
```javascript
// Get the tasks from the environment and parse them
const tasksString = pm.environment.get("generated_tasks");
if (tasksString) {
    try {
        const tasks = JSON.parse(tasksString);
        // You can modify tasks here if needed before saving
        pm.variables.set("generated_tasks", JSON.stringify(tasks));
    } catch (e) {
        console.error("Error parsing generated tasks:", e);
    }
}
```

**Tests**:
```javascript
var jsonData = pm.response.json();

pm.test("Response is successful", function() {
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Tasks were saved", function() {
    pm.expect(jsonData.tasks).to.be.an("array");
    pm.expect(jsonData.tasks.length).to.be.greaterThan(0);
});

pm.test("Saved tasks have correct properties", function() {
    const firstTask = jsonData.tasks[0];
    pm.expect(firstTask).to.have.property("_id");
    pm.expect(firstTask).to.have.property("title");
    pm.expect(firstTask).to.have.property("project");
    pm.expect(firstTask).to.have.property("aiGenerated");
    pm.expect(firstTask.aiGenerated).to.be.true;
    pm.expect(firstTask).to.have.property("assignedTo");
    pm.expect(firstTask.assignedTo).to.be.an("array");
});

// Save the first task ID for potential further testing
if (jsonData.tasks && jsonData.tasks[0] && jsonData.tasks[0]._id) {
    pm.environment.set("ai_task_id", jsonData.tasks[0]._id);
}
```

## Troubleshooting

### Common Issues:

1. **Authentication Errors (401)**
   - Check that the token is correctly set in the environment
   - Token may have expired - try logging in again
   - Make sure you're using the Bearer prefix before the token

2. **Permission Errors (403)**
   - Ensure you have the correct role (Admin/Contributor) for operations like creating tasks, assigning tasks
   - Project creator can always perform admin actions

3. **Not Found Errors (404)**
   - Double-check that the project_id, task_id or member_id is correct
   - The resource may have been deleted

4. **Bad Request Errors (400)**
   - Verify the request body format matches the expected schema
   - Check for required fields (e.g., title for creating projects, userIds for task assignment)

5. **Server Errors (500)**
   - Check server logs for details
   - Make sure MongoDB is running and accessible

### Project Creation Specific Troubleshooting:

1. **Initial Member Issues**
   - Verify that email addresses for initial members are correct and exist in the system
   - Non-existent members will be ignored, but the project will still be created 
   - Check that member roles are valid ('Admin', 'Contributor', 'Viewer')

2. **Project Type Issues**
   - Valid project types are: 'Standard', 'Development', 'Research', 'Marketing', 'Event', 'Other'
   - Invalid project types will default to 'Standard'

3. **Visibility Issues**
   - Valid visibility options are: 'public' and 'private'
   - Invalid visibility will default to 'private'

### AI Task Generation Troubleshooting:

1. **AI Generation Issues**
   - Provide clear and detailed project descriptions for better AI-generated tasks
   - The more specific the description, the more relevant the generated tasks will be

2. **Task Saving Issues**
   - Make sure the tasks array structure matches what's expected by the API
   - Tasks need title and description at minimum
   - Check that the project ID is valid
   - Ensure you have at least Contributor permissions in the project

3. **Task Assignment Issues**
   - AI-generated tasks are automatically assigned to project admin by default
   - If there are issues with assignments, check that the admin user still exists and is a member of the project

## New AI-Assisted Testing Guide

### Testing AI Task Features

#### Generate Project Tasks

```
POST {{base_url}}/api/ai/tasks/generate
```

Headers:
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

Body:
```json
{
  "description": "Create a responsive e-commerce website with product catalog, user authentication, shopping cart, payment processing, and order management system",
  "projectTitle": "E-Commerce Platform",
  "projectType": "Development",
  "generateDependencies": true
}
```

**Tests**:
```javascript
var jsonData = pm.response.json();

pm.test("Response is successful", function() {
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Tasks array exists and has items", function() {
    pm.expect(jsonData.tasks).to.be.an("array");
    pm.expect(jsonData.tasks.length).to.be.greaterThan(0);
});

pm.test("Tasks have required structure", function() {
    const firstTask = jsonData.tasks[0];
    pm.expect(firstTask).to.have.property("title");
    pm.expect(firstTask).to.have.property("description");
    pm.expect(firstTask).to.have.property("priority");
    pm.expect(firstTask).to.have.property("estimatedHours");
    
    if (pm.request.body) {
        const requestBody = JSON.parse(pm.request.body.raw);
        if (requestBody.generateDependencies) {
            pm.expect(firstTask).to.have.property("dependencies");
        }
    }
});

// Save generated tasks for other tests
if (jsonData.tasks) {
    pm.environment.set("ai_generated_tasks", JSON.stringify(jsonData.tasks));
}
```

#### Generate Project Health Insights

```
POST {{base_url}}/api/ai/tasks/health/{{project_id}}
```

Headers:
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

Body:
```json
{
  "tasks": [
    {
      "_id": "{{task_id}}",
      "title": "Implement user authentication",
      "status": "In Progress",
      "priority": "High",
      "dueDate": "2025-05-15T00:00:00.000Z",
      "estimatedHours": 10,
      "actualHours": 6,
      "timeEntries": [{"duration": 360}],
      "dependencies": [{"task": "{{dependency_id}}"}],
      "health": {"status": "at-risk"}
    },
    {
      "_id": "{{dependency_id}}",
      "title": "Set up database schema",
      "status": "Completed",
      "priority": "High",
      "dueDate": "2025-05-10T00:00:00.000Z",
      "estimatedHours": 4,
      "actualHours": 5,
      "health": {"status": "completed"}
    }
  ]
}
```

**Tests**:
```javascript
var jsonData = pm.response.json();

pm.test("Response is successful", function() {
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Health insights exist", function() {
    pm.expect(jsonData.insights).to.have.property("overallProjectHealth");
    pm.expect(jsonData.insights).to.have.property("healthSummary");
    pm.expect(jsonData.insights).to.have.property("criticalTasks");
    pm.expect(jsonData.insights).to.have.property("recommendations");
    pm.expect(jsonData.insights).to.have.property("timeManagementInsights");
    pm.expect(jsonData.insights).to.have.property("dependencyInsights");
});
```

#### Generate Recurring Task Recommendations

```
POST {{base_url}}/api/ai/tasks/recurring/{{project_id}}
```

Headers:
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

Body:
```json
{
  "projectType": "Development",
  "existingTasks": [
    {
      "title": "Frontend Development",
      "description": "Implement user interface components"
    },
    {
      "title": "Backend API Development",
      "description": "Create RESTful API endpoints"
    }
  ]
}
```

**Tests**:
```javascript
var jsonData = pm.response.json();

pm.test("Response is successful", function() {
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Recurring tasks recommendations exist", function() {
    pm.expect(jsonData.recommendations).to.have.property("recurringTasks");
    pm.expect(jsonData.recommendations.recurringTasks).to.be.an("array");
});

pm.test("Recurring tasks have required structure", function() {
    if (jsonData.recommendations.recurringTasks.length > 0) {
        const firstTask = jsonData.recommendations.recurringTasks[0];
        pm.expect(firstTask).to.have.property("title");
        pm.expect(firstTask).to.have.property("description");
        pm.expect(firstTask).to.have.property("frequency");
        pm.expect(firstTask).to.have.property("estimatedHours");
        pm.expect(firstTask).to.have.property("priority");
    }
});
```