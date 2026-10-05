// admin.js - approve, reject, suggest alternative

// Change booking status after admin approval
function approveBooking(bookingId) {
  var bookings = getBookings();
  var booking  = bookings.find(function (b) { return b.id === bookingId; });
  if (!booking) return { success: false, error: "Booking not found." };
  if (booking.status !== "Pending")
    return { success: false, error: "Only pending bookings can be approved." };

  booking.status  = "Approved";
  booking.qrToken = "QR-" + booking.id;
  saveBookings(bookings);

  addNotification(
    booking.student,
    "Your " + booking.room + " booking (" + booking.id + ") has been approved. QR code is now available.",
    "success"
  );

  return { success: true, booking: booking };
}

// Reject a booking with an optional remark
function rejectBooking(bookingId, remark) {
  var bookings = getBookings();
  var booking  = bookings.find(function (b) { return b.id === bookingId; });
  if (!booking) return { success: false, error: "Booking not found." };
  if (booking.status !== "Pending")
    return { success: false, error: "Only pending bookings can be rejected." };

  booking.status      = "Rejected";
  booking.adminRemark = remark || "Request declined by admin.";
  saveBookings(bookings);

  addNotification(
    booking.student,
    "Your " + booking.room + " booking (" + booking.id + ") has been rejected. Reason: " + booking.adminRemark,
    "error"
  );

  return { success: true };
}

// Suggest an alternative room for a pending booking
function suggestAlternative(bookingId, alternativeRoom) {
  var bookings = getBookings();
  var booking  = bookings.find(function (b) { return b.id === bookingId; });
  if (!booking) return { success: false, error: "Booking not found." };
  if (booking.status !== "Pending")
    return { success: false, error: "Only pending bookings can receive suggestions." };

  // Verify the alternative room is actually available
  var check = isRoomAvailable(alternativeRoom, booking.date, booking.startTime, booking.endTime);
  if (!check.available)
    return { success: false, error: alternativeRoom + " is also unavailable: " + check.reason };

  booking.status          = "Alternative Suggested";
  booking.alternativeRoom = alternativeRoom;
  saveBookings(bookings);

  addNotification(
    booking.student,
    "Admin suggests " + alternativeRoom + " instead of " + booking.room + " for booking " + booking.id + ".",
    "info"
  );

  return { success: true };
}

// Student accepts the suggested alternative room
function acceptAlternative(bookingId) {
  var bookings = getBookings();
  var booking  = bookings.find(function (b) { return b.id === bookingId; });
  if (!booking || booking.status !== "Alternative Suggested")
    return { success: false, error: "Invalid booking state." };

  var oldRoom          = booking.room;
  booking.room         = booking.alternativeRoom;
  booking.alternativeRoom = null;
  booking.status       = "Approved";
  booking.qrToken      = "QR-" + booking.id;
  saveBookings(bookings);

  addNotification(
    booking.student,
    "Your booking " + booking.id + " has been approved for " + booking.room + ". QR code is now available.",
    "success"
  );
  addNotification(
    "admin@iitrpr.ac.in",
    booking.studentName + " accepted alternative room " + booking.room + " (was " + oldRoom + ") for " + booking.id + ".",
    "info"
  );

  return { success: true };
}

// Student declines the suggested alternative room
function declineAlternative(bookingId) {
  var bookings = getBookings();
  var booking  = bookings.find(function (b) { return b.id === bookingId; });
  if (!booking || booking.status !== "Alternative Suggested")
    return { success: false, error: "Invalid booking state." };

  booking.status          = "Rejected";
  booking.adminRemark     = "Student declined alternative room.";
  booking.alternativeRoom = null;
  saveBookings(bookings);

  addNotification(
    "admin@iitrpr.ac.in",
    booking.studentName + " declined the alternative room for " + booking.id + ".",
    "info"
  );

  return { success: true };
}
