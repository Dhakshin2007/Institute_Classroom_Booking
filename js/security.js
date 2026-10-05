// security.js - check-in and check-out

// Validate booking via QR token and mark room as occupied
function checkInBooking(qrToken) {
  var bookings = getBookings();
  var booking  = bookings.find(function (b) { return b.qrToken === qrToken; });

  if (!booking)
    return { success: false, error: "Booking not found. Invalid QR code." };
  if (booking.status !== "Approved")
    return { success: false, error: "Cannot check in. Booking status is " + booking.status + "." };

  booking.status     = "Occupied";
  booking.checkinTime = new Date().toISOString();
  saveBookings(bookings);

  addNotification(
    booking.student,
    "Checked in to " + booking.room + ". Room is now occupied.",
    "success"
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
