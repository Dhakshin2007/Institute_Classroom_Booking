// app.js - navigation, shared state, rendering

// Shared State
var currentUser  = null;
var selectedRoom = null;

// localStorage Helpers
function getBookings() {
  return JSON.parse(localStorage.getItem("bookings")) || [];
}
function saveBookings(b) {
  localStorage.setItem("bookings", JSON.stringify(b));
}
function getBookingCounter() {
  return JSON.parse(localStorage.getItem("bookingCounter")) || 48291;
}
function saveBookingCounter(c) {
  localStorage.setItem("bookingCounter", JSON.stringify(c));
}
function getNotifications() {
  return JSON.parse(localStorage.getItem("notifications")) || [];
}
function saveNotifications(n) {
  localStorage.setItem("notifications", JSON.stringify(n));
}

// Notification Helpers
function addNotification(recipient, text, type) {
  var notifs = getNotifications();
  notifs.unshift({
    recipient: recipient,
    text: text,
    type: type || "info",
    time: new Date().toISOString(),
    read: false
  });
  saveNotifications(notifs);
  updateNotifBadge();
} 

function markNotificationsRead() {
  if (!currentUser) return;
  var notifs = getNotifications();
  var changed = false;
  notifs.forEach(function (n) {
    if (n.recipient === currentUser.email && !n.read) {
      n.read = true;
      changed = true;
    }
  });
  if (changed) saveNotifications(notifs);
}

function getUnreadCount() {
  if (!currentUser) return 0;
  return getNotifications().filter(function (n) {
    return n.recipient === currentUser.email && !n.read;
  }).length;
}

function updateNotifBadge() {
  var badge = document.getElementById("notif-badge");
  if (!badge) return;
  var count = getUnreadCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
}

// Formatting Helpers
function formatDate(dateStr) {
  if (!dateStr) return "";
  var d = new Date(dateStr + "T00:00:00");
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  var parts = timeStr.split(":");
  var h = parseInt(parts[0]);
  var m = parts[1];
  var ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return h + ":" + m + " " + ampm;
}

function timeAgo(isoStr) {
  var diff = Date.now() - new Date(isoStr).getTime();
  var mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + " min ago";
  var hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  return Math.floor(hrs / 24) + "d ago";
}

// Toast Notifications
function showToast(message, type) {
  var container = document.getElementById("toast-container");
  if (!container) return;
  var toast = document.createElement("div");
  toast.className = "toast " + (type || "info");
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function () {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(40px)";
    toast.style.transition = "all 0.3s";
    setTimeout(function () { toast.remove(); }, 300);
  }, 3500);
}

// Navigation
function show(id) {
  document.querySelectorAll(".page").forEach(function (x) { x.classList.remove("active"); });
  document.getElementById(id).classList.add("active");

  document.querySelectorAll("nav.tabs button").forEach(function (b) { b.classList.remove("current"); });
  var navBtn = document.querySelector('nav.tabs button[data-target="' + id + '"]');
  if (navBtn) {
    navBtn.classList.add("current");
  } else {
    // Secondary pages map back to a parent tab
    var parent = id === "calendar" ? "dash" : id === "confirm" ? "book" : null;
    if (parent) {
      var p = document.querySelector('nav.tabs button[data-target="' + parent + '"]');
      if (p) p.classList.add("current");
    }
  }

  // Refresh content on page show
  if (id === "dash")          renderStudentDashboard();
  if (id === "admin")         renderAdminDashboard();
  if (id === "security")      renderSecurityPage();
  if (id === "notifications") { markNotificationsRead(); updateNotifBadge(); renderNotifications(); }
  if (id === "home")          renderBoard();
  if (id === "book")          renderBookingForm();
  if (id === "calendar")      renderTimetable();

  window.scrollTo(0, 0);
}

