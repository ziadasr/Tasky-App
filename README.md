That run script provides crucial details about running the backend, worker, and frontend separately, especially the dependency on WSL/Linux for the Redis server.

Here is the complete, professionally edited `README.md` file, incorporating your specific run commands and the previous content.

-----

# Tasky: Enterprise-Grade Concurrency & Task Management Platform

## 🌟 Executive Summary

Tasky is a robust, full-stack task management application engineered for **system reliability and security**. This project serves as an architectural case study, demonstrating proficiency in **asynchronous processing (BullMQ/Redis)** and the implementation of **data-layer Role-Based Access Control (RBAC)** within a Node.js/Express environment.

The platform enforces a three-tiered hierarchy: **Admin**, **Manager**, and **Employee**.

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
