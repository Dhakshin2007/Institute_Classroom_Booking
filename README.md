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
- 10-minute handover buffer notice on consecutive bookings
- Booking form with validation, past-time checks, and auto-suggested rooms
- Admin can approve, reject, or suggest alternative room
- Competing pending requests automatically resolved on admin approval
- Student can cancel pending requests or accept/decline alternative suggestions
- Booking status tracking: Pending → Approved → Occupied → Completed (or Cancelled/Rejected)
- Procedural QR code SVG generated on approval
- Security check-in (room becomes occupied) and check-out (room freed)
- Room condition remarks on checkout
- In-app notifications for all booking events
- Live Room Board time simulator for demoing off-hours / weekends
- Multi-tab synchronization via storage events
- localStorage persistence so data survives page refresh

## Demo flow

1. Login as student → go to "Book a Room"
2. Pick date, time → system shows available rooms with capacity and buffer info
3. Select a room, fill purpose → submit
4. Booking shows as PENDING (can be cancelled if needed)
5. Login as admin (or open in second tab) → see pending request → approve it
6. Student dashboard updates automatically → status is APPROVED, view dynamic QR code
7. Login as security → select QR token → simulate scan → room is OCCUPIED
8. Click check-out with condition remark → room is AVAILABLE again
9. Check Home page → use the "Simulate time" buttons to test active class collisions at any hour

## Known limitations

- No real authentication (just demo emails)
- No backend or database (uses browser localStorage)
- No actual email sending (shows simulation notice)
- QR scanning is simulated (no camera access required)
- Timetable uses demo dataset

## Problems faced and solutions

### 1. Handling multiple views with one HTML file

Different roles need different screens but it's all one page. Used a `show()` function that hides/shows sections and dynamically builds the nav bar based on the logged-in user's role.

### 2. Room availability wasn't dynamic

Originally rooms just had static "Available"/"Occupied" labels. Fixed by creating `isRoomAvailable()` which checks both the academic timetable and existing bookings for time overlaps, and warns about 0-minute turnaround with prior classes.

### 3. Actions didn't actually change anything

Buttons like "Approve" and "Check In" just navigated to another page without modifying state. Fixed by storing bookings in localStorage with proper status fields, and making each button actually update the booking status. The full lifecycle now works: Pending → Approved → Occupied → Completed.

### 4. Demonstrating room status outside class hours

Testing on weekends or evenings showed all rooms free because the live clock was outside timetable slots. Added a "Simulate time" toolbar on the Room Board to easily preview how the board behaves during class hours (e.g. Wednesday 1:30 PM).

### 5. Multi-tab synchronization

Opening student and admin in different tabs previously required manual page navigation to see updates. Added a `storage` event listener so changes in one tab immediately refresh the view in other open tabs.