function updateNav() {
  var nav = document.getElementById("main-nav");
  var userInfo = document.getElementById("user-info");

  if (!currentUser) {
    nav.innerHTML = "";
    userInfo.innerHTML = "";
    return;
  }

  var tabs = "";

  tabs += '<button data-target="home" onclick="show(\'home\')">Home</button>';

  if (currentUser.role === "student") {
    tabs += '<button data-target="dash" onclick="show(\'dash\')">Dashboard</button>';
    tabs += '<button data-target="book" onclick="show(\'book\')">Book a Room</button>';
  }
  if (currentUser.role === "admin") {
    tabs += '<button data-target="admin" onclick="show(\'admin\')">Admin Dashboard</button>';
  }
  if (currentUser.role === "security") {
    tabs += '<button data-target="security" onclick="show(\'security\')">Security</button>';
  }

  tabs += '<button data-target="notifications" onclick="show(\'notifications\')" style="position:relative">Notifications <span class="nav-badge" id="notif-badge" style="display:none">0</span></button>';

  nav.innerHTML = tabs;

  userInfo.innerHTML =
    "<strong>" + currentUser.name + "</strong> " +
    '<span style="color:var(--muted)">(' + currentUser.role + ')</span> ' +
    '<button class="btn-logout" onclick="logout()">Logout</button>';

  updateNotifBadge();
}

// Login / Logout
function handleLogin() {
  var email = document.getElementById("login-email").value.trim().toLowerCase();
  var password = document.getElementById("login-password").value;
  var errorEl = document.getElementById("login-error");

  if (!email || !password) {
    errorEl.textContent = "Please enter email and password.";
    return;
  }

  var user = demoUsers.find(function (u) {
    return u.email === email && u.password === password;
  });

  if (!user) {
    errorEl.textContent = "Invalid credentials. Use a demo account.";
    return;
  }

  errorEl.textContent = "";
  currentUser = {
    email: user.email,
    role: user.role,
    name: user.name,
    id: user.id,
    dept: user.dept
  };

  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  updateNav();

  // Navigate to role-appropriate page
  if (currentUser.role === "student")  show("dash");
  else if (currentUser.role === "admin")    show("admin");
  else if (currentUser.role === "security") show("security");

  showToast("Welcome, " + currentUser.name + "!", "success");
}

function logout() {
  currentUser = null;
  selectedRoom = null;
  localStorage.removeItem("currentUser");
  updateNav();
  show("login");
  showToast("Logged out successfully.", "info");
}

// Room Board (Home Page)
function getRoomStatus(roomCode) {
  var now = new Date();
  var hh = String(now.getHours()).padStart(2, "0");
  var mm = String(now.getMinutes()).padStart(2, "0");
  var currentTime = hh + ":" + mm;
  var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var today = days[now.getDay()];
  var todayDate = now.toISOString().split("T")[0];

  // Check timetable
  for (var i = 0; i < timetable.length; i++) {
    var entry = timetable[i];
    if (entry.room === roomCode && entry.days.indexOf(today) !== -1) {
      if (currentTime >= entry.start && currentTime < entry.end) {
        return { status: "busy", label: entry.course + " until " + formatTime(entry.end) };
      }
      // Upcoming within 30 minutes
      var startMin = parseInt(entry.start.split(":")[0]) * 60 + parseInt(entry.start.split(":")[1]);
      var curMin = parseInt(hh) * 60 + parseInt(mm);
      if (startMin > curMin && startMin - curMin <= 30) {
        return { status: "soon", label: entry.course + " in " + (startMin - curMin) + " min" };
      }
    }
  }

  // Check bookings
  var bookings = getBookings();
  for (var j = 0; j < bookings.length; j++) {
    var b = bookings[j];
    if (b.room === roomCode && b.date === todayDate) {
      if (b.status === "Occupied") {
        return { status: "busy", label: "Occupied until " + formatTime(b.endTime) };
      }
      if (b.status === "Approved" && currentTime >= b.startTime && currentTime < b.endTime) {
        return { status: "soon", label: "Booked " + formatTime(b.startTime) + "–" + formatTime(b.endTime) };
      }
    }
  }

  return { status: "free", label: "Available now" };
}

