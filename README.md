# Timesheet Tracker

A full-stack Angular + Express timesheet tracking app for logging employee hours, calculating pay, managing departments and employees, and reviewing payroll analytics.

## Quick Start

```bash
# install frontend dependencies
npm install

# install backend dependencies
cd server && npm install

# start MongoDB locally
mongod

# in one terminal: start API
cd server && npm start

# in another terminal: start Angular app
npm start
```

Open the app at http://localhost:4200 and the API at http://localhost:3000.

## Overview

This project includes:

- Department management
- Employee management
- Timesheet entry with hourly rate and total pay calculation
- Analysis dashboard with filters and summaries
- Department and employee totals
- Monthly trend views
- CSV export for payroll reports
- Light/dark theme support
- Persistent storage through MongoDB

## Tech Stack

- Frontend: Angular 21
- Backend: Node.js + Express
- Database: MongoDB with Mongoose
- Styling: custom Angular/CSS layout with dark mode support

## Prerequisites

Before running the app, make sure you have:

- Node.js 18+ installed
- npm installed
- MongoDB running locally or a reachable MongoDB connection string

By default, the app expects MongoDB at:

```text
mongodb://127.0.0.1:27017/timesheet
```

## Project Structure

```text
.
├── angular.json
├── package.json
├── tsconfig.json
├── src/
│   ├── app/
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── server/
│   ├── package.json
│   ├── server.js
│   └── node_modules/
└── README.md
```

## Installation

Install the frontend dependencies:

```bash
npm install
```

Install the backend dependencies:

```bash
cd server
npm install
```

## Environment Configuration

The backend loads environment variables from a `.env` file in the `server` folder if present. You can optionally define a custom MongoDB URI:

```env
MONGO_URI=mongodb://127.0.0.1:27017/timesheet
PORT=3000
```

If you do not set `MONGO_URI`, the app falls back to the local default above.

## Running the Application

### 1. Start MongoDB

Make sure MongoDB is running before starting the server.

For a local installation, this is typically done with:

```bash
mongod
```

### 2. Start the API server

From the project root:

```bash
cd server
npm start
```

The Express API runs on:

```text
http://localhost:3000
```

### 3. Start the Angular app

Open a second terminal and run:

```bash
npm start
```

The Angular frontend runs on:

```text
http://localhost:4200
```

## Main App Pages

- Departments: manage department names
- Employees: manage employee names
- Timesheet Entry: create entries with date, hours, rate, department, and employee
- Analysis: review filtered totals, department summaries, charts, and exportable reports

## API Endpoints

The backend exposes REST endpoints for all main entities.

### Entries

- `GET /api/entries`
- `POST /api/entries`
- `PUT /api/entries/:id`
- `DELETE /api/entries/:id`

### Departments

- `GET /api/departments`
- `POST /api/departments`
- `PUT /api/departments/:id`
- `DELETE /api/departments/:id`

### Employees

- `GET /api/employees`
- `POST /api/employees`
- `PUT /api/employees/:id`
- `DELETE /api/employees/:id`

### Health check

- `GET /api/health`

## Features in Detail

### Timesheet entry

Users can add:

- date
- hours worked
- hourly pay rate
- department
- employee

The app calculates:

```text
totalPay = hours * payAmount
```

### Analysis dashboard

The analysis view supports:

- date range filtering
- department filtering
- employee display in saved entries
- total hours and total pay summaries
- department breakdown totals
- chart-based totals
- CSV export of filtered results

### Data persistence

Entries, departments, and employees are stored in MongoDB and loaded through the Express API. When the API is unavailable, the app includes local fallback behavior to keep the UI responsive.

## Build and Verification

To build the Angular frontend:

```bash
npm run build
```

This compiles the app for production.

## Troubleshooting

### Port already in use

If port 3000 or 4200 is already in use, stop the existing process or change the port in the corresponding server config.

### MongoDB connection issue

Check that MongoDB is running and that your `MONGO_URI` is correct.

### Angular fails to start

Make sure dependencies are installed in the root project and the app is using the correct Node version.

## Notes

This project is designed as a working local payroll and timesheet tracker for development and demo use. It is a good base for adding more reporting, authentication, or broader payroll features.

## Common Commands

```bash
# install frontend deps
npm install

# install backend deps
cd server && npm install

# run backend
cd server && npm start

# run frontend
npm start

# build frontend
npm run build
```
