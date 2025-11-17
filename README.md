<p align="left">

  <!-- Backend -->
  <img src="https://skillicons.dev/icons?i=nodejs,express,ts" height="48" alt="Node.js, Express.js, TypeScript" />

  <!-- Frontend -->
  <img src="https://skillicons.dev/icons?i=react" height="48" alt="React" />

  <!-- Database / ORM -->
  <img src="https://skillicons.dev/icons?i=postgres" height="48" alt="PostgreSQL" />
  <img src="https://skillicons.dev/icons?i=sequelize" height="48" alt="Sequelize" />

  <!-- Concurrency / Queue -->
  <img src="https://img.shields.io/badge/BullMQ-red?logo=redis&logoColor=white&style=for-the-badge" height="48" alt="BullMQ" />
  <img src="https://skillicons.dev/icons?i=redis" height="48" alt="Redis" />

  <!-- Tools -->
  <img src="https://skillicons.dev/icons?i=git,github,vscode" height="48" alt="Git, GitHub, VSCode" />

</p>
# Tasky: Enterprise-Grade Concurrency & Task Management Platform

## 🌟 Executive Summary

Tasky is a robust, full-stack task management application engineered for **system reliability and security**. This project serves as an architectural case study, demonstrating proficiency in **asynchronous processing (BullMQ/Redis)** and the implementation of **data-layer Role-Based Access Control (RBAC)** within a Node.js/Express environment.

The platform enforces a three-tiered hierarchy: **Admin**, **Manager**, and **Employee**.
🛡️ 1. Admin Capabilities

Admins have full system-wide visibility and control.
They represent the top tier of the hierarchy.

Admin Can:
✔ View all tasks created in the entire application
✔ Assign tasks to Managers
✔ View all Manager & Employee data, including:
Personal details (name, email, department, salary, lastlogin)
Employment data (salary, role)
✔ Manage user accounts (CRUD operations, role assignments)
✔ Access system-level analytics & monitoring
✔ View background job logs (queue status, failures, retries)
Admin cannot:
✘ Directly assign tasks to Employees (must go through Managers)

👨‍💼 2. Manager Capabilities
Managers operate as mid-level leaders who oversee Employees.
Manager Can:
✔ Work on tasks assigned by Admins
✔ Assign tasks to Employees
✔ View Employee data including: (name, email, department, salary, lastlogin)
✔ Track task progress of their department/team
✔ Approve or reject work submissions (if implemented)
Manager cannot:
✘ View Admins’ private data
✘ View employees from other managers' departments
✘ Assign tasks directly to other Managers or Admins

👷 3. Employee Capabilities
Employees are the task executors inside the system.
Employee Can:
✔ View only the tasks assigned to them by their Manager
✔ Execute tasks and submit task updates
✔ Update task progress (Pending → In Progress → Completed)
Employee cannot:
✘ Assign tasks to anyone
✘ View data of other employees
✘ Access admin/manager dashboards
✘ View tasks not assigned to them

-----
## ⚙️ Technical Architecture & Design Principles

### 1\. Asynchronous Reliability (BullMQ & Redis) ⚡

The application decouples long-running operations from the main HTTP thread using a **BullMQ job queue** managed by a high-performance **Redis** store.

  * **Job Types:** Supports both **Time-Triggered Jobs** .
  * **Resilience:** Features automatic retry logic and failure handling, ensuring background processes are fault-tolerant.

### 2\. High-Assurance Security (Data-Layer RBAC) 🔒

Security constraints are enforced at the point of data access, utilizing the authenticated user's role to scope query results.

  * **Access Control:** The service layer **augments the request with token payload data** and dynamically constructs the query's `WHERE` clause to enforce granular **RBAC**.

### 3\. Data Consistency and Performance

  * **Transactional Guarantees:** All multi-step database operations are wrapped in **Sequelize Transactions** to ensure atomic commits and maintain data consistency.
  * **Scalable Data Retrieval:** Implemented advanced server-side techniques for **Pagination, Filtering, and Dynamic Sorting** to uphold stringent NFRs for response latency.

-----

## 💻 Tech Stack

| Category | Technology | Role in System |
| :--- | :--- | :--- |
| **Backend Core** | Node.js, Express.js | Foundation for the scalable API layer. |
| **Concurrency** | **BullMQ, Redis** | **Decoupled processing engine for background task reliability.** |
| **Database/ORM** | PostgreSQL, Sequelize | Relational persistence and object-relational mapping. |
| **Language** | TypeScript | Ensures type safety and enhances code quality. |

-----

## 🛠️ Installation & Setup

### Prerequisites

  * Node.js (v18+)
  * PostgreSQL Server (Running)
  * **Redis Server** (Critical for BullMQ operation)

### 1\. Dependency Setup

Install required packages in both the backend and frontend directories:

```bash
# Backend dependencies
cd tasky-backend
npm install

# Frontend dependencies
cd ../tasky-frontend
npm install
```

### 2\. Configuration

Create a **`.env`** file in the root directory (or the designated backend location) and configure the following variables:

```bash
PG_HOST=localhost
PG_USER=postgres
PG_PASSWORD=your_password
PG_DATABASE=tasky_db
PG_PORT=5432
JWT_SECRET=your_jwt_secret_key
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=5000
```

### 3\. Database Migration

Run database migrations to set up the schema:

```bash
npx sequelize-cli db:migrate
```

-----

## 🚀 Execution

To run the application, you must start **three separate processes** (Redis server, Backend API, and Worker process).

### Step 1: Start the Redis Server (WSL/Linux)

The Redis server is essential for the BullMQ queue:

```bash
# SSH into WSL/Linux environment
sudo service redis-server start
# Test the connection:
redis-cli ping
```

### Step 2: Start the Backend API Server

This process handles all incoming HTTP requests:

```bash
# Must be in the tasky-backend directory
npm run dev
```

### Step 3: Start the Worker Process

This process is critical for executing all scheduled and background jobs (notifications, cron tasks):

```bash
# Must be in the tasky-backend directory
npm run worker:dev
```

### Step 4: Start the Frontend Server

This process serves the client application:

```bash
# Must be in the tasky-frontend directory
npm run dev
```
