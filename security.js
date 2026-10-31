// Validate booking via QR token and mark room as occupied
function checkInBooking(qrToken, bypassDateCheck) {
  if (!qrToken) return { success: false, error: "Please provide a valid QR code token." };
  
  // Extract token ID if full payload like "QR-IITRPR-48291|CS-1|..." was scanned
  var cleanedToken = qrToken.trim();
  if (cleanedToken.indexOf("|") !== -1) {
    cleanedToken = cleanedToken.split("|")[0];
  }

  var bookings = getBookings();
  var booking  = bookings.find(function (b) { return b.qrToken === cleanedToken || b.id === cleanedToken; });

  if (!booking)
    return { success: false, error: "Booking not found. Invalid or unrecognized QR code (" + escapeHtml(cleanedToken) + ")." };
  if (booking.status === "Occupied")
    return { success: false, error: "Room " + booking.room + " is already marked Occupied for this booking." };
  if (booking.status === "Completed")
    return { success: false, error: "This booking has already been completed and checked out." };
  if (booking.status !== "Approved")
    return { success: false, error: "Cannot check in. Booking status is currently " + booking.status + " (must be Approved)." };

  // Date verification check
  var todayStr = getLocalDateString();
  if (!bypassDateCheck && booking.date !== todayStr && !currentSimTime) {
    return {
      success: false,
      dateMismatch: true,
      booking: booking,
      error: "Date mismatch: This booking is for " + formatDate(booking.date) + " (Today is " + formatDate(todayStr) + ")."
    };
  }

  booking.status     = "Occupied";
  booking.checkinTime = new Date().toISOString();
  saveBookings(bookings);

  addNotification(
    booking.student,
    "Checked in to " + booking.room + " by Security. Room is now Occupied.",
    "success"
  );
  addNotification(
    "admin@iitrpr.ac.in",
    booking.studentName + " checked in to " + booking.room + " (" + booking.id + ").",
    "info"
  );

  return { success: true, booking: booking };
}

// Check out a booking and record room condition
function checkOutBooking(bookingId, conditionRemark) {
  var bookings = getBookings();
  var booking  = bookings.find(function (b) { return b.id === bookingId; });

  if (!booking)
    return { success: false, error: "Booking not found." };
  if (booking.status !== "Occupied")
    return { success: false, error: "Cannot check out. Booking status is " + booking.status + "." };

  booking.status          = "Completed";
  booking.checkoutTime    = new Date().toISOString();
  booking.conditionRemark = conditionRemark || "No damage observed";
  saveBookings(bookings);

  addNotification(
    booking.student,
    "Checked out of " + booking.room + ". Room is now available.",
    "info"
  );
  addNotification(
    "admin@iitrpr.ac.in",
    "Room " + booking.room + " checked out by security. Condition: " + booking.conditionRemark,
    "info"
  );

  return { success: true, booking: booking };
}