function renderBoard() {
  var el = document.getElementById("board-rows");
  if (!el) return;

  var statusMeta = {
    free: { cls: "s-free" },
    soon: { cls: "s-soon" },
    busy: { cls: "s-busy" }
  };

  el.innerHTML = rooms.map(function (r) {
    var info = getRoomStatus(r.code);
    var m = statusMeta[info.status];
    return '<div class="room-row ' + m.cls + '">' +
      '<span class="room-code">' + r.code + '</span>' +
      '<span class="room-cap">Capacity ' + r.capacity + '</span>' +
      '<span class="status-dot"></span>' +
      '<span class="status-text">' + info.label + '</span>' +
      '</div>';
  }).join("");

  document.getElementById("board-time").textContent =
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Student Dashboard
function renderStudentDashboard() {
  if (!currentUser || currentUser.role !== "student") return;

  var nameEl = document.getElementById("dash-name");
  var deptEl = document.getElementById("dash-dept");
  if (nameEl) nameEl.textContent = "Hi, " + currentUser.name;
  if (deptEl) deptEl.textContent = currentUser.dept;

  var bookings = getBookings().filter(function (b) { return b.student === currentUser.email; });
  var pending  = bookings.filter(function (b) { return b.status === "Pending"; }).length;
  var approved = bookings.filter(function (b) { return b.status === "Approved"; }).length;

  // Stats
  var statsEl = document.getElementById("dash-stats");
  if (statsEl) {
    var todayClasses = getTodayClasses().length;
    var availNow = rooms.filter(function (r) { return getRoomStatus(r.code).status === "free"; }).length;
    var latestBooking = bookings.length > 0 ? bookings[bookings.length - 1] : null;
    var latestStatus = latestBooking ? getStatusBadge(latestBooking.status) : '<span class="badge badge-ink">None</span>';
    var latestSub = latestBooking ? latestBooking.room + " · " + formatDate(latestBooking.date) : "No bookings yet";

    statsEl.innerHTML =
      '<div class="card stat-card"><div class="stat-label">Today\'s classes</div><div class="stat-num">' + todayClasses + '</div><div class="stat-sub">Academic schedule</div></div>' +
      '<div class="card stat-card"><div class="stat-label">Available rooms</div><div class="stat-num">' + availNow + '</div><div class="stat-sub">Across campus, right now</div></div>' +
      '<div class="card stat-card"><div class="stat-label">Latest booking</div><div class="stat-num" style="font-size:20px;margin-top:6px">' + latestStatus + '</div><div class="stat-sub">' + latestSub + '</div></div>';
  }

  // Today's timetable
  var ttEl = document.getElementById("dash-timetable");
  if (ttEl) {
    var todayEntries = getTodayClasses();
    if (todayEntries.length === 0) {
      ttEl.innerHTML = '<div class="empty-state"><div class="icon">📚</div>No classes today</div>';
    } else {
      ttEl.innerHTML = todayEntries.map(function (e) {
        return '<div class="tl-row"><div class="tl-time">' + formatTime(e.start) + '</div><div class="tl-body"><strong>' + e.course + ' · ' + e.title + '</strong><span>Room ' + e.room + '</span></div></div>';
      }).join("");
    }
  }

  // My bookings list
  var listEl = document.getElementById("dash-bookings");
  if (listEl) {
    if (bookings.length === 0) {
      listEl.innerHTML = '<div class="empty-state"><div class="icon">📋</div>No bookings yet. <a href="#" onclick="show(\'book\');return false">Request a room</a>.</div>';
    } else {
      listEl.innerHTML = bookings.slice().reverse().map(function (b) {
        var actions = "";
        if (b.status === "Alternative Suggested") {
          actions = '<div class="actions">' +
            '<p style="font-size:13px;color:var(--amber);margin:6px 0">Admin suggests: <strong>' + b.alternativeRoom + '</strong> instead of ' + b.room + '</p>' +
            '<button class="btn btn-teal btn-sm" onclick="handleAcceptAlt(\'' + b.id + '\')">Accept</button> ' +
            '<button class="btn btn-ghost btn-sm" onclick="handleDeclineAlt(\'' + b.id + '\')">Decline</button>' +
            '</div>';
        }
        if (b.status === "Approved" && b.qrToken) {
          actions = '<div class="actions"><button class="btn btn-ghost btn-sm" onclick="showQR(\'' + b.id + '\')">View QR Code</button></div>';
        }
        if (b.status === "Rejected" && b.adminRemark) {
          actions = '<div class="actions"><p style="font-size:13px;color:var(--rust);margin:4px 0">Reason: ' + b.adminRemark + '</p></div>';
        }

        return '<div class="booking-card">' +
          '<h3>' + b.purpose + '</h3>' +
          '<div class="meta"><span>🏫 ' + b.room + '</span><span>📅 ' + formatDate(b.date) + '</span><span>🕐 ' + formatTime(b.startTime) + ' – ' + formatTime(b.endTime) + '</span></div>' +
          getStatusBadge(b.status) +
          actions +
          '</div>';
      }).join("");
    }
  }
}

function getTodayClasses() {
  var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var today = days[new Date().getDay()];
  return timetable.filter(function (e) { return e.days.indexOf(today) !== -1; })
    .sort(function (a, b) { return a.start.localeCompare(b.start); });
}

function getStatusBadge(status) {
  var map = {
    "Pending":                '<span class="badge badge-amber">PENDING</span>',
    "Approved":               '<span class="badge badge-teal">APPROVED</span>',
    "Rejected":               '<span class="badge badge-rust">REJECTED</span>',
    "Alternative Suggested":  '<span class="badge badge-amber">ALTERNATIVE SUGGESTED</span>',
    "Occupied":               '<span class="badge badge-rust">OCCUPIED</span>',
    "Completed":              '<span class="badge badge-ink">COMPLETED</span>'
  };
  return map[status] || '<span class="badge badge-ink">' + status + '</span>';
}

// Show QR for approved booking
function showQR(bookingId) {
  var bookings = getBookings();
  var booking = bookings.find(function (b) { return b.id === bookingId; });
  if (!booking) return;
  renderConfirmation(booking);
  show("confirm");
}

// Timetable Calendar
function renderTimetable() {
  var tbody = document.getElementById("timetable-body");
  if (!tbody) return;

  var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  var todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];

  var rows = [];
  days.forEach(function (day) {
    var entries = timetable.filter(function (e) { return e.days.indexOf(day) !== -1; })
      .sort(function (a, b) { return a.start.localeCompare(b.start); });
    entries.forEach(function (e) {
      var isToday = day === todayName;
      rows.push('<tr' + (isToday ? ' class="today"' : '') + '><td>' + day + '</td><td>' + formatTime(e.start) + '–' + formatTime(e.end) + '</td><td>' + e.course + ' · ' + e.title + '</td><td>' + e.room + '</td></tr>');
    });
  });

  tbody.innerHTML = rows.join("");
}

