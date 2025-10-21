# Task Management System

A secure, role-based task management application built with modern web technologies. This system allows organizations to manage tasks with fine-grained access control, ensuring users can only see and modify what they're authorized to access.

## What's Inside

This is a full-stack application that demonstrates secure task management with:

- **Role-based access control (RBAC)** - Different permission levels for Owners, Admins, and Viewers
- **Organization hierarchy** - Support for parent and child organizations with proper data scoping
- **JWT authentication** - Real authentication (no mocks) with secure token-based sessions
- **Drag-and-drop task board** - Intuitive Kanban-style interface with three columns (To Do, In Progress, Done)
- **Audit logging** - Track who's accessing and modifying tasks
- **Responsive design** - Works seamlessly from mobile to desktop

## Technology Stack

- **Backend**: NestJS 11 with TypeORM and SQLite (development)
- **Frontend**: Angular 20 with Tailwind CSS and Angular CDK for drag-and-drop
- **Monorepo**: Nx workspace with shared libraries for type safety
- **Authentication**: JWT tokens with HTTP-only storage

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)
- Available ports: `3000` (API) and `4200` (Dashboard)
- Git (to clone the repository)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/krunalpatel0719/kpatel-42e3e550-3885-4820-9592-f86675457b41
   cd task-management-system
   ```

2. **Install dependencies**

   ```bash
   npm ci
   ```

3. **Verify environment configuration**

   The project includes a pre-configured `.env` file at `api/.env` with these settings:

   ```env
   JWT_SECRET=dev_secret_change_me_in_production
   JWT_EXPIRES_IN=1h
   DB_TYPE=sqlite
   DB_DATABASE=data/dev.sqlite
   ```

   > **Important**: The default JWT secret is fine for local development, but you **must** change it for any production or shared environment.

   > **Note**: The `.env` file is included in the repository for development convenience. The SQLite database file (`api/data/dev.sqlite`) will be created automatically when you start the backend.

4. **Seed the database**

   This creates a "Test Organization" with ID 1, which you'll need for user registration:

   ```bash
   npx ts-node -P api/tsconfig.app.json api/src/seed.ts
   ```

   **Expected output:**

   ```
   ✅ Seed data created successfully
      - Created organization: Test Organization (id: 1)
   ```

5. **Start the backend**

   ```bash
   npx nx serve api
   ```

   The API will be available at `http://localhost:3000/api`

   **Expected output:**

   ```
   [Nest] 12345  - LOG [NestFactory] Starting Nest application...
   [Nest] 12345  - LOG [InstanceLoader] TypeOrmModule dependencies initialized
   [Nest] 12345  - LOG [NestApplication] Nest application successfully started
   🚀 Application is running on: http://localhost:3000/api
   ```

6. **Start the frontend** (in a new terminal)

   ```bash
   npx nx serve dashboard
   ```

   The dashboard will be available at `http://localhost:4200`

   **Expected output:**

   ```
   ✔ Browser application bundle generation complete.
   ** Angular Live Development Server is listening on localhost:4200 **
   ```

### Verify Installation

After both servers are running, verify everything works:

1. **Check backend health**:

   ```bash
   # Windows PowerShell
   Invoke-WebRequest -Uri http://localhost:3000/api

   # macOS/Linux
   curl http://localhost:3000/api
   ```

   Expected response: `{"message":"Hello API"}`

2. **Check frontend**:
   Open `http://localhost:4200` in your browser. You should see the login page.

3. **Check database**:
   The SQLite database file should exist at `api/data/dev.sqlite` (created automatically on first backend start).

### Test Accounts

After seeding the database, you can create test users to explore different role behaviors:

#### Create an Owner Account

```bash
# Windows PowerShell
$body = @{
  email = "owner@example.com"
  password = "password123"
  organizationId = 1
  role = "Owner"
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/register' -Method Post -Body $body -ContentType 'application/json'
```

```bash
# macOS/Linux
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "password123",
    "organizationId": 1,
    "role": "Owner"
  }'
```

