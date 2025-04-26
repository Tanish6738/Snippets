# CodeArc - Advanced Code Snippet Management System

A full-stack application for managing, sharing, and collaborating on code snippets with advanced team features, blogging capabilities, and AI assistance.

## Features

- User authentication and authorization
- Code snippet creation, management and version control
- Directory organization with hierarchical structure
- Group collaboration with role-based permissions
- Kanban board for project management
- Sharing and permission management
- Syntax highlighting for multiple languages
- Blog publishing and community interaction
- Real-time collaboration
- Activity logging and analytics
- Bookmarking and favorites
- Export snippets in multiple formats
- Search and filter capabilities
- Responsive UI with dark/light themes

## Tech Stack

- **Frontend**: 
  - React with Vite
  - TailwindCSS & Framer Motion animations
  - Context API for state management
  - React Router for navigation
- **Backend**: 
  - Node.js with Express.js
  - MongoDB with Mongoose ODM
  - JWT Authentication
  - RESTful API architecture
- **Additional Technologies**:
  - GSAP for advanced animations
  - Socket.io for real-time features
  - Multer for file uploads
  - PDF generation and processing

## Project Structure

```
snippets/
├── Backend/
│   ├── Config/          # Configuration files (DB, AI, etc.)
│   ├── controllers/     # API route controllers
│   ├── middlewares/     # Auth and validation middlewares
│   ├── Models/          # MongoDB schema definitions
│   ├── Routes/          # API route definitions
│   ├── app.js          # Express app configuration
│   └── server.js        # Main server entry point
└── Frontend/
    ├── src/
    │   ├── assets/      # Static assets
    │   ├── blocks/      # Reusable UI building blocks
    │   ├── components/  # React components organized by feature
    │   ├── Config/      # Frontend configuration
    │   ├── Context/     # React context providers
    │   ├── hooks/       # Custom React hooks
    │   ├── Routes/      # Application routes
    │   ├── services/    # API service integrations
    │   └── utils/       # Utility functions
    └── public/          # Public assets
```

## Getting Started

### Prerequisites

- Node.js >= 14
- MongoDB >= 4.4
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/snippets.git
cd snippets
```

2. Install Backend dependencies:
```bash
cd Backend
npm install
```

3. Install Frontend dependencies:
```bash
cd Frontend
npm install
```

4. Create a `.env` file in the Backend directory using the provided template:
```properties
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/Snippets
JWT_SECRET=your-secret-key
```

5. Start the development servers:

Backend:
```bash
cd Backend
npm run dev
```

Frontend:
```bash
cd Frontend
npm run dev
```

## API Documentation

Base URL: `http://localhost:3000/api`

### Authentication

Most endpoints require JWT token in the Authorization header:
```http
Authorization: Bearer <token>
```

### Error Responses
All error responses follow the format:
```json
{
    "status": "error",
    "error": "Error Type",
    "message": "Detailed error message",
    "details": [] // Optional array of specific error details
}
```

### Authentication & User Routes

#### 1. Register New User
```http
POST /api/users/register
Content-Type: application/json

{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password123"
}
```

#### 2. Login User
```http
POST /api/users/login
Content-Type: application/json

{
    "email": "test@example.com",
    "password": "Password123"
}
```

#### 3. Get User Profile
```http 
GET /api/users/profile
Authorization: Bearer <token>
```

#### 4. Update User Profile
```http
PATCH /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
    "username": "updateduser",
    "bio": "This is my updated bio",
    "preferences": {
        "defaultSnippetVisibility": "private",
        "theme": "dark"
    }
}
```

### Directory Routes

#### 1. Create Directory
```http
POST /api/directories
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "JavaScript Projects",
    "path": "/JavaScript Projects",
    "visibility": "private",
    "parentId": "optional_parent_directory_id"
}
```

#### 2. List Directories
```http
GET /api/directories
Authorization: Bearer <token>
```

#### 3. Get Directory by ID
```http
GET /api/directories/:id
Authorization: Bearer <token>
```

#### 4. Update Directory
```http
PUT /api/directories/:id
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "Updated Directory Name",
    "visibility": "public"
}
```

#### 5. Share Directory
```http
POST /api/directories/:id/share
Authorization: Bearer <token>
Content-Type: application/json

{
    "entityId": "user_or_group_id",
    "entityType": "User", // or "Group"
    "role": "viewer" // or "editor", "owner"
}
```

#### 6. Move Directory
```http
PATCH /api/directories/:id/move
Authorization: Bearer <token>
Content-Type: application/json

{
    "newParentId": "new_parent_directory_id"
}
```