// Booking Form
function renderBookingForm() {
  selectedRoom = null;
  var errorEl = document.getElementById("book-errors");
  if (errorEl) errorEl.innerHTML = "";

  // Set min date to today
  var dateInput = document.getElementById("f-date");
  if (dateInput) {
    dateInput.min = new Date().toISOString().split("T")[0];
  }

  updateRoomPicker();
}

function updateRoomPicker() {
  var date = document.getElementById("f-date").value;
  var startTime = document.getElementById("f-start").value;
  var endTime = document.getElementById("f-end").value;
  var attendees = document.getElementById("f-attendees").value;
  var el = document.getElementById("room-picker");

  if (!date || !startTime || !endTime) {
    el.innerHTML = '<div class="empty-state" style="grid-column:1/-1;padding:20px"><div class="icon">📅</div>Select date, start time, and end time to see available rooms.</div>';
    selectedRoom = null;
    return;
  }

  if (startTime >= endTime) {
    el.innerHTML = '<div class="empty-state" style="grid-column:1/-1;padding:20px"><div class="icon">⚠️</div>End time must be after start time.</div>';
    selectedRoom = null;
    return;
  }

  var roomList = getAvailableRooms(date, startTime, endTime, attendees);
  selectedRoom = null;

  el.innerHTML = roomList.map(function (r) {
    var disabled = !r.available;
    var capWarn = r.available && !r.capacityOk;
    var statusLine = "";

    if (disabled) {
      statusLine = r.reason || "Occupied";
    } else if (capWarn) {
      statusLine = "Capacity " + r.capacity + " · ⚠ Below expected attendees";
    } else {
      statusLine = "Capacity " + r.capacity + " · Available";
    }

    return '<button type="button" class="room-option ' + (disabled ? 'disabled' : '') + '" ' +
      (disabled ? 'disabled' : '') + ' data-room="' + r.code + '" onclick="selectRoom(\'' + r.code + '\')">' +
      '<div class="rn">' + r.code + '</div>' +
      '<div class="rd">' + statusLine + '</div>' +
      '</button>';
  }).join("");
}