#### Create an Admin Account

```bash
# Windows PowerShell
$body = @{
  email = "admin@example.com"
  password = "password123"
  organizationId = 1
  role = "Admin"
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/register' -Method Post -Body $body -ContentType 'application/json'
```

```bash
# macOS/Linux
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "organizationId": 1,
    "role": "Admin"
  }'
```

#### Create a Viewer Account

```bash
# Windows PowerShell
$body = @{
  email = "viewer@example.com"
  password = "password123"
  organizationId = 1
  role = "Viewer"
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/register' -Method Post -Body $body -ContentType 'application/json'
```

```bash
# macOS/Linux
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "viewer@example.com",
    "password": "password123",
    "organizationId": 1,
    "role": "Viewer"
  }'
```

#### Login with Test Accounts

After creating test users, log in at `http://localhost:4200/login` with any of these credentials:

- **Owner**: `owner@example.com` / `password123` (Full system access)
- **Admin**: `admin@example.com` / `password123` (Org + children access)
- **Viewer**: `viewer@example.com` / `password123` (Read-only access)

---

## Architecture Overview

### Why a Monorepo?

This project uses Nx to manage a monorepo structure, which provides several benefits:

- **Shared code**: Common types and interfaces are defined once in `libs/data` and used by both frontend and backend
- **Type safety**: Changes to API contracts are immediately reflected across the entire codebase
- **Reusable logic**: RBAC guards and decorators live in `libs/auth` and can be used anywhere
- **Consistent tooling**: One set of build tools, linting rules, and test configurations

### Project Structure

```
task-management-system/
├── apps/
│   ├── api/                    # NestJS backend application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── auth/       # Authentication (JWT strategy, guards)
│   │   │   │   ├── organizations/  # Organization management
│   │   │   │   ├── tasks/      # Task CRUD + reordering
│   │   │   │   ├── audit/      # Audit log service
│   │   │   │   └── database/   # TypeORM entities and config
│   │   │   └── main.ts         # App entry point (CORS, Helmet, etc.)
│   │   └── .env                # Environment configuration
│   │
│   └── dashboard/              # Angular frontend application
│       └── src/
│           ├── app/
│           │   ├── components/ # Task board, cards, editor
│           │   ├── pages/      # Login, register, home
│           │   ├── services/   # HTTP services (auth, tasks, orgs)
│           │   └── guards/     # Route guards (auth)
│           └── styles.css      # Global Tailwind styles
│
├── libs/
│   ├── data/                   # Shared TypeScript interfaces & DTOs
│   │   └── src/lib/contracts/  # ITask, IUser, CreateTaskDto, etc.
│   │
│   └── auth/                   # Reusable RBAC logic
│       └── src/lib/
│           ├── decorators/     # @Roles() decorator
│           ├── guards/         # RolesGuard for route protection
│           └── utils/          # org-scope utilities
│
└── README.md
```

### How It Works Together

1. **Shared Contracts**: The `libs/data` library defines interfaces like `ITask`, `IUser`, and DTOs that both the API and dashboard import. This ensures the frontend always knows the exact shape of API responses.

2. **Reusable Auth Logic**: The `libs/auth` library provides decorators like `@Roles(Role.OWNER, Role.ADMIN)` that can be applied to any NestJS controller method to enforce access control.

3. **Type-Safe Communication**: When the frontend calls the API, TypeScript ensures request payloads and response handling match the shared contracts.

---

## Data Models & Schema

### Entities

The system has three main entities:

#### Users

Each user belongs to one organization and has one role.

- `id`: Unique identifier
- `email`: Unique email address (used for login)
- `passwordHash`: Bcrypt-hashed password
- `role`: One of `Owner`, `Admin`, or `Viewer`
- `organizationId`: Foreign key to their organization

#### Organizations

Organizations can have a two-level hierarchy (parent organization with child organizations).

- `id`: Unique identifier
- `name`: Organization name
- `parentId`: Optional foreign key to parent organization
- `children`: Relationship to child organizations

