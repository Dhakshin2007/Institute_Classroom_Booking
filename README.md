# IIT Ropar Classroom Booking System

Prototype web app for booking classrooms at IIT Ropar. Built for AI511 Lab 6.

## How to run

Just open `index.html` in a browser. You can also use VS Code Live Server.

No backend or installation needed - everything runs in the browser.

## Demo accounts

Password for all accounts is `password`

- `student@iitrpr.ac.in` - student view (dashboard, booking form)
- `admin@iitrpr.ac.in` - admin view (approve/reject requests)
- `security@iitrpr.ac.in` - security view (check-in/check-out)

## File structure

```
classroom-booking/
├── index.html        - page structure
├── README.md
├── css/
│   └── style.css     - all styling
└── js/
    ├── data.js       - demo users, rooms, timetable
    ├── booking.js    - room availability, booking creation
    ├── admin.js      - approve/reject/suggest alternative
    ├── security.js   - QR check-in, check-out
    └── app.js        - navigation, rendering, localStorage
```

## What's implemented

- Login with role-based navigation (student/admin/security)
- Academic timetable used as constraint for room availability
- Room conflict detection - checks timetable + existing bookings
- Booking form with validation and auto-suggested rooms
- Admin can approve, reject, or suggest alternative room
- Student can accept/decline alternative suggestions
- Booking status tracking: Pending → Approved → Occupied → Completed
- QR code token generated on approval
- Security check-in (room becomes occupied) and check-out (room freed)
- Room condition remarks on checkout
- In-app notifications for all booking events
- localStorage so data survives page refresh

## Demo flow

1. Login as student → go to "Book a Room"
2. Pick date, time → system shows available rooms
3. Select a room, fill purpose → submit
4. Booking shows as PENDING
5. Login as admin → see pending request → approve it
6. Login as student again → status is now APPROVED, QR code available
7. Login as security → select QR token → simulate scan → room is OCCUPIED
8. Click check-out with condition remark → room is AVAILABLE again

## Known limitations

- No real authentication (just demo emails)
- No backend or database (uses localStorage)
- No actual email sending (just shows a placeholder message)
- QR scanning is simulated (no camera)
- Timetable is hardcoded demo data

## Problems faced and solutions

### 1. Handling multiple views with one HTML file

Different roles need different screens but it's all one page. Used a `show()` function that hides/shows sections and dynamically builds the nav bar based on the logged-in user's role.

### 2. Room availability wasn't dynamic

Originally rooms just had static "Available"/"Occupied" labels. Fixed by creating `isRoomAvailable()` which checks both the academic timetable and existing bookings for time overlaps. The room picker now updates automatically when you change the date or time.

### 3. Actions didn't actually change anything

Buttons like "Approve" and "Check In" just navigated to another page without modifying state. Fixed by storing bookings in localStorage with proper status fields, and making each button actually update the booking status. The full lifecycle now works: Pending → Approved → Occupied → Completed.
