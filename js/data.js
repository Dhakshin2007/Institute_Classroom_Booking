// data.js - demo users, rooms, timetable

// demo accounts for testing
const demoUsers = [
  {
    email: "student@iitrpr.ac.in",
    password: "password",
    role: "student",
    name: "Dhakshin K",
    id: "2024AIB1009",
    dept: "B.Tech, AI & Data Engineering"
  },
  {
    email: "admin@iitrpr.ac.in",
    password: "password",
    role: "admin",
    name: "Admin",
    id: "ADMIN-001",
    dept: "Facilities Office"
  },
  {
    email: "security@iitrpr.ac.in",
    password: "password",
    role: "security",
    name: "Security Staff",
    id: "SEC-001",
    dept: "Campus Security"
  }
];

// rooms
const rooms = [
  { code: "CS-1",  capacity: 80  },
  { code: "LT-2",  capacity: 150 },
  { code: "PCE-1", capacity: 60  },
  { code: "AI-3",  capacity: 45  },
  { code: "CS-SH", capacity: 200 },
  { code: "MA-2",  capacity: 70  }
];

// timetable - checked when booking rooms
const timetable = [
  { course: "MA201",  title: "Linear Algebra",        room: "PCE-1", days: ["Monday", "Wednesday"],  start: "10:00", end: "11:00" },
  { course: "AI301",  title: "Deep Learning",          room: "LT-2",  days: ["Wednesday", "Friday"],  start: "13:00", end: "14:00" },
  { course: "CS111",  title: "Intro to Programming",   room: "CS-1",  days: ["Tuesday", "Thursday"],  start: "15:00", end: "16:00" },
  { course: "EE201",  title: "Signals & Systems",      room: "AI-3",  days: ["Monday", "Wednesday"],  start: "14:00", end: "15:00" },
  { course: "HS101",  title: "English Communication",  room: "CS-SH", days: ["Tuesday"],              start: "10:00", end: "11:00" },
  { course: "MA202",  title: "Probability & Stats",    room: "MA-2",  days: ["Thursday", "Friday"],   start: "09:00", end: "10:00" },
  { course: "CS201",  title: "Data Structures",        room: "CS-SH", days: ["Monday", "Wednesday"],  start: "15:00", end: "16:00" },
  { course: "AI511",  title: "HCI",                    room: "LT-2",  days: ["Tuesday", "Thursday"],  start: "10:00", end: "11:00" }
];