#### 7. Rename Directory
```http
PATCH /api/directories/:id/rename
Authorization: Bearer <token>
Content-Type: application/json

{
    "newName": "New Directory Name"
}
```

#### 8. Get Directory Tree
```http
GET /api/directories/tree
Authorization: Bearer <token>
```

#### 9. Delete Directory
```http
DELETE /api/directories/:id
Authorization: Bearer <token>
```

### Snippet Routes

#### 1. Create Snippet
```http
POST /api/snippets
Authorization: Bearer <token>
Content-Type: application/json

{
    "title": "Hello World in JavaScript",
    "content": "console.log('Hello World!');",
    "language": "javascript",
    "tags": ["beginner", "javascript"],
    "visibility": "public",
    "description": "A simple hello world program"
}
```

#### 2. List Snippets
```http
GET /api/snippets
Authorization: Bearer <token>

# Query Parameters:
?page=1
?limit=10
?tags=javascript,react
?language=javascript
?visibility=public
```

#### 3. Get Snippet Details
```http
GET /api/snippets/:id
Authorization: Bearer <token>
```

#### 4. Update Snippet
```http
PATCH /api/snippets/:id
Authorization: Bearer <token>
Content-Type: application/json

{
    "title": "Updated Title",
    "content": "Updated content",
    "tags": ["updated", "tags"]
}
```

#### 5. Share Snippet
```http
POST /api/snippets/:id/share
Authorization: Bearer <token>
Content-Type: application/json

{
    "entityId": "user_or_group_id",
    "entityType": "User", // or "Group"
    "role": "viewer" // or "editor", "owner"
}
```

#### 6. Search Snippets
```http
GET /api/snippets/search
Authorization: Bearer <token>

# Query Parameters:
?q=search_term
?page=1
?limit=10
```

#### 7. Export Snippet
```http
GET /api/snippets/:id/export
Authorization: Bearer <token>
```

#### 8. Toggle Comments
```http
PATCH /api/snippets/:id/comments
Authorization: Bearer <token>
Content-Type: application/json

{
    "enabled": true // or false
}
```

#### 9. Bulk Create Snippets
```http
POST /api/snippets/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
    "snippets": [
        {
            "title": "Snippet 1",
            "content": "Content of snippet 1",
            "language": "javascript",
            "tags": ["tag1", "tag2"],
            "visibility": "public"
        },
        {
            "title": "Snippet 2",
            "content": "Content of snippet 2",
            "language": "python",
            "tags": ["tag3", "tag4"],
            "visibility": "private"
        }
    ]
}
```

#### 10. Get Snippet Statistics
```http
GET /api/snippets/:id/stats
Authorization: Bearer <token>
```

#### 11. Restore Snippet Version
```http
POST /api/snippets/:id/restore/:version
Authorization: Bearer <token>
```

#### 12. Delete Snippet
```http
DELETE /api/snippets/:id
Authorization: Bearer <token>
```

### Group Routes

#### 1. Create Group
```http
POST /api/groups
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "JavaScript Developers",
    "description": "A group for JavaScript enthusiasts",
    "settings": {
        "visibility": "public",
        "joinPolicy": "open"
    }
}
```

#### 2. List Groups
```http
GET /api/groups
Authorization: Bearer <token>
```

#### 3. Get Group Details
```http
GET /api/groups/:id
Authorization: Bearer <token>
```

#### 4. Update Group
```http
PATCH /api/groups/:id
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "Updated Group Name",
    "description": "Updated description"
}
```

#### 5. Add Group Member
```http
POST /api/groups/:id/members
Authorization: Bearer <token>
Content-Type: application/json

{
    "userId": "user_id",
    "role": "member" // or "admin"
}
```

#### 6. Add Snippet to Group
```http
POST /api/groups/:id/snippets
Authorization: Bearer <token>
Content-Type: application/json

{
    "snippetId": "snippet_id"
}
```

#### 7. Add Directory to Group
```http
POST /api/groups/:id/directories
Authorization: Bearer <token>
Content-Type: application/json

{
    "directoryId": "directory_id"
}
```

#### 8. Remove Group Member
```http
DELETE /api/groups/:id/members/:userId
Authorization: Bearer <token>
```

#### 9. Remove Snippet from Group
```http
DELETE /api/groups/:id/snippets/:snippetId
Authorization: Bearer <token>
```

#### 10. Remove Directory from Group
```http
DELETE /api/groups/:id/directories/:directoryId
Authorization: Bearer <token>
```

#### 11. Delete Group
```http
DELETE /api/groups/:id
Authorization: Bearer <token>
```

### Activity Routes

