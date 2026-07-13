# High School Management System Frontend

Modern responsive school management dashboard built with React, Vite, Bootstrap 5, React Router, Axios, React Icons, Chart.js, and Context API.

## Features

- Authentication screens with validation and password recovery flow
- Dashboard summary cards, student statistics charts, recent activities, and quick actions
- Student management with add, edit, delete, details view, search, class filter, and pagination
- Teacher, class, attendance, results, fees, timetable, and reports modules
- Mock JSON-style data in `src/services/mockData.js`
- Reusable sidebar, topbar, footer, cards, tables, toast notifications, and app layout
- Responsive blue and white professional school theme

## Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

```bash
http://localhost:5173/
```

## Useful Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Project Structure

```text
src/
├── assets/
├── components/
│   ├── Navbar/
│   ├── Sidebar/
│   ├── Footer/
│   ├── Cards/
│   └── Tables/
├── pages/
│   ├── Login/
│   ├── Dashboard/
│   ├── Students/
│   ├── Teachers/
│   ├── Classes/
│   ├── Attendance/
│   ├── Results/
│   ├── Fees/
│   ├── Timetable/
│   └── Reports/
├── services/
├── routes/
├── context/
├── layouts/
├── App.jsx
└── main.jsx
```

## Notes

The application currently uses local mock data and Context API state. Connect a backend by replacing mock-data usage with calls through `src/services/api.js`.