function selectRoom(code) {
  selectedRoom = code;
  document.querySelectorAll(".room-option").forEach(function (b) { b.classList.remove("selected"); });
  var btn = document.querySelector('.room-option[data-room="' + code + '"]');
  if (btn) btn.classList.add("selected");
}

function handleBookingSubmit() {
  var purpose   = document.getElementById("f-purpose").value;
  var attendees = document.getElementById("f-attendees").value;
  var date      = document.getElementById("f-date").value;
  var startTime = document.getElementById("f-start").value;
  var endTime   = document.getElementById("f-end").value;
  var notes     = document.getElementById("f-notes").value;
  var errorEl   = document.getElementById("book-errors");

  var result = validateAndCreateBooking(purpose, attendees, date, startTime, endTime, selectedRoom, notes);

  if (!result.success) {
    errorEl.innerHTML = '<div class="error-box"><strong>Please fix the following:</strong><ul>' +
      result.errors.map(function (e) { return "<li>" + e + "</li>"; }).join("") +
      '</ul></div>';
    return;
  }

  errorEl.innerHTML = "";
  showToast("Booking request submitted!", "success");

  // Show confirmation
  renderConfirmation(result.booking);
  show("confirm");

  // Clear form
  document.getElementById("f-purpose").value = "";
  document.getElementById("f-attendees").value = "";
  document.getElementById("f-date").value = "";
  document.getElementById("f-start").value = "";
  document.getElementById("f-end").value = "";
  document.getElementById("f-notes").value = "";
  selectedRoom = null;
}

// Confirmation Page
function renderConfirmation(booking) {
  var el = document.getElementById("confirm-content");
  if (!el) return;

  var isPending = booking.status === "Pending";
  var ringClass = isPending ? "check-ring pending" : "check-ring";
  var ringIcon  = isPending ? "⏳" : "✓";
  var title     = isPending ? "Booking submitted" : "Booking confirmed";

  var qrHtml = "";
  if (booking.qrToken) {
    qrHtml = '<div class="qr" role="img" aria-label="Booking QR code"></div>' +
      '<p class="confirm-detail" style="font-size:12px;color:var(--muted)">QR Token: ' + booking.qrToken + '</p>';
  } else {
    qrHtml = '<p class="confirm-detail" style="color:var(--amber)">QR code will be available after admin approval.</p>';
  }

  var emailLine = '<p class="confirm-detail" style="font-size:13px;color:var(--muted);margin-top:12px">Email notification queued for ' + booking.student + '</p>';

  el.innerHTML =
    '<div class="' + ringClass + '">' + ringIcon + '</div>' +
    '<h1 style="font-size:24px">' + title + '</h1>' +
    getStatusBadge(booking.status) +
    '<h2 style="margin-top:16px;font-size:26px">' + booking.room + '</h2>' +
    '<p class="confirm-detail">' + formatDate(booking.date) + ' · ' + formatTime(booking.startTime) + ' – ' + formatTime(booking.endTime) + '</p>' +
    '<p class="confirm-detail">' + booking.purpose + '</p>' +
    qrHtml +
    '<div class="booking-id">' + booking.id + '</div>' +
    emailLine;
}