#### 1. Log Activity
```http
POST /api/activities
Authorization: Bearer <token>
Content-Type: application/json

{
    "action": "create",
    "targetType": "snippet",
    "targetId": "snippet_id",
    "metadata": {
        "previousState": {},
        "newState": {},
        "changes": ["title"],
        "visibility": "public",
        "sharedWith": ["user_id"],
        "exportFormat": "pdf"
    },
    "relatedUsers": ["user_id"]
}
```

#### 2. Get Activities by User
```http
GET /api/activities/user
Authorization: Bearer <token>
```

#### 3. Get Activities by Target
```http
GET /api/activities/target/:targetId
Authorization: Bearer <token>
```

#### 4. Get Activities by Action
```http
GET /api/activities/action/:action
Authorization: Bearer <token>
```

#### 5. Update Activity
```http
PUT /api/activities/:id
Authorization: Bearer <token>
Content-Type: application/json

{
    "action": "edit",
    "metadata": {
        "changes": ["description"]
    }
}
```

#### 6. Delete Activity
```http
DELETE /api/activities/:id
Authorization: Bearer <token>
```

### Blog Routes

#### 1. Create Blog Post
```http
POST /api/blogs
Authorization: Bearer <token>
Content-Type: application/json

{
    "title": "Understanding JavaScript Promises",
    "content": "Detailed blog content here...",
    "tags": ["javascript", "async", "promises"],
    "coverImage": "image_url.jpg",
    "visibility": "public"
}
```

#### 2. Get Blog Posts
```http
GET /api/blogs
Authorization: Bearer <token>

# Query Parameters:
?page=1
?limit=10
?tags=javascript,webdev
```

#### 3. Like Blog Post
```http
POST /api/blog-interactions/like/:blogId
Authorization: Bearer <token>
```

#### 4. Comment on Blog Post
```http
POST /api/blog-interactions/comment/:blogId
Authorization: Bearer <token>
Content-Type: application/json

{
    "content": "Great article! Very informative."
}
```

#### 5. Bookmark Blog Post
```http
POST /api/blogs/:id/bookmark
Authorization: Bearer <token>
```

### Public Routes

#### 1. Get Public Snippets
```http
GET /api/public/snippets

# Query Parameters:
?page=1
?limit=10
?language=javascript
?sort=newest
```

#### 2. Get Public Groups
```http
GET /api/public/groups
```

#### 3. Get Platform Statistics
```http
GET /api/public/stats
```

#### 4. Get Trending Snippets
```http
GET /api/public/trending
```

#### 5. Get Top Contributors
```http
GET /api/public/top-users
```

### AI Features

#### 1. Generate Code Snippet
```http
POST /api/ai/generate
Authorization: Bearer <token>
Content-Type: application/json

{
    "prompt": "Create a React function component that displays a counter",
    "language": "javascript"
}
```

#### 2. Analyze Code
```http
POST /api/ai/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
    "code": "function example() { /* code here */ }",
    "language": "javascript"
}
```

### Run Code Routes

#### 1. Execute Code Snippet
```http
POST /api/run-code
Authorization: Bearer <token>
Content-Type: application/json

{
    "code": "console.log('Hello, world!');",
    "language": "javascript",
    "inputs": []
}
```

### PDF Routes

#### 1. Export Snippet as PDF
```http
GET /api/pdf/snippet/:id
Authorization: Bearer <token>

# Query Parameters:
?includeMetadata=true
?includeComments=true
```

#### 2. Export Directory as PDF
```http
GET /api/pdf/directory/:id
Authorization: Bearer <token>

# Query Parameters:
?includeSubdirectories=true
?recursive=true
```

## Key Features Explained

### Directory Structure
The system supports a hierarchical directory structure similar to a file system. Each user has a root directory, and directories can contain both snippets and subdirectories.

### Version Control
Each snippet maintains a complete version history, allowing users to track changes and revert to previous versions.

### Group Collaboration
Users can create groups, invite members, and collaborate on shared snippets and directories with role-based permissions.

### Blog System
The platform includes a blog system that allows users to publish articles, receive comments, and gain likes from the community.

### Activity Tracking
All user actions are logged, providing insights into usage patterns and enabling audit trails.

## Development

### Coding Standards

- Follow ESLint configuration
- Write meaningful commit messages
- Document new features and API changes

### Testing

1. Backend Testing:
```bash
cd Backend
npm test
```

2. Frontend Testing:
```bash
cd Frontend
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## Deployment

### Backend Deployment
The backend can be deployed on Vercel, and includes a `vercel.json` configuration file for easy deployment.

### Frontend Deployment
The frontend is built with Vite and can be deployed on Vercel, Netlify, or any other static site hosting service.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Open source community for providing invaluable libraries and tools
- Contributors who have dedicated time to improve this project