#### Tasks

Tasks belong to both a user (creator) and an organization.

- `id`: Unique identifier
- `title`: Task title (required)
- `description`: Optional longer description
- `category`: Optional category (e.g., "Work", "Personal")
- `status`: One of `todo`, `in-progress`, or `done`
- `orderIndex`: Number used for sorting within a status column
- `ownerId`: Foreign key to the user who created it
- `organizationId`: Foreign key to the organization
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### Entity Relationship Diagram

```
┌─────────────────┐
│  Organization   │
│  ─────────────  │
│  id             │◄──────┐
│  name           │       │
│  parentId       │───────┘ (self-reference for 2-level hierarchy)
└────────┬────────┘
         │
         │ 1
         │
         │ *
┌────────┴────────┐         ┌─────────────────┐
│      User       │         │      Task       │
│  ─────────────  │         │  ─────────────  │
│  id             │         │  id             │
│  email          │         │  title          │
│  passwordHash   │         │  description    │
│  role           │         │  category       │
│  organizationId │◄────────┤  status         │
└────────┬────────┘       * │  orderIndex     │
         │                  │  ownerId        │
         │ 1                │  organizationId │
         │                  └─────────────────┘
         │                           ▲
         │ *                         │
         └───────────────────────────┘
```

**Relationships:**

- One Organization can have many Users
- One Organization can have many Tasks
- One User can create many Tasks
- Organizations can have a parent-child relationship (max 2 levels deep)

---

## Access Control & Security

### Role-Based Access Control (RBAC)

The system implements three distinct roles with different permission levels:

#### Owner

- **Access scope**: All organizations in the system
- **Permissions**: Full CRUD on all tasks, can view audit logs
- **Use case**: System administrators or company owners

#### Admin

- **Access scope**: Their own organization plus any direct child organizations
- **Permissions**: Full CRUD on tasks within their scope, can view audit logs
- **Use case**: Department heads or team leads managing sub-teams

#### Viewer

- **Access scope**: Only their own organization
- **Permissions**: Read-only access to tasks in their organization
- **Use case**: Team members who need visibility but shouldn't modify data

### How Roles Are Enforced

#### Backend (NestJS)

1. **Decorators**: Controllers use `@Roles(Role.OWNER, Role.ADMIN)` to declare who can access endpoints

   ```typescript
   @Post()
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles(Role.OWNER, Role.ADMIN)
   async create(@Body() dto: CreateTaskDto, @Request() req) {
     // Only Owners and Admins can reach here
   }
   ```

2. **Guards**: The `RolesGuard` checks the user's role from the JWT token against the decorator

3. **Organization Scoping**: Services use the `isOrgWithinScope()` utility to filter data:

   - Owners see everything
   - Admins see their org + direct children
   - Viewers see only their org

4. **Audit Logging**: All task modifications are logged to a file with user, action, and timestamp

#### Frontend (Angular)

1. **Route Guards**: The `AuthGuard` prevents unauthenticated users from accessing protected routes

2. **Conditional UI**: The dashboard shows/hides edit/delete buttons based on the user's role:

   ```typescript
   canEdit = this.role === 'Owner' || this.role === 'Admin';
   ```

3. **Read-only Mode**: Viewers see the full task board but all modification actions are disabled

### JWT Authentication Flow

1. **Registration/Login**: User submits credentials to `/api/auth/register` or `/api/auth/login`

2. **Token Generation**: Server validates credentials and returns a JWT containing:

   - User ID
   - Email
   - Role
   - Organization ID

3. **Token Storage**: Frontend stores the token in `localStorage`

4. **Authenticated Requests**: An HTTP interceptor automatically attaches the token to all API requests:

   ```
   Authorization: Bearer <jwt_token>
   ```

5. **Token Validation**: The `JwtAuthGuard` on the backend validates the token and extracts user info for every protected endpoint

---

## API Documentation

All endpoints (except `/auth/register` and `/auth/login`) require a valid JWT token in the `Authorization` header.

