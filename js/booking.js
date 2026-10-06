// Check if date and time are in the past relative to current system time
function isTimeInPast(dateStr, timeStr) {
  const todayStr = new Date().toISOString().split("T")[0];
  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;
  const now = new Date();
  const currentHHMM = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  return timeStr <= currentHHMM;
}

// Convert date string to day name (e.g. "Monday")
function getDayName(dateStr) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date(dateStr + "T00:00:00").getDay()];
}

// Convert "HH:MM" to minutes from midnight
function timeToMinutes(t) {
  const parts = t.split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

// Check if two time ranges overlap (times as "HH:MM" strings)
function timesOverlap(s1, e1, s2, e2) {
  return s1 < e2 && s2 < e1;
}

// Check if two intervals are consecutive within a buffer (default 10 minutes)
function hasBufferCollision(s1, e1, s2, e2, bufferMins) {
  bufferMins = bufferMins || 10;
  const start1 = timeToMinutes(s1);
  const end1   = timeToMinutes(e1);
  const start2 = timeToMinutes(s2);
  const end2   = timeToMinutes(e2);

  // Exact back-to-back or gap less than buffer
  if (end1 === start2 || (start2 > end1 && start2 - end1 < bufferMins)) return "after";
  if (end2 === start1 || (start1 > end2 && start1 - end2 < bufferMins)) return "before";
  return null;
}

// Check timetable and existing bookings before allowing room selection
function isRoomAvailable(roomCode, date, startTime, endTime) {
  const dayOfWeek = getDayName(date);
  let bufferNotice = null;
  let pendingCount = 0;

  // 1. Check academic timetable conflicts
  for (const entry of timetable) {
    if (entry.room === roomCode && entry.days.includes(dayOfWeek)) {
      if (timesOverlap(startTime, endTime, entry.start, entry.end)) {
        return {
          available: false,
          reason: `Academic class ${entry.course} (${entry.title}) scheduled ${formatTime(entry.start)}–${formatTime(entry.end)}`
        };
      }
      const buff = hasBufferCollision(startTime, endTime, entry.start, entry.end, 10);
      if (buff && !bufferNotice) {
        bufferNotice = `Back-to-back with ${entry.course} (${formatTime(entry.start)}–${formatTime(entry.end)}) - 0 min handover buffer`;
      }
    }
  }

  // 2. Check existing approved and occupied bookings (hard locks)
  const allBookings = getBookings();
  for (const b of allBookings) {
    if (b.room === roomCode && b.date === date && ["Approved", "Occupied"].includes(b.status)) {
      if (timesOverlap(startTime, endTime, b.startTime, b.endTime)) {
        return {
          available: false,
          reason: `Already booked (${b.status.toLowerCase()}) for "${b.purpose}" (${formatTime(b.startTime)}–${formatTime(b.endTime)})`
        };
      }
      const buff = hasBufferCollision(startTime, endTime, b.startTime, b.endTime, 10);
      if (buff && !bufferNotice) {
        bufferNotice = `Back-to-back with booking ${b.id} (${formatTime(b.startTime)}–${formatTime(b.endTime)})`;
      }
    } else if (b.room === roomCode && b.date === date && b.status === "Pending") {
      if (timesOverlap(startTime, endTime, b.startTime, b.endTime)) {
        pendingCount++;
      }
    }
  }

  return {
    available: true,
    bufferNotice: bufferNotice,
    pendingCount: pendingCount
  };
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
      bufferNotice: check.bufferNotice || null,
      pendingCount: check.pendingCount || 0,
      capacityOk: !attendees || room.capacity >= parseInt(attendees, 10)
    };
  });
}

// Cancel a booking by student (only if Pending or Alternative Suggested)
function cancelBooking(bookingId) {
  const bookings = getBookings();
  const booking = bookings.find(function (b) { return b.id === bookingId; });
  if (!booking) return { success: false, error: "Booking not found." };
  if (!["Pending", "Alternative Suggested"].includes(booking.status)) {
    return { success: false, error: "Only pending requests can be cancelled." };
  }

  booking.status = "Cancelled";
  booking.cancelledAt = new Date().toISOString();
  saveBookings(bookings);

  addNotification(
    "admin@iitrpr.ac.in",
    `${booking.studentName} cancelled booking request ${booking.id} for ${booking.room}.`,
    "info"
  );
  addNotification(
    booking.student,
    `Your booking request ${booking.id} for ${booking.room} was cancelled.`,
    "info"
  );

  return { success: true };
}

// Validate required fields and create a new booking
function validateAndCreateBooking(purpose, attendees, date, startTime, endTime, roomCode, notes) {
  const errors = [];

  if (!purpose || purpose.trim() === "") errors.push("Purpose is required.");
  if (!date) errors.push("Date is required.");
  if (!startTime) errors.push("Start time is required.");
  if (!endTime) errors.push("End time is required.");
  if (!roomCode) errors.push("No room selected.");
  if (startTime && endTime && startTime >= endTime) {
    errors.push("Invalid time range: end time must be after start time.");
  }
  if (date && startTime && isTimeInPast(date, startTime)) {
    errors.push(`Start time (${formatTime(startTime)}) cannot be in the past for selected date.`);
  }

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

  // Prevent same user from submitting duplicate pending requests for the exact same slot
  const allBookings = getBookings();
  const duplicate = allBookings.find(function (b) {
    return b.student === currentUser.email &&
      b.room === roomCode &&
      b.date === date &&
      b.status === "Pending" &&
      timesOverlap(startTime, endTime, b.startTime, b.endTime);
  });
  if (duplicate) {
    errors.push(`You already have a pending booking (${duplicate.id}) for ${roomCode} at this time.`);
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
    attendees:       parseInt(attendees, 10) || 0,
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