// Admin Dashboard
function renderAdminDashboard() {
  if (!currentUser || currentUser.role !== "admin") return;

  var bookings = getBookings();
  var pending  = bookings.filter(function (b) { return b.status === "Pending"; });
  var all      = bookings;

  // Stats
  var statsEl = document.getElementById("admin-stats");
  if (statsEl) {
    var approvedToday = bookings.filter(function (b) {
      return b.status === "Approved" && b.createdAt && b.createdAt.startsWith(new Date().toISOString().split("T")[0]);
    }).length;

    statsEl.innerHTML =
      '<div class="card stat-card"><div class="stat-label">Pending requests</div><div class="stat-num">' + pending.length + '</div><div class="stat-sub">Awaiting review</div></div>' +
      '<div class="card stat-card"><div class="stat-label">Total bookings</div><div class="stat-num">' + all.length + '</div><div class="stat-sub">All time</div></div>' +
      '<div class="card stat-card"><div class="stat-label">Approved today</div><div class="stat-num">' + approvedToday + '</div><div class="stat-sub">Today\'s approvals</div></div>';
  }

  // Pending requests list
  var listEl = document.getElementById("admin-pending");
  if (listEl) {
    if (pending.length === 0) {
      listEl.innerHTML = '<div class="empty-state"><div class="icon">✅</div>No pending requests.</div>';
    } else {
      listEl.innerHTML =
        '<div class="req-row" style="font-size:12.5px;color:var(--muted);font-weight:600;padding-bottom:12px;border-bottom:1px solid var(--line-soft)">' +
        '<div>Student</div><div>Room</div><div>Time</div><div>Purpose</div><div></div></div>' +
        pending.map(function (b) {
          return '<div class="req-row">' +
            '<div><div class="req-name">' + b.studentName + '</div><div class="req-id">' + b.studentId + ' · ' + b.id + '</div></div>' +
            '<div><span class="badge badge-amber">' + b.room + '</span></div>' +
            '<div>' + formatDate(b.date) + '<br>' + formatTime(b.startTime) + '–' + formatTime(b.endTime) + '</div>' +
            '<div>' + b.purpose + (b.attendees ? ' (' + b.attendees + ' ppl)' : '') + '</div>' +
            '<div class="req-actions">' +
            '<button class="btn btn-teal btn-sm" onclick="handleApprove(\'' + b.id + '\')">Approve</button>' +
            '<button class="btn btn-rust btn-sm" onclick="handleReject(\'' + b.id + '\')">Reject</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="handleShowSuggest(\'' + b.id + '\')">Suggest Alt</button>' +
            '</div></div>';
        }).join("");
    }
  }

  // All bookings list
  var allEl = document.getElementById("admin-all");
  if (allEl) {
    if (all.length === 0) {
      allEl.innerHTML = '<div class="empty-state"><div class="icon">📋</div>No bookings yet.</div>';
    } else {
      allEl.innerHTML = all.slice().reverse().map(function (b) {
        return '<div class="booking-card">' +
          '<div style="display:flex;justify-content:space-between;align-items:start">' +
          '<div><h3>' + b.purpose + '</h3>' +
          '<div class="meta"><span>' + b.studentName + '</span><span>🏫 ' + b.room + '</span><span>📅 ' + formatDate(b.date) + '</span><span>🕐 ' + formatTime(b.startTime) + '–' + formatTime(b.endTime) + '</span></div></div>' +
          '<div>' + getStatusBadge(b.status) + '</div></div>' +
          (b.conditionRemark ? '<p style="font-size:12px;color:var(--muted);margin:6px 0 0">Room condition: ' + b.conditionRemark + '</p>' : '') +
          '</div>';
      }).join("");
    }
  }

  // Suggest alternative modal
  var suggestEl = document.getElementById("suggest-modal");
  if (suggestEl) suggestEl.style.display = "none";
}

function handleApprove(bookingId) {
  var result = approveBooking(bookingId);
  if (result.success) {
    showToast("Booking " + bookingId + " approved.", "success");
    renderAdminDashboard();
  } else {
    showToast(result.error, "error");
  }
}

function handleReject(bookingId) {
  var remark = prompt("Rejection reason (optional):");
  var result = rejectBooking(bookingId, remark || "Request declined by admin.");
  if (result.success) {
    showToast("Booking " + bookingId + " rejected.", "info");
    renderAdminDashboard();
  } else {
    showToast(result.error, "error");
  }
}

function handleShowSuggest(bookingId) {
  var suggestEl = document.getElementById("suggest-modal");
  if (!suggestEl) return;

  var bookings = getBookings();
  var booking = bookings.find(function (b) { return b.id === bookingId; });
  if (!booking) return;

  // Find available alternatives
  var altRooms = getAvailableRooms(booking.date, booking.startTime, booking.endTime, booking.attendees)
    .filter(function (r) { return r.available && r.code !== booking.room; });

  if (altRooms.length === 0) {
    showToast("No alternative rooms available for this time slot.", "error");
    return;
  }

  var options = altRooms.map(function (r) {
    return '<option value="' + r.code + '">' + r.code + ' (Capacity ' + r.capacity + ')</option>';
  }).join("");

  suggestEl.style.display = "block";
  suggestEl.innerHTML =
    '<div class="suggest-modal">' +
    '<strong>Suggest alternative for ' + bookingId + '</strong>' +
    '<p style="font-size:13px;color:var(--muted);margin:4px 0">Requested room: ' + booking.room + '</p>' +
    '<select id="alt-room-select">' + options + '</select>' +
    '<button class="btn btn-primary btn-sm" onclick="handleConfirmSuggest(\'' + bookingId + '\')">Suggest</button> ' +
    '<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'suggest-modal\').style.display=\'none\'">Cancel</button>' +
    '</div>';

  suggestEl.scrollIntoView({ behavior: "smooth" });
}