### Authentication

#### Register a New User

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "organizationId": 1,
  "role": "Viewer"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "Viewer",
    "organizationId": 1
  }
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "Viewer",
    "organizationId": 1
  }
}
```

### Organizations

#### List All Organizations

```http
GET /api/organizations
```

**Response:**

```json
[
  {
    "id": 1,
    "name": "Test Organization",
    "parentId": null
  }
]
```

Note: This endpoint is public (no authentication required) to support the registration flow.

#### Create Organization

```http
POST /api/organizations
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Engineering Team",
  "parentId": 1
}
```

**Requirements**: Owner or Admin role

### Tasks

#### List Tasks

Returns all tasks the authenticated user has access to, based on their role and organization.

```http
GET /api/tasks
Authorization: Bearer <token>
```

**Response:**

```json
[
  {
    "id": 1,
    "title": "Complete project documentation",
    "description": "Write comprehensive README",
    "category": "Work",
    "status": "in-progress",
    "orderIndex": 0,
    "ownerId": 1,
    "organizationId": 1,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T14:30:00Z"
  }
]
```

#### Create Task

```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Review pull request",
  "description": "Check PR #123 for code quality",
  "category": "Work",
  "status": "todo"
}
```

**Requirements**: Owner or Admin role

**Response:**

```json
{
  "id": 2,
  "title": "Review pull request",
  "description": "Check PR #123 for code quality",
  "category": "Work",
  "status": "todo",
  "orderIndex": 0,
  "ownerId": 1,
  "organizationId": 1,
  "createdAt": "2024-01-15T15:00:00Z",
  "updatedAt": "2024-01-15T15:00:00Z"
}
```

#### Update Task

```http
PUT /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated task title",
  "description": "Updated description",
  "category": "Personal",
  "status": "done"
}
```

**Requirements**: Owner or Admin role

#### Reorder / Change Status

Use this endpoint to drag-and-drop tasks within or between columns.

```http
PATCH /api/tasks/:id/reorder
Authorization: Bearer <token>
Content-Type: application/json

