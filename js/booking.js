// booking.js - availability checking and booking creation

// Convert date string to day name (e.g. "Monday")
function getDayName(dateStr) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date(dateStr + "T00:00:00").getDay()];
}

// Check if two time ranges overlap (times as "HH:MM" strings)
function timesOverlap(s1, e1, s2, e2) {
  return s1 < e2 && s2 < e1;
}

// Check timetable and existing bookings before allowing room selection
function isRoomAvailable(roomCode, date, startTime, endTime) {
  const dayOfWeek = getDayName(date);

  // 1. Check academic timetable conflicts
  for (const entry of timetable) {
    if (entry.room === roomCode && entry.days.includes(dayOfWeek)) {
      if (timesOverlap(startTime, endTime, entry.start, entry.end)) {
        return {
          available: false,
          reason: `Academic class ${entry.course} (${entry.title}) scheduled ${formatTime(entry.start)}–${formatTime(entry.end)}`
        };
      }
    }
  }

  // 2. Check existing approved / occupied / pending bookings
  const allBookings = getBookings();
  for (const b of allBookings) {
    if (
      b.room === roomCode &&
      b.date === date &&
      ["Approved", "Occupied", "Pending"].includes(b.status)
    ) {
      if (timesOverlap(startTime, endTime, b.startTime, b.endTime)) {
        return {
          available: false,
          reason: `Existing ${b.status.toLowerCase()} booking (${b.id})`
        };
      }
    }
  }

  return { available: true };
}

// Return rooms annotated with availability for a given date/time slot
function getAvailableRooms(date, startTime, endTime, attendees) {
  return rooms.map(function (room) {
    const check = isRoomAvailable(room.code, date, startTime, endTime);
    return {
      code: room.code,
      capacity: room.capacity,
      available: check.available,
      reason: check.reason || null,
      capacityOk: !attendees || room.capacity >= parseInt(attendees)
    };
  });
}

// Validate required fields and create a new booking
function validateAndCreateBooking(purpose, attendees, date, startTime, endTime, roomCode, notes) {
  const errors = [];

  if (!purpose || purpose.trim() === "")    errors.push("Purpose is required.");
  if (!date)                                 errors.push("Date is required.");
  if (!startTime)                            errors.push("Start time is required.");
  if (!endTime)                              errors.push("End time is required.");
  if (!roomCode)                             errors.push("No room selected.");
  if (startTime && endTime && startTime >= endTime)
    errors.push("Invalid time range: end time must be after start time.");

  if (errors.length > 0) return { success: false, errors: errors };

  // Final availability check at submit time
  const availability = isRoomAvailable(roomCode, date, startTime, endTime);
  if (!availability.available) {
    const altRooms = getAvailableRooms(date, startTime, endTime, attendees)
      .filter(function (r) { return r.available && r.capacityOk; })
      .map(function (r) { return r.code; });
    const suggestion = altRooms.length > 0 ? " Try " + altRooms.join(" or ") + "." : "";
    errors.push("⚠ " + roomCode + " is unavailable during this time. " + availability.reason + "." + suggestion);
    return { success: false, errors: errors };
  }

  // Build the booking object
  const counter  = getBookingCounter();
  const bookings = getBookings();

  const booking = {
    id:              "IITRPR-" + counter,
    student:         currentUser.email,
    studentName:     currentUser.name,
    studentId:       currentUser.id || "",
    room:            roomCode,
    date:            date,
    startTime:       startTime,
    endTime:         endTime,
    purpose:         purpose,
    attendees:       parseInt(attendees) || 0,
    notes:           notes || "",
    status:          "Pending",
    qrToken:         null,
    checkinTime:     null,
    checkoutTime:    null,
    conditionRemark: null,
    alternativeRoom: null,
    adminRemark:     null,
    createdAt:       new Date().toISOString()
  };

  bookings.push(booking);
  saveBookings(bookings);
  saveBookingCounter(counter + 1);

  // Notify student and admin
  addNotification(
    currentUser.email,
    "Your booking request for " + roomCode + " on " + formatDate(date) + " has been submitted.",
    "info"
  );
  addNotification(
    "admin@iitrpr.ac.in",
    "New booking request " + booking.id + " from " + booking.studentName + " for " + roomCode + ".",
    "info"
  );

  return { success: true, booking: booking };
}