function handleConfirmSuggest(bookingId) {
  var altRoom = document.getElementById("alt-room-select").value;
  var result = suggestAlternative(bookingId, altRoom);
  if (result.success) {
    showToast("Alternative " + altRoom + " suggested for " + bookingId + ".", "success");
    document.getElementById("suggest-modal").style.display = "none";
    renderAdminDashboard();
  } else {
    showToast(result.error, "error");
  }
}

// Student alternative acceptance/decline
function handleAcceptAlt(bookingId) {
  var result = acceptAlternative(bookingId);
  if (result.success) {
    showToast("Alternative room accepted!", "success");
    renderStudentDashboard();
  } else {
    showToast(result.error, "error");
  }
}

function handleDeclineAlt(bookingId) {
  var result = declineAlternative(bookingId);
  if (result.success) {
    showToast("Alternative declined.", "info");
    renderStudentDashboard();
  } else {
    showToast(result.error, "error");
  }
}

// Security Page
function renderSecurityPage() {
  if (!currentUser || currentUser.role !== "security") return;

  var resultEl = document.getElementById("scan-result");
  if (resultEl) resultEl.innerHTML = "";

  // Show currently occupied rooms
  var occupiedEl = document.getElementById("occupied-list");
  if (occupiedEl) {
    var occupied = getBookings().filter(function (b) { return b.status === "Occupied"; });
    if (occupied.length === 0) {
      occupiedEl.innerHTML = '<div class="empty-state"><div class="icon">🔓</div>No rooms currently occupied.</div>';
    } else {
      occupiedEl.innerHTML = occupied.map(function (b) {
        return '<div class="occupied-card">' +
          '<h3>' + b.room + ' — ' + b.purpose + '</h3>' +
          '<div class="meta"><span>👤 ' + b.studentName + '</span><span>🕐 ' + formatTime(b.startTime) + '–' + formatTime(b.endTime) + '</span>' +
          (b.checkinTime ? '<span>✅ Checked in ' + timeAgo(b.checkinTime) + '</span>' : '') + '</div>' +
          '<div style="margin-top:8px">' +
          '<p style="font-size:13px;font-weight:600;color:var(--ink-soft);margin:0 0 6px">Room condition:</p>' +
          '<div class="condition-picker" id="cond-' + b.id + '">' +
          '<button class="condition-btn selected" onclick="selectCondition(\'' + b.id + '\', this)">No damage observed</button>' +
          '<button class="condition-btn" onclick="selectCondition(\'' + b.id + '\', this)">Projector issue</button>' +
          '<button class="condition-btn" onclick="selectCondition(\'' + b.id + '\', this)">Furniture issue</button>' +
          '<button class="condition-btn" onclick="selectCondition(\'' + b.id + '\', this)">Cleaning required</button>' +
          '<button class="condition-btn" onclick="selectCondition(\'' + b.id + '\', this)">Other</button>' +
          '</div>' +
          '<button class="btn btn-primary btn-sm" onclick="handleCheckOut(\'' + b.id + '\')">Check Out</button>' +
          '</div></div>';
      }).join("");
    }
  }

  // Populate QR token dropdown from approved bookings
  var selectEl = document.getElementById("qr-select");
  if (selectEl) {
    var approved = getBookings().filter(function (b) { return b.status === "Approved" && b.qrToken; });
    selectEl.innerHTML = '<option value="">-- Select a booking QR --</option>' +
      approved.map(function (b) {
        return '<option value="' + b.qrToken + '">' + b.qrToken + ' (' + b.room + ' · ' + b.studentName + ')</option>';
      }).join("");
  }
}