{
  "newOrderIndex": 2,
  "newStatus": "in-progress"
}
```

**Requirements**: Owner or Admin role

**Response:**

```json
{
  "id": 1,
  "title": "Complete project documentation",
  "status": "in-progress",
  "orderIndex": 2,
  ...
}
```

#### Delete Task

```http
DELETE /api/tasks/:id
Authorization: Bearer <token>
```

**Requirements**: Owner or Admin role

### Audit Log

#### View Access Logs

Returns a log of all task-related actions (create, update, delete, reorder).

```http
GET /api/audit-log?limit=200
Authorization: Bearer <token>
```

**Requirements**: Owner or Admin role

**Response:**

```json
[
  {
    "timestamp": "2024-01-15T15:30:00Z",
    "userId": 1,
    "action": "TASK_CREATED",
    "details": "Task ID: 2, Title: Review pull request"
  },
  {
    "timestamp": "2024-01-15T16:00:00Z",
    "userId": 1,
    "action": "TASK_UPDATED",
    "details": "Task ID: 1, Updated fields: status"
  }
]
```

---

## Frontend Features

### Task Management Dashboard

The Angular dashboard provides an intuitive interface for managing tasks:

#### Kanban Board

- **Three columns**: To Do, In Progress, Done
- **Drag-and-drop**: Move tasks within a column to reorder, or between columns to change status
- **Real-time updates**: Task counts update as you move items around
- **Visual feedback**: Dragging is disabled during save operations to prevent race conditions

#### Task Operations

- **Create**: Click "+ New Task" to open a modal dialog with a form
- **Edit**: Click the edit icon on any task card (Owner/Admin only)
- **Delete**: Click the delete icon on any task card (Owner/Admin only)
- **Search**: Filter tasks by title or description using the search box
- **Category Filter**: Filter by category using the dropdown

#### Responsive Design

- **Mobile**: Single-column view with collapsible sections
- **Tablet**: Two-column layout
- **Desktop**: Full three-column Kanban board

#### Role-Based UI

- **Owner/Admin**: Full access to create, edit, delete, and reorder tasks
- **Viewer**: Read-only view with all modification buttons hidden

### Authentication Pages

#### Login

- Email and password fields with validation
- Displays error messages for invalid credentials
- Auto-redirects to dashboard on successful login
- Preserves `returnUrl` query parameter for deep linking

#### Register

- Email, password, and organization selection
- Organization dropdown is populated from the API
- Auto-login after successful registration
- Redirects to intended destination or dashboard

---

## Testing Strategy

This project includes comprehensive test coverage for both backend and frontend, focusing on core functionality as required by project.md.

### Backend Testing

We use Jest for backend testing with the following test suites:

**Authentication & Authorization:**

- JWT Strategy validation and user lookup ([jwt.strategy.spec.ts](api/src/app/auth/strategies/jwt.strategy.spec.ts))
- JWT Auth Guard implementation ([jwt-auth.guard.spec.ts](api/src/app/auth/guards/jwt-auth.guard.spec.ts))
- Auth Service (registration, login, password validation) ([auth.service.spec.ts](api/src/app/auth/auth.service.spec.ts))
- Auth Controller endpoints ([auth.controller.spec.ts](api/src/app/auth/auth.controller.spec.ts))

**RBAC & Access Control:**

- Roles Guard with permission enforcement ([roles.guard.spec.ts](auth/src/lib/roles.guard.spec.ts))
- Organization scope utility (hierarchy checks) ([org-scope.util.spec.ts](auth/src/lib/org-scope.util.spec.ts))

**Core Services:**

- Users Service (password hashing, conflict detection) ([users.service.spec.ts](api/src/app/users/users.service.spec.ts))
- Organizations Service (2-level hierarchy, access checks) ([organizations.service.spec.ts](api/src/app/organizations/organizations.service.spec.ts))
- Organizations Controller (CRUD with RBAC) ([organizations.controller.spec.ts](api/src/app/organizations/organizations.controller.spec.ts))
- Tasks Service (CRUD, permission checks) ([tasks.service.spec.ts](api/src/app/tasks/tasks.service.spec.ts))
- Tasks Controller (role-based access) ([tasks.controller.spec.ts](api/src/app/tasks/tasks.controller.spec.ts))
- Audit Service (log recording and retrieval) ([audit.service.spec.ts](api/src/app/audit/audit.service.spec.ts))
- Audit Controller (RBAC for audit logs) ([audit.controller.spec.ts](api/src/app/audit/audit.controller.spec.ts))

Run backend tests:

```bash
npx nx test api
```

### Frontend Testing

We use Jest for frontend testing:

**Authentication & Routing:**

- Auth Guard (protected routes) ([auth.guard.spec.ts](apps/dashboard/src/app/guards/auth.guard.spec.ts))
- Guest Guard (redirect authenticated users) ([guest.guard.spec.ts](apps/dashboard/src/app/guards/guest.guard.spec.ts))
- Auth Interceptor (token attachment) ([auth.interceptor.spec.ts](apps/dashboard/src/app/interceptors/auth.interceptor.spec.ts))
- Auth Service (login, logout, token management) ([auth.service.spec.ts](apps/dashboard/src/app/services/auth.service.spec.ts))

**Components:**

- Login Component (form validation, auth flow) ([login.component.spec.ts](apps/dashboard/src/app/pages/login/login.component.spec.ts))
- Register Component (form validation, org selection) ([register.component.spec.ts](apps/dashboard/src/app/pages/register/register.component.spec.ts))
- Home Component (task loading) ([home.component.spec.ts](apps/dashboard/src/app/pages/home/home.component.spec.ts))
- Task Board Component (status filtering, drag-drop) ([task-board.component.spec.ts](apps/dashboard/src/app/components/task-board/task-board.component.spec.ts))
- Task Card Component (display, events) ([task-card.component.spec.ts](apps/dashboard/src/app/components/task-card/task-card.component.spec.ts))
- Task Editor Component (create/edit forms) ([task-editor.component.spec.ts](apps/dashboard/src/app/components/task-editor/task-editor.component.spec.ts))

**Services:**

- Organizations Service (HTTP calls) ([organizations.service.spec.ts](apps/dashboard/src/app/services/organizations.service.spec.ts))

Run frontend tests:

```bash
npx nx test dashboard
```

Run all tests:

```bash
npx nx run-many --target=test --all
```

### Test Coverage Summary

The test suite covers all critical paths required by project.md:

- ✅ JWT-based authentication and token validation
- ✅ RBAC logic (Roles Guard, organization scoping)
- ✅ API endpoints with permission checks
- ✅ Frontend components and state management
- ✅ Guards and interceptors for route protection
- ✅ Organization hierarchy validation (2-level max)
- ✅ Audit logging functionality

**Note:** These tests focus on essential functionality. For production, consider adding:

- E2E tests with real database
- Performance and load testing
- Integration tests for complete user flows

---

## Building for Production

### Backend

```bash
npx nx build api
```

The compiled output will be in `dist/apps/api/`.

**Important production changes**:

1. Update `api/.env`:

   - Set a strong, unique `JWT_SECRET`
   - Use PostgreSQL instead of SQLite: `DB_TYPE=postgres`
   - Set `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`

2. Disable TypeORM auto-sync and use migrations:

   - Set `synchronize: false` in `database.module.ts`
   - Run migrations: `npm run migration:run`

3. Configure CORS to only allow your frontend origin

4. Enable HTTPS and use environment-appropriate secrets management

### Frontend

```bash
npx nx build dashboard
```

The compiled output will be in `dist/apps/dashboard/`.

Update the API URL in the environment files:

- `apps/dashboard/src/environments/environment.prod.ts`

Serve with a web server like Nginx or deploy to a static hosting service.

---

## Future Enhancements

### Advanced Features

- **Task Completion Visualization**: Add charts/graphs to visualize task completion rates (bonus feature from project.md)
- **Dark/Light Mode Toggle**: Implement theme switching for better UX (bonus feature from project.md)
- **Role Delegation**: Allow Admins to temporarily grant elevated permissions to specific users
- **Task Dependencies**: Link tasks with "blocks" or "depends on" relationships
- **Task Templates**: Create reusable task templates for common workflows
- **Notifications**: Email or in-app notifications when tasks are assigned or completed
- **Advanced Filtering**: Filter by date range, assignee, priority, or custom fields
- **Bulk Operations**: Select multiple tasks and update their status or category at once
- **Task Comments**: Add threaded discussions to tasks
- **File Attachments**: Upload files or images to tasks

### Security Improvements

- **JWT Refresh Tokens**: Implement refresh token rotation to keep users logged in securely
- **CSRF Protection**: Add CSRF tokens when using session-based authentication
- **Rate Limiting**: Prevent brute-force attacks on login endpoints
- **Password Policy**: Enforce minimum password strength requirements
- **Two-Factor Authentication (2FA)**: Add 2FA for enhanced security
- **Audit Log Enhancements**: Store logs in a database for querying and analysis
- **Session Management**: Track active sessions and allow users to revoke access

### Performance & Scalability

- **Pagination**: Implement cursor-based pagination for large task lists
- **Lazy Loading**: Load task details on demand instead of fetching all fields upfront
- **WebSocket Updates**: Real-time task updates when multiple users are collaborating

---

## Common Issues

### Port Already in Use

If you see `EADDRINUSE` errors, another process is using port 3000 or 4200.

Find and kill the process:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### Database Locked (SQLite)

SQLite can lock if multiple processes try to write simultaneously.

Solution: Stop all running instances and restart the API.

### CORS Errors

If the frontend can't reach the API, ensure:

1. The API is running on `http://localhost:3000`
2. The dashboard is configured to use that URL
3. CORS is enabled in `api/src/main.ts` (it should be by default)
