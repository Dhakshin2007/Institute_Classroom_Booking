# 🏛️ IIT Ropar CampuSync — Institutional Venue Reservation Portal

> **A modern, SaaS-grade classroom and venue reservation portal engineered for the Indian Institute of Technology Ropar (IIT Ropar).**  
> Designed and evaluated under rigorous Human-Computer Interaction (HCI) principles for **AI511: Human-Computer Interaction (Lab 6)**.

---

## 🌐 Live Production Deployment

**Experience the platform immediately without any setup or cloning:**

[![Live Website](https://img.shields.io/badge/Deployed%20Portal-iitrpr--campusync.vercel.app-006699?style=for-the-badge&logo=vercel&logoColor=white)](https://iitrpr-campusync.vercel.app/)

🔗 **Live URL:** [https://iitrpr-campusync.vercel.app/](https://iitrpr-campusync.vercel.app/)

---

## 👥 Project Contributors

- **Dhakshin K** — Member
- **J Yeswanth Teja** — Member

*Department of Computer Science & Engineering / Artificial Intelligence*  
*Indian Institute of Technology Ropar (IIT Ropar)*

---

## 🚀 Instant Access (No Cloning or Setup Required!)

You **do not need to clone this repository, install Node.js, run servers, or configure dependencies** to use or evaluate this platform:

1. **Direct Web Access:** Open [https://iitrpr-campusync.vercel.app/](https://iitrpr-campusync.vercel.app/) in any modern web browser on desktop, tablet, or smartphone.
2. **Standalone Offline File:** You can simply download `index.html` (or download this repo as a ZIP file), extract it, and **double-click `index.html`**. 
   - The entire front-end is written in zero-build, pure vanilla HTML5, CSS3, and JavaScript with bundled scripts.
   - Automatically connects to the live Supabase cloud database while retaining full offline fallback capabilities.

---

## 💻 How to Run Locally

If you prefer to run or inspect the code locally, choose any of the methods below:

### Method 1: Direct File Open (Zero Tools Required)
1. Navigate to the `classroom-booking` folder on your computer.
2. Double-click **`index.html`** or right-click and choose **Open with** $\rightarrow$ **Google Chrome / Microsoft Edge / Mozilla Firefox / Safari**.
3. That's it! The application will load instantly.

### Method 2: VS Code Live Server (Recommended for Developers)
1. Open the `classroom-booking` folder in **Visual Studio Code**.
2. Install the **Live Server** extension (by Ritwick Dey) if not already installed.
3. Right-click on `index.html` in the file explorer and click **"Open with Live Server"**.
4. The site will launch automatically at `http://127.0.0.1:5500`.

### Method 3: Python Built-in HTTP Server
Run this single command in your terminal or PowerShell inside the `classroom-booking` folder:
```bash
python -m http.server 3000
```
Then visit: [http://localhost:3000](http://localhost:3000)

### Method 4: Node.js / NPX
If you have Node.js installed, run:
```bash
npx serve .
```
Then open the local URL shown in your terminal.

---

## 🔑 Demo Institutional Credentials

All pre-configured institutional test accounts share the password: **`password`**

| Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Student / Club Lead** | `student@iitrpr.ac.in` | `password` | Search venues, smart recommendations, submit bookings, cancel requests, view printable Gate Pass & QR token, submit 5-star ratings & reviews. |
| **Faculty / Admin** | `admin@iitrpr.ac.in` | `password` | Review pending reservations, approve/reject with mandatory feedback, suggest alternative rooms, view student venue ratings. |
| **Security Guard** | `security@iitrpr.ac.in` | `password` | Real-time token validation, simulated QR scanning, check-in to Occupied state, check-out with room inspection remarks. |

> 🔒 **Security Notice:** In production accordance, all login forms have zero preloaded passwords, feature interactive **password visibility toggles (eye icons)**, and include real-time password strength and match meters on signup.

---

## ✨ Key Features & Institutional Capabilities

### 1. 🧠 Intelligent Venue Suggestion Engine (Hick's Law)
Instead of forcing users to sift through all 32+ campus venues (causing choice paralysis), the booking interface dynamically scores and recommends the top 3–4 best venues based on:
- **Headcount Matching with Near-Capacity Tolerance:** If an event requires 128 seats, the system recognizes that 125-seat lecture halls (e.g., `SRC-005`) are near-perfect matches (~98% fit), flagging them with a **`⚡ Near Capacity Match`** badge rather than rejecting them.
- **Purpose-Specific Tag Matching:** Typing *workshop*, *coding*, *seminar*, *fest*, or *keynote* automatically matches specialized venues (Senate Hall, Seminar Rooms, Computer Labs).
- **Category Filter Pills:** Switch effortlessly between *Top Recommendations*, *Seminar Halls*, *Lecture Theatres (SRC)*, *Dept Classrooms*, or *All 32 Venues*.

### 2. ⭐ Post-Checkout 5-Star Rating & Feedback System
- Once a session is completed and checked out by security, students can rate the venue from 1 to 5 stars.
- Includes quick amenity tags: `Cleanliness`, `Projector / AV`, `Air Conditioning`, `Seating Comfort`, and optional comments.
- Ratings and reviews are stored directly in the backend and displayed on both student and administrative dashboards for continuous facility audits.

### 3. ⏱️ Conflict Detection & Handover Buffer
- Cross-references requests against **1,103 weekly academic timetable slots** and all confirmed bookings.
- Detects time overlaps with minute precision and enforces a **10-minute handover buffer notice** between consecutive sessions to avoid classroom clashes.

### 4. 🎫 End-to-End Lifecycle & Printable Digital Gate Pass
- **Workflow:** `Draft` $\rightarrow$ `Pending Review` $\rightarrow$ `Approved` $\rightarrow$ `Occupied (Checked In)` $\rightarrow$ `Completed (Checked Out)`.
- Generates a procedural vector QR security token upon admin approval.
- Clean `@media print` styles allow students to directly print a clean IIT Ropar Gate Pass (hiding navigation buttons and page clutter).

### 5. ☁️ Live Cloud Database & Multi-Tab Synchronization
- Connected to a live **Supabase PostgreSQL** cloud backend with Realtime change-data capture (`public:bookings`).
- Dual-layer architecture: instantly synchronizes state across multiple tabs and devices, while gracefully operating offline via browser `localStorage` if network connectivity drops.

---

## 🎨 Human-Computer Interaction (HCI) Principles Applied

The system was designed and verified against **Jakob Nielsen's 10 Usability Heuristics**:

1. **Visibility of System Status:** Live status chips (`PENDING`, `APPROVED`, `OCCUPIED`, `COMPLETED`), micro-spinners on auth buttons, and real-time conflict banners.
2. **Match Between System and Real World:** Institutional nomenclature (SRC Lecture Theatres, Senate Hall, Gate Security Pass, Handover Buffers).
3. **User Control & Freedom:** One-click cancellation for pending bookings, modal dismissals with Escape key and backdrop clicks.
4. **Consistency & Standards:** Harmonious institutional color palette (IIT Deep Ink, Academic Brass, Status Teal/Amber/Rust).
5. **Error Prevention:** Past-time booking locks, capacity overload warnings, conflict prevention before submission, and real-time password confirmation hints.
6. **Recognition Over Recall:** Smart room recommendations based on attendee count; pre-populated venue specifications (projector, mic, seating type).
7. **Flexibility & Efficiency of Use:** Category filtering pills for quick venue lookup; one-click demo role switching for evaluators.
8. **Aesthetic & Minimalist Design:** High-contrast SaaS typography, uncluttered card layouts, Hick's Law venue filtering.
9. **Help Users Recognize, Diagnose, and Recover from Errors:** Inline input feedback, clear explanations for booking conflicts, and explicit rejection rationale from administrators.
10. **Help & Documentation:** Contextual tooltips, live room board time simulator, and comprehensive user guides.

---

## 📁 Repository Structure

```
classroom-booking/
├── index.html              # Main single-page institutional application
├── README.md               # Project documentation & setup instructions
├── LICENSE.md              # Open source license
├── slides.md               # Presentation slide deck & speaker notes
├── css/
│   └── style.css           # Institutional design system & print styles
└── js/
    ├── app.js              # Application controller, recommendation engine & ratings
    ├── booking.js          # Availability math, conflict engine & capacity tolerance
    ├── admin.js            # Approval workflows, rejection modals & audit log
    ├── security.js         # QR token verification, check-in & check-out logic
    ├── supabase.js         # Cloud PostgreSQL integration & realtime subscriptions
    ├── data.js             # IIT Ropar venues dataset & timetable constraints
    ├── supabase.min.js     # Bundled Supabase client
    ├── qrcode.min.js       # Bundled QR code generator
    └── html5-qrcode.min.js # Bundled camera barcode reader
```

---

## 🔄 Complete Verification Walkthrough

To test the entire institutional flow in 3 minutes:

1. **Open the Portal:** Go to [https://iitrpr-campusync.vercel.app/](https://iitrpr-campusync.vercel.app/).
2. **Submit a Request (Student):**
   - Log in as `student@iitrpr.ac.in` / `password`.
   - Go to **Book a Venue**. Select tomorrow's date at 14:00 – 16:00.
   - Enter `128` attendees. Notice the smart recommendation suggests `SRC-005 (Cap: 125)` with a `⚡ Near Capacity Match` badge!
   - Submit the booking.
3. **Approve Request (Admin):**
   - Sign in as `admin@iitrpr.ac.in` / `password`.
   - The pending request appears on the Admin Dashboard. Click **Approve**.
4. **View Gate Pass & Token (Student):**
   - Switch back to the student account.
   - The booking is now `APPROVED`. Click **View Gate Pass & QR** to inspect the printable security pass.
5. **Check-In & Check-Out (Security):**
   - Sign in as `security@iitrpr.ac.in` / `password`.
   - Click **Check-In** $\rightarrow$ Status changes to `OCCUPIED`.
   - Click **Check-Out** $\rightarrow$ Enter room inspection notes (e.g., *"AC and lights switched off, all good"*). Status becomes `COMPLETED`.
6. **Submit Rating (Student):**
   - Sign back in as the student.
   - Click **Rate & Review Session** on the completed card.
   - Give 5 stars, select tags (`Cleanliness`, `Projector / AV`), write remarks, and submit.
   - Refresh or log in as Admin to see the rating synchronized in real time!

---

*Developed for AI511 Lab 6 — Indian Institute of Technology Ropar.*