function selectCondition(bookingId, btn) {
  var container = document.getElementById("cond-" + bookingId);
  if (!container) return;
  container.querySelectorAll(".condition-btn").forEach(function (b) { b.classList.remove("selected"); });
  btn.classList.add("selected");
}

function handleSimulateScan() {
  var selectEl = document.getElementById("qr-select");
  var qrToken = selectEl ? selectEl.value : "";
  var resultEl = document.getElementById("scan-result");

  if (!qrToken) {
    resultEl.innerHTML = '<div class="error-box">Please select a booking QR token to scan.</div>';
    return;
  }

  var result = checkInBooking(qrToken);

  if (result.success) {
    var b = result.booking;
    resultEl.innerHTML =
      '<span class="badge badge-teal">Valid booking</span>' +
      '<h2>' + b.room + ' · Occupied</h2>' +
      '<p class="confirm-detail">' + b.purpose + ' — ' + b.studentName + '</p>' +
      '<p class="confirm-detail">Checked in at ' + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + '</p>' +
      '<p style="font-size:14px;font-weight:600;color:var(--rust);margin-top:10px">ROOM STATUS: OCCUPIED</p>';
    showToast("Check-in successful — " + b.room + " is now occupied.", "success");
    renderSecurityPage();
  } else {
    resultEl.innerHTML = '<div class="error-box">' + result.error + '</div>';
  }
}

function handleCheckOut(bookingId) {
  var condContainer = document.getElementById("cond-" + bookingId);
  var remark = "No damage observed";
  if (condContainer) {
    var selected = condContainer.querySelector(".condition-btn.selected");
    if (selected) remark = selected.textContent;
  }

  var result = checkOutBooking(bookingId, remark);
  if (result.success) {
    showToast("Checked out — " + result.booking.room + " is now available. Condition: " + remark, "success");
    renderSecurityPage();
  } else {
    showToast(result.error, "error");
  }
}

// Notifications Page
function renderNotifications() {
  if (!currentUser) return;

  var el = document.getElementById("notif-list");
  if (!el) return;

  var notifs = getNotifications().filter(function (n) { return n.recipient === currentUser.email; });

  if (notifs.length === 0) {
    el.innerHTML = '<div class="empty-state"><div class="icon">🔔</div>No notifications yet.</div>';
    return;
  }

  el.innerHTML = notifs.map(function (n) {
    var iconMap = { success: "✓", error: "✕", info: "ℹ" };
    return '<div class="notif-item ' + (n.read ? '' : 'unread') + '">' +
      '<div class="notif-icon ' + n.type + '">' + (iconMap[n.type] || "ℹ") + '</div>' +
      '<div class="notif-body"><p>' + n.text + '</p><div class="notif-time">' + timeAgo(n.time) + '</div></div>' +
      '</div>';
  }).join("");
}

// Clear demo data
function clearAllData() {
  if (confirm("Clear all bookings, notifications, and demo data?")) {
    localStorage.removeItem("bookings");
    localStorage.removeItem("notifications");
    localStorage.removeItem("bookingCounter");
    showToast("All demo data cleared.", "info");
    // Re-render current page
    if (currentUser) {
      if (currentUser.role === "student") renderStudentDashboard();
      if (currentUser.role === "admin") renderAdminDashboard();
      if (currentUser.role === "security") renderSecurityPage();
    }
  }
}

// Initialization
document.addEventListener("DOMContentLoaded", function () {
  // Restore session from localStorage
  var saved = localStorage.getItem("currentUser");
  if (saved) {
    currentUser = JSON.parse(saved);
    updateNav();
    if (currentUser.role === "student")  show("dash");
    else if (currentUser.role === "admin")    show("admin");
    else if (currentUser.role === "security") show("security");
  } else {
    show("login");
  }

  // Room picker auto-update on date/time change
  var dateInput  = document.getElementById("f-date");
  var startInput = document.getElementById("f-start");
  var endInput   = document.getElementById("f-end");
  var attInput   = document.getElementById("f-attendees");

  if (dateInput)  dateInput.addEventListener("change",  updateRoomPicker);
  if (startInput) startInput.addEventListener("change", updateRoomPicker);
  if (endInput)   endInput.addEventListener("change",   updateRoomPicker);
  if (attInput)   attInput.addEventListener("input",    updateRoomPicker);

  renderBoard();
});
