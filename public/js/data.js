// data.js - demo users, real IIT Ropar rooms, initial timetable
var demoUsers = [
  {
    email: "student@iitrpr.ac.in",
    password: "password",
    role: "student",
    name: "Dhakshin K",
    id: "2024AIB1009",
    dept: "B.Tech, AI & Data Engineering"
  },
  {
    email: "riya@iitrpr.ac.in",
    password: "password",
    role: "student",
    name: "Riya Sharma",
    id: "2023CSB1042",
    dept: "B.Tech, Computer Science"
  },
  {
    email: "admin@iitrpr.ac.in",
    password: "password",
    role: "admin",
    name: "Facilities Admin",
    id: "ADMIN-001",
    dept: "Facilities & Estate Office"
  },
  {
    email: "security@iitrpr.ac.in",
    password: "password",
    role: "security",
    name: "Security Staff",
    id: "SEC-001",
    dept: "Main Gate & Academic Block Security"
  }
];

// Real IIT Ropar Rooms (from Seating_Capacity table)
var rooms = [
  { code: "AUDITORIUM", capacity: 250, category: "Auditorium", facilities: ["Auditorium Stage", "PA System", "Central AC", "Dual Projector", "Tiered Seating"] },
  { code: "SRC-005",   capacity: 125, category: "SRC006/SRC005", facilities: ["Smart Board", "Dual Projector", "Central AC", "Tiered Seating", "Mic & PA"] },
  { code: "SRC-006",   capacity: 125, category: "SRC006/SRC005", facilities: ["Smart Board", "Dual Projector", "Central AC", "Tiered Seating", "Mic & PA"] },
  { code: "SRC-102",   capacity: 100, category: "SRC-10X", facilities: ["Smart Board", "Projector", "Central AC", "Whiteboard"] },
  { code: "SRC-106",   capacity: 100, category: "SRC-10X", facilities: ["Smart Board", "Projector", "Central AC", "Whiteboard"] },
  { code: "SRC-107",   capacity: 100, category: "SRC-10X", facilities: ["Smart Board", "Projector", "Central AC", "Whiteboard"] },
  { code: "SRC-001",   capacity: 75,  category: "SRC001,2,3,4", facilities: ["Projector", "Mic & PA", "AC", "Whiteboard"] },
  { code: "SRC-002",   capacity: 75,  category: "SRC001,2,3,4", facilities: ["Projector", "Mic & PA", "AC", "Whiteboard"] },
  { code: "SRC-003",   capacity: 75,  category: "SRC001,2,3,4", facilities: ["Projector", "Mic & PA", "AC", "Whiteboard"] },
  { code: "SRC-004",   capacity: 75,  category: "SRC001,2,3,4", facilities: ["Projector", "Mic & PA", "AC", "Whiteboard"] },
  { code: "S-001",     capacity: 65,  category: "S-XXY", facilities: ["Projector", "AC", "Whiteboard"] },
  { code: "S-002",     capacity: 65,  category: "S-XXY", facilities: ["Projector", "AC", "Whiteboard"] },
  { code: "S-003",     capacity: 65,  category: "S-XXY", facilities: ["Projector", "AC", "Whiteboard"] },
  { code: "S-101",     capacity: 65,  category: "S-XXY", facilities: ["Projector", "AC", "Whiteboard"] },
  { code: "S-102",     capacity: 65,  category: "S-XXY", facilities: ["Projector", "AC", "Whiteboard"] },
  { code: "S-103",     capacity: 65,  category: "S-XXY", facilities: ["Projector", "AC", "Whiteboard"] },
  { code: "S-104",     capacity: 65,  category: "S-XXY", facilities: ["Projector", "AC", "Whiteboard"] },
  { code: "S-105",     capacity: 65,  category: "S-XXY", facilities: ["Projector", "AC", "Whiteboard"] },
  { code: "S-106",     capacity: 65,  category: "S-XXY", facilities: ["Projector", "AC", "Whiteboard"] },
  { code: "S-107",     capacity: 65,  category: "S-XXY", facilities: ["Projector", "AC", "Whiteboard"] },
  { code: "CS-1",      capacity: 50,  category: "ME-X/EE-X/CS-X/CY-X", facilities: ["Projector", "4K Display", "Central AC", "LAN Ports"] },
  { code: "CS-2",      capacity: 50,  category: "ME-X/EE-X/CS-X/CY-X", facilities: ["Projector", "Central AC", "LAN Ports", "Whiteboard"] },
  { code: "CS-SH",     capacity: 50,  category: "Seminar Hall", facilities: ["Seminar Podium", "Dual Projector", "Wireless Mic", "Central AC"] },
  { code: "CY-1",      capacity: 50,  category: "ME-X/EE-X/CS-X/CY-X", facilities: ["Projector", "Mic & PA", "AC", "Whiteboard"] },
  { code: "CY-SH",     capacity: 50,  category: "Seminar Hall", facilities: ["Seminar Podium", "Dual Projector", "Wireless Mic", "Central AC"] },
  { code: "EE-1",      capacity: 50,  category: "ME-X/EE-X/CS-X/CY-X", facilities: ["Projector", "Mic & PA", "AC", "Whiteboard"] },
  { code: "EE-2",      capacity: 50,  category: "ME-X/EE-X/CS-X/CY-X", facilities: ["Projector", "Mic & PA", "AC", "Whiteboard"] },
  { code: "EE-3",      capacity: 50,  category: "ME-X/EE-X/CS-X/CY-X", facilities: ["Projector", "Mic & PA", "AC", "Whiteboard"] },
  { code: "EE-SH",     capacity: 50,  category: "Seminar Hall", facilities: ["Seminar Podium", "Dual Projector", "Wireless Mic", "Central AC"] },
  { code: "ME-1",      capacity: 50,  category: "ME-X/EE-X/CS-X/CY-X", facilities: ["Projector", "Mic & PA", "AC", "Whiteboard"] },
  { code: "ME-2",      capacity: 50,  category: "ME-X/EE-X/CS-X/CY-X", facilities: ["Projector", "Mic & PA", "AC", "Whiteboard"] },
  { code: "ME-SH",     capacity: 50,  category: "Seminar Hall", facilities: ["Seminar Podium", "Dual Projector", "Wireless Mic", "Central AC"] }
];

// Initial fallback timetable
var timetable = [
  { course: "MA101", title: "Maths I (EE-SH)", room: "EE-SH", days: ["Friday"], start: "08:00", end: "08:50" },
  { course: "EE629", title: "Advanced EE (EE-1)", room: "EE-1", days: ["Friday"], start: "09:00", end: "09:50" },
  { course: "EE303", title: "Circuits (SRC-003)", room: "SRC-003", days: ["Friday"], start: "10:00", end: "10:50" },
  { course: "EE533", title: "Power Systems (EE-SH)", room: "EE-SH", days: ["Friday"], start: "11:00", end: "11:50" },
  { course: "PH101", title: "Physics (EE-3)", room: "EE-3", days: ["Monday"], start: "08:00", end: "08:50" },
  { course: "AI101", title: "Intro to AI (AUDITORIUM)", room: "AUDITORIUM", days: ["Monday"], start: "09:00", end: "09:50" },
  { course: "ME201", title: "Thermodynamics (ME-SH)", room: "ME-SH", days: ["Monday"], start: "10:00", end: "10:50" },
  { course: "CE401", title: "Civil Eng (SRC-002)", room: "SRC-002", days: ["Monday"], start: "14:00", end: "14:50" }
];
