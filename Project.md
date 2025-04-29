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
   - [Initial Setup](#initial-setup)
   - [Sequential Testing Workflow](#sequential-testing-workflow)

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

This guide provides step-by-step instructions for testing the complete project and task management API using Postman. Follow these sequential steps to thoroughly test all API endpoints in a logical order.

### Initial Setup

1. **Install Postman**
   - Download and install from [postman.com](https://www.postman.com/downloads/)

2. **Create a New Collection**
   - Click "Collections" in the sidebar
   - Click the "+" button to create a new collection
   - Name it "Project Management API"

3. **Set Up Environment Variables**
   - Click "Environments" in the sidebar
   - Create a new environment named "Project Management"
   - Add the following variables:
     - `base_url`: Your API base URL (e.g., `http://localhost:5000/api`)
     - `token`: (Leave empty - will be filled after login)
     - `user_id`: (Leave empty)
     - `project_id`: (Leave empty)
     - `task_id`: (Leave empty)
     - `dependency_id`: (Leave empty)
     - `member_id`: (Leave empty)

4. **Import the Collection**
   - Alternatively, you can build the collection manually following the steps below

### Sequential Testing Workflow

#### SECTION 1: Authentication

##### Request 1: User Registration (Skip if you already have an account)

1. Create new request:
   - Method: `POST`
   - URL: `{{base_url}}/users/register`

2. Add request body (raw JSON):
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "TestPassword123!"
}
```

3. Save request as "Register User"

##### Request 2: User Login

1. Create new request:
   - Method: `POST`
   - URL: `{{base_url}}/users/login`

2. Add request body (raw JSON):
```json
{
  "email": "test@example.com",
  "password": "TestPassword123!"
}
```

3. Add script to "Tests" tab:
```javascript
const response = pm.response.json();
if (response.token) {
    pm.environment.set("token", response.token);
    pm.environment.set("user_id", response.user._id);
    console.log("Token saved to environment");
}
```

4. Save request as "User Login"
5. Send request and verify you receive a token

#### SECTION 2: Project Management

##### Request 3: Create Project

1. Create new request:
   - Method: `POST`
   - URL: `{{base_url}}/projects`
   - Authorization: Bearer Token (use `{{token}}`)

2. Add request body (raw JSON):
```json
{
  "title": "Project Management System",
  "description": "A comprehensive project management system with task dependencies and time tracking",
  "deadline": "2025-06-30T00:00:00.000Z",
  "priority": "High",
  "tags": ["development", "api", "mongodb"],
  "projectType": "Development",
  "visibility": "private"
}
```

3. Add script to "Tests" tab:
```javascript
const response = pm.response.json();
if (response.success && response.project && response.project._id) {
    pm.environment.set("project_id", response.project._id);
    console.log("Project ID saved: " + response.project._id);
}
```

4. Save request as "Create Project"
5. Send request and verify project is created

##### Request 4: Get Project Details

1. Create new request:
   - Method: `GET`
   - URL: `{{base_url}}/projects/{{project_id}}`
   - Authorization: Bearer Token (use `{{token}}`)

2. Save request as "Get Project Details"
3. Send request and verify project details match what you created

##### Request 5: Update Project

1. Create new request:
   - Method: `PATCH`
   - URL: `{{base_url}}/projects/{{project_id}}`
   - Authorization: Bearer Token (use `{{token}}`)

2. Add request body (raw JSON):
```json
{
  "description": "Updated description with additional details",
  "priority": "Urgent",
  "tags": ["development", "api", "mongodb", "urgent"]
}
```

3. Save request as "Update Project"
4. Send request and verify project is updated

#### SECTION 3: Team Management

##### Request 6: Add Team Member

1. Create new request:
   - Method: `POST`
   - URL: `{{base_url}}/projects/{{project_id}}/members`
   - Authorization: Bearer Token (use `{{token}}`)

2. Add request body (raw JSON):
```json
{
  "email": "teammate@example.com",
  "role": "Contributor"
}
```

3. Add script to "Tests" tab:
```javascript
const response = pm.response.json();
if (response.success && response.member && response.member.user && response.member.user._id) {
    pm.environment.set("member_id", response.member.user._id);
    console.log("Member ID saved: " + response.member.user._id);
}
```

4. Save request as "Add Project Member"
5. Send request and verify member is added

##### Request 7: Update Member Role

1. Create new request:
   - Method: `PATCH`
   - URL: `{{base_url}}/projects/{{project_id}}/members/{{member_id}}`
   - Authorization: Bearer Token (use `{{token}}`)

2. Add request body (raw JSON):
```json
{
  "role": "Admin"
}
```

3. Save request as "Update Member Role"
4. Send request and verify role is updated

#### SECTION 4: Task Management

##### Request 8: Create Main Task

1. Create new request:
   - Method: `POST`
   - URL: `{{base_url}}/tasks/projects/{{project_id}}`
   - Authorization: Bearer Token (use `{{token}}`)

2. Add request body (raw JSON):
```json
{
  "title": "Implement Authentication System",
  "description": "Create JWT authentication system with registration, login and token validation",
  "priority": "High",
  "dueDate": "2025-05-15T00:00:00.000Z",
  "estimatedHours": 16,
  "tags": ["backend", "security", "authentication"]
}
```

3. Add script to "Tests" tab:
```javascript
const response = pm.response.json();
if (response.success && response.task && response.task._id) {
    pm.environment.set("task_id", response.task._id);
    console.log("Task ID saved: " + response.task._id);
}
```

4. Save request as "Create Main Task"
5. Send request and verify task is created

##### Request 9: Create Dependency Task

1. Create new request:
   - Method: `POST`
   - URL: `{{base_url}}/tasks/projects/{{project_id}}`
   - Authorization: Bearer Token (use `{{token}}`)

2. Add request body (raw JSON):
```json
{
  "title": "Design Database Schema",
  "description": "Create MongoDB schema for users, projects, and tasks",
  "priority": "High",
  "dueDate": "2025-05-10T00:00:00.000Z",
  "estimatedHours": 8,
  "tags": ["backend", "database", "mongodb"]
}
```

3. Add script to "Tests" tab:
```javascript
const response = pm.response.json();
if (response.success && response.task && response.task._id) {
    pm.environment.set("dependency_id", response.task._id);
    console.log("Dependency task ID saved: " + response.task._id);
}
```

4. Save request as "Create Dependency Task"
5. Send request and verify task is created

##### Request 10: Get All Project Tasks

1. Create new request:
   - Method: `GET`
   - URL: `{{base_url}}/tasks/projects/{{project_id}}`
   - Authorization: Bearer Token (use `{{token}}`)

2. Save request as "Get Project Tasks"
3. Send request and verify both tasks appear in the response

##### Request 11: Get Specific Task

1. Create new request:
   - Method: `GET`
   - URL: `{{base_url}}/tasks/{{task_id}}`
   - Authorization: Bearer Token (use `{{token}}`)

2. Save request as "Get Task Details"
3. Send request and verify task details

##### Request 12: Update Task

1. Create new request:
   - Method: `PATCH`
   - URL: `{{base_url}}/tasks/{{dependency_id}}`
   - Authorization: Bearer Token (use `{{token}}`)

2. Add request body (raw JSON):
```json
{
  "description": "Updated database schema design with improved user model",
  "priority": "Urgent"
}
```

3. Save request as "Update Task"
4. Send request and verify task is updated

##### Request 13: Assign Task

1. Create new request:
   - Method: `POST`
   - URL: `{{base_url}}/tasks/{{task_id}}/assign`
   - Authorization: Bearer Token (use `{{token}}`)

2. Add request body (raw JSON):
```json
{
  "userIds": ["{{member_id}}"]
}
```

3. Save request as "Assign Task"
4. Send request and verify task is assigned

#### SECTION 5: Task Dependencies

##### Request 14: Add Task Dependency

1. Create new request:
   - Method: `POST`
   - URL: `{{base_url}}/tasks/{{task_id}}/dependencies/{{dependency_id}}`
   - Authorization: Bearer Token (use `{{token}}`)

2. Add request body (raw JSON):
```json
{
  "type": "finish-to-start",
  "delay": 0
}
```

3. Save request as "Add Task Dependency"
4. Send request and verify dependency is added
5. Check that the main task now shows it's blocked by the dependency

##### Request 15: Check Task Dependency Status

1. Create new request:
   - Method: `GET`
   - URL: `{{base_url}}/tasks/{{task_id}}`
   - Authorization: Bearer Token (use `{{token}}`)

2. Save request as "Check Task Dependencies"
3. Send request and verify dependencies are shown correctly

#### SECTION 6: Task Comments

##### Request 16: Add Comment to Task

1. Create new request:
   - Method: `POST`
   - URL: `{{base_url}}/tasks/{{task_id}}/comments`
   - Authorization: Bearer Token (use `{{token}}`)

2. Add request body (raw JSON):
```json
{
  "text": "We should use Passport.js for authentication strategies",
  "mentions": ["{{member_id}}"]
}
```

3. Save request as "Add Task Comment"
4. Send request and verify comment is added

#### SECTION 7: Time Tracking

##### Request 17: Start Time Tracking

1. Create new request:
   - Method: `POST`
   - URL: `{{base_url}}/tasks/{{dependency_id}}/time/start`
   - Authorization: Bearer Token (use `{{token}}`)

2. Save request as "Start Time Tracking"
3. Send request and verify time tracking has started

##### Request 18: Stop Time Tracking

1. Create new request:
   - Method: `POST`
   - URL: `{{base_url}}/tasks/{{dependency_id}}/time/stop`
   - Authorization: Bearer Token (use `{{token}}`)

2. Add request body (raw JSON):
```json
{
  "notes": "Completed database schema design for users and projects"
}
```

3. Save request as "Stop Time Tracking"
4. Send request and verify time entry is recorded

##### Request 19: Get Time Entries

1. Create new request:
   - Method: `GET`
   - URL: `{{base_url}}/tasks/{{dependency_id}}/time`
   - Authorization: Bearer Token (use `{{token}}`)

2. Save request as "Get Time Entries"
3. Send request and verify time entries are returned

##### Request 20: Complete Dependency Task

1. Create new request:
   - Method: `PATCH`
   - URL: `{{base_url}}/tasks/{{dependency_id}}`
   - Authorization: Bearer Token (use `{{token}}`)

2. Add request body (raw JSON):
```json
{
  "status": "Completed"
}
```

3. Save request as "Complete Task"
4. Send request and verify task status is updated to "Completed"

##### Request 21: Check Main Task is Unblocked

1. Create new request (or reuse "Get Task Details"):
   - Method: `GET`
   - URL: `{{base_url}}/tasks/{{task_id}}`
   - Authorization: Bearer Token (use `{{token}}`)

2. Save request as "Check Unblocked Status"
3. Send request and verify the main task is no longer blocked

#### SECTION 8: Task Health Analysis

##### Request 22: Calculate Task Health

1. Create new request:
   - Method: `POST`
   - URL: `{{base_url}}/tasks/{{task_id}}/health`
   - Authorization: Bearer Token (use `{{token}}`)

2. Save request as "Calculate Task Health"
3. Send request and verify health status is calculated

##### Request 23: Calculate Project-Wide Health

1. Create new request:
   - Method: `POST`
   - URL: `{{base_url}}/tasks/projects/{{project_id}}/health`
   - Authorization: Bearer Token (use `{{token}}`)

2. Save request as "Calculate Project Health"
3. Send request and verify health is calculated for all tasks

#### SECTION 9: Advanced Features

##### Request 24: Create Recurring Task

1. Create new request:
   - Method: `POST`
   - URL: `{{base_url}}/tasks/recurring/projects/{{project_id}}`
   - Authorization: Bearer Token (use `{{token}}`)

2. Add request body (raw JSON):
```json
{
  "title": "Weekly Status Meeting",
  "description": "Regular team sync to discuss progress and blockers",
  "priority": "Medium",
  "estimatedHours": 1,
  "recurrence": {
    "frequency": "weekly",
    "interval": 1,
    "daysOfWeek": [1],
    "occurrences": 10
  },
  "tags": ["meeting", "recurring"],
  "createFirstInstance": true
}
```

3. Save request as "Create Recurring Task"
4. Send request and verify recurring task is created

##### Request 25: Clone Task

1. Create new request:
   - Method: `POST`
   - URL: `{{base_url}}/tasks/{{task_id}}/clone`
   - Authorization: Bearer Token (use `{{token}}`)

2. Add request body (raw JSON):
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

3. Save request as "Clone Task"
4. Send request and verify task is cloned

##### Request 26: Generate Tasks with AI

1. Create new request:
   - Method: `POST`
   - URL: `{{base_url}}/tasks/ai/generate/{{project_id}}`
   - Authorization: Bearer Token (use `{{token}}`)

2. Add request body (raw JSON):
```json
{
  "description": "Create a user authentication system with registration, login, password reset, and OAuth integration"
}
```

3. Add script to "Tests" tab:
```javascript
const response = pm.response.json();
if (response.success && response.tasks) {
    pm.environment.set("generated_tasks", JSON.stringify(response.tasks));
    console.log("AI-generated tasks saved to environment");
}
```

4. Save request as "Generate AI Tasks"
5. Send request and verify AI task suggestions are returned

##### Request 27: Save AI-Generated Tasks

1. Create new request:
   - Method: `POST`
   - URL: `{{base_url}}/tasks/ai/save/{{project_id}}`
   - Authorization: Bearer Token (use `{{token}}`)

2. Add request body (raw JSON):
```json
{
  "tasks": {{generated_tasks}}
}
```

3. Save request as "Save AI Tasks"
4. Send request and verify tasks are saved to the project

#### SECTION 10: Project Dashboard & Reports

##### Request 28: Get Project Dashboard

1. Create new request:
   - Method: `GET`
   - URL: `{{base_url}}/projects/{{project_id}}/dashboard`
   - Authorization: Bearer Token (use `{{token}}`)

2. Save request as "Get Project Dashboard"
3. Send request and verify dashboard data is returned

#### SECTION 11: Cleanup (Optional)

##### Request 29: Remove Task Dependency

1. Create new request:
   - Method: `DELETE`
   - URL: `{{base_url}}/tasks/{{task_id}}/dependencies/{{dependency_id}}`
   - Authorization: Bearer Token (use `{{token}}`)

2. Save request as "Remove Task Dependency"
3. Send request and verify dependency is removed

##### Request 30: Remove Project Member

1. Create new request:
   - Method: `DELETE`
   - URL: `{{base_url}}/projects/{{project_id}}/members/{{member_id}}`
   - Authorization: Bearer Token (use `{{token}}`)

2. Save request as "Remove Project Member"
3. Send request and verify member is removed

##### Request 31: Delete Task

1. Create new request:
   - Method: `DELETE`
   - URL: `{{base_url}}/tasks/{{task_id}}`
   - Authorization: Bearer Token (use `{{token}}`)

2. Save request as "Delete Task"
3. Send request and verify task is deleted

##### Request 32: Delete Project

1. Create new request:
   - Method: `DELETE`
   - URL: `{{base_url}}/projects/{{project_id}}`
   - Authorization: Bearer Token (use `{{token}}`)

2. Save request as "Delete Project"
3. Send request and verify project is deleted

### Automating the Testing Workflow

You can use Postman's Collection Runner to automate the entire testing sequence:

1. Open Postman and select the Collection Runner (Runner button)
2. Select your "Project Management API" collection
3. Select the "Project Management" environment
4. Deselect any cleanup requests if you want to keep your test data
5. Click "Run" to execute the entire sequence

#### Troubleshooting Tips

1. **401 Unauthorized errors**: Check if your token has expired - run login request again
2. **404 Not Found errors**: Verify IDs in environment variables are correct
3. **400 Bad Request errors**: Check request body format and required fields
4. **Time tracking issues**: Make sure you're not already tracking time on another task
5. **Dependency issues**: Ensure both tasks exist and are in the same project