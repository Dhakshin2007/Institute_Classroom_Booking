// app.js - navigation, shared state, rendering

// Shared State
var currentUser  = null;
var selectedRoom = null;
var adminCurrentFilter = "all";
var currentRoomCategory = "recommended";

// HTML Sanitization
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Pre-seed realistic IIT Ropar demo data if fresh run
function seedInstituteData() {
  var today = (typeof getLocalDateString === "function") ? getLocalDateString() : new Date().toISOString().split("T")[0];
  var sampleBookings = [
    {
      id: "IITRPR-48291",
      student: "student@iitrpr.ac.in",
      studentName: "Dhakshin K",
      studentId: "2024AIB1009",
      room: "LT-2",
      date: today,
      startTime: "16:00",
      endTime: "18:00",
      purpose: "ACM Student Chapter Hands-on Workshop",
      attendees: 85,
      notes: "Projector and collar wireless mic needed.",
      status: "Approved",
      qrToken: "QR-IITRPR-48291",
      checkinTime: null,
      checkoutTime: null,
      conditionRemark: null,
      alternativeRoom: null,
      adminRemark: null,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: "IITRPR-48292",
      student: "riya@iitrpr.ac.in",
      studentName: "Riya Sharma",
      studentId: "2023CSB1042",
      room: "CS-1",
      date: today,
      startTime: "17:00",
      endTime: "19:00",
      purpose: "Robotics Club Weekly Review & Hardware Testing",
      attendees: 40,
      notes: "Extended power backup for demo bots.",
      status: "Pending",
      qrToken: null,
      checkinTime: null,
      checkoutTime: null,
      conditionRemark: null,
      alternativeRoom: null,
      adminRemark: null,
      createdAt: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: "IITRPR-48290",
      student: "student@iitrpr.ac.in",
      studentName: "Dhakshin K",
      studentId: "2024AIB1009",
      room: "PCE-1",
      date: today,
      startTime: "08:30",
      endTime: "09:45",
      purpose: "Linear Algebra Peer Study Circle",
      attendees: 20,
      notes: "Whiteboard markers requested.",
      status: "Completed",
      qrToken: "QR-IITRPR-48290",
      checkinTime: new Date(Date.now() - 3600000 * 7).toISOString(),
      checkoutTime: new Date(Date.now() - 3600000 * 5).toISOString(),
      conditionRemark: "No damage observed",
      alternativeRoom: null,
      adminRemark: null,
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
    }
  ];

  var sampleNotifs = [
    {
      recipient: "student@iitrpr.ac.in",
      text: "Your LT-2 booking (IITRPR-48291) has been approved. QR code is now available.",
      type: "success",
      time: new Date(Date.now() - 3600000 * 2).toISOString(),
      read: false
    },
    {
      recipient: "admin@iitrpr.ac.in",
      text: "New booking request IITRPR-48292 from Riya Sharma for CS-1.",
      type: "info",
      time: new Date(Date.now() - 1800000).toISOString(),
      read: false
    },
    {
      recipient: "student@iitrpr.ac.in",
      text: "Checked out of PCE-1. Room condition recorded as: No damage observed.",
      type: "info",
      time: new Date(Date.now() - 3600000 * 5).toISOString(),
      read: true
    }
  ];

  localStorage.setItem("bookings", JSON.stringify(sampleBookings));
  localStorage.setItem("notifications", JSON.stringify(sampleNotifs));
  localStorage.setItem("bookingCounter", JSON.stringify(48293));
}

// localStorage Helpers
function getBookings() {
  var b = localStorage.getItem("bookings");
  if (!b) {
    seedInstituteData();
    b = localStorage.getItem("bookings");
  }
  return JSON.parse(b) || [];
}
function saveBookings(b) {
  localStorage.setItem("bookings", JSON.stringify(b));
  if (typeof saveBookingToSupabase === "function" && Array.isArray(b)) {
    b.forEach(function (item) {
      saveBookingToSupabase(item);
    });
  }
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

// Quick 1-click login for demo / test users
function quickLogin(email) {
  var user = demoUsers.find(function (u) { return u.email === email; });
  if (!user) return;
  var emailInput = document.getElementById("login-email");
  var passInput = document.getElementById("login-password");
  if (emailInput) emailInput.value = user.email;
  if (passInput) passInput.value = user.password;
  handleLogin();
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
    tabs += '<button data-target="book" onclick="show(\'book\')">Book Room</button>';
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

// Password Visibility Toggle
function togglePasswordVisibility(inputId, btn) {
  var input = document.getElementById(inputId);
  if (!input) return;
  var isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";

  var eyeOpen = btn.querySelector(".eye-open");
  var eyeClosed = btn.querySelector(".eye-closed");
  if (eyeOpen && eyeClosed) {
    if (isPassword) {
      eyeOpen.style.display = "none";
      eyeClosed.style.display = "block";
      btn.setAttribute("title", "Hide Password");
      btn.setAttribute("aria-label", "Hide password");
    } else {
      eyeOpen.style.display = "block";
      eyeClosed.style.display = "none";
      btn.setAttribute("title", "Show Password");
      btn.setAttribute("aria-label", "Show password");
    }
  }
}

// Auth Tabs & Registration State
function switchAuthTab(tab) {
  var btnSignIn = document.getElementById("tab-btn-signin");
  var btnSignUp = document.getElementById("tab-btn-signup");
  var wrapSignIn = document.getElementById("signin-form-wrap");
  var wrapSignUp = document.getElementById("signup-form-wrap");
  var loginErr = document.getElementById("login-error");
  var suErr = document.getElementById("signup-error");

  if (loginErr) loginErr.textContent = "";
  if (suErr) suErr.textContent = "";

  if (tab === "signin") {
    if (btnSignIn) btnSignIn.classList.add("active");
    if (btnSignUp) btnSignUp.classList.remove("active");
    if (wrapSignIn) wrapSignIn.style.display = "block";
    if (wrapSignUp) wrapSignUp.style.display = "none";
  } else {
    if (btnSignIn) btnSignIn.classList.remove("active");
    if (btnSignUp) btnSignUp.classList.add("active");
    if (wrapSignIn) wrapSignIn.style.display = "none";
    if (wrapSignUp) wrapSignUp.style.display = "block";
  }
}

function handleRoleSelectionChange() {
  var roleSelect = document.getElementById("su-role");
  var passcodeWrap = document.getElementById("su-passcode-wrap");
  if (!roleSelect || !passcodeWrap) return;
  var val = roleSelect.value;
  if (val === "admin" || val === "security") {
    passcodeWrap.style.display = "block";
  } else {
    passcodeWrap.style.display = "none";
  }
}

function getRegisteredUsers() {
  try {
    return JSON.parse(localStorage.getItem("registeredUsers")) || [];
  } catch (e) {
    return [];
  }
}

function saveRegisteredUser(user) {
  var list = getRegisteredUsers();
  list.push(user);
  localStorage.setItem("registeredUsers", JSON.stringify(list));
}

// Sign Up Handler
async function handleSignUp() {
  var name = document.getElementById("su-name").value.trim();
  var email = document.getElementById("su-email").value.trim().toLowerCase();
  var studentId = document.getElementById("su-id").value.trim().toUpperCase();
  var dept = document.getElementById("su-dept").value;
  var role = document.getElementById("su-role").value;
  var passcode = document.getElementById("su-passcode") ? document.getElementById("su-passcode").value.trim() : "";
  var password = document.getElementById("su-password").value;
  var confirmPass = document.getElementById("su-confirm").value;
  var errorEl = document.getElementById("signup-error");

  if (errorEl) errorEl.textContent = "";

  if (!name || !email || !studentId || !password || !confirmPass) {
    if (errorEl) errorEl.textContent = "Please fill in all required fields.";
    return;
  }

  // Basic email pattern
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    if (errorEl) errorEl.textContent = "Please enter a valid email address (preferably @iitrpr.ac.in).";
    return;
  }

  // Password checks
  if (password.length < 6) {
    if (errorEl) errorEl.textContent = "Password must be at least 6 characters.";
    return;
  }
  if (password !== confirmPass) {
    if (errorEl) errorEl.textContent = "Passwords do not match.";
    return;
  }

  // Privileged role passcode check
  if ((role === "admin" || role === "security") && passcode !== "iitrpr2026" && passcode !== "admin123") {
    if (errorEl) errorEl.textContent = "Invalid staff passcode. Demo code for Admin/Security is: iitrpr2026";
    return;
  }

  // Check if account already exists
  var existingDemo = demoUsers.find(function (u) { return u.email === email; });
  var existingReg = getRegisteredUsers().find(function (u) { return u.email === email; });
  if (existingDemo || existingReg) {
    if (errorEl) errorEl.textContent = "An account with " + email + " already exists. Please Sign In.";
    return;
  }

  var btn = document.getElementById("btn-signup");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating account…';
  }

  // Supabase Auth Integration
  if (typeof supabaseClient !== "undefined" && supabaseClient) {
    try {
      await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            name: name,
            student_id: studentId,
            dept: dept,
            role: role
          }
        }
      });
    } catch (authErr) {
      console.warn("Supabase auth signup notice:", authErr);
    }
  }

  // Save registered user
  var newUser = {
    email: email,
    password: password,
    role: role,
    name: name,
    id: studentId,
    dept: dept,
    createdAt: new Date().toISOString()
  };
  saveRegisteredUser(newUser);

  // Automatically authenticate new user
  currentUser = {
    email: newUser.email,
    role: newUser.role,
    name: newUser.name,
    id: newUser.id,
    dept: newUser.dept
  };

  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  updateNav();

  if (currentUser.role === "student") show("dash");
  else if (currentUser.role === "admin") show("admin");
  else if (currentUser.role === "security") show("security");

  showToast("Account created successfully! Welcome, " + currentUser.name + ".", "success");
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = "Create Account & Log In";
  }
}

// Sign In Handler
async function handleLogin() {
  var email = document.getElementById("login-email").value.trim().toLowerCase();
  var password = document.getElementById("login-password").value;
  var errorEl = document.getElementById("login-error");

  if (errorEl) errorEl.textContent = "";

  if (!email || !password) {
    if (errorEl) errorEl.textContent = "Please enter both email and password.";
    return;
  }

  var btn = document.getElementById("btn-login");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Signing in…';
  }

  // 1. Check Demo Accounts
  var user = demoUsers.find(function (u) {
    return u.email === email && u.password === password;
  });

  // 2. Check Newly Registered Accounts
  if (!user) {
    user = getRegisteredUsers().find(function (u) {
      return u.email === email && u.password === password;
    });
  }

  // 3. Check Supabase Auth if online
  if (!user && typeof supabaseClient !== "undefined" && supabaseClient) {
    try {
      var authRes = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });
      if (authRes.data && authRes.data.user) {
        var profRes = await supabaseClient
          .from("profiles")
          .select("*")
          .eq("id", authRes.data.user.id)
          .maybeSingle();

        var prof = (profRes && profRes.data) ? profRes.data : {};
        var meta = authRes.data.user.user_metadata || {};
        user = {
          email: authRes.data.user.email,
          role: prof.role || meta.role || "student",
          name: prof.name || meta.name || email.split("@")[0],
          id: prof.student_id || meta.student_id || "IITRPR",
          dept: prof.department || meta.dept || "Academic Block"
        };
      }
    } catch (e) {
      console.warn("Supabase signInWithPassword check:", e);
    }
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = "Sign In";
  }

  if (!user) {
    if (errorEl) {
      errorEl.innerHTML = 'Invalid email or password. Don\'t have an account yet? <a href="#" onclick="switchAuthTab(\'signup\');return false;" style="color:var(--brass-deep);font-weight:600;text-decoration:underline">Create an account here</a>.';
    }
    return;
  }

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
  if (currentUser.role === "student") show("dash");
  else if (currentUser.role === "admin") show("admin");
  else if (currentUser.role === "security") show("security");

  showToast("Welcome back, " + currentUser.name + "!", "success");
}

function logout() {
  currentUser = null;
  selectedRoom = null;
  localStorage.removeItem("currentUser");
  if (typeof supabaseClient !== "undefined" && supabaseClient && supabaseClient.auth) {
    try { supabaseClient.auth.signOut(); } catch (e) {}
  }
  updateNav();
  show("login");
  showToast("Logged out successfully.", "info");
}

// Room Board Time Simulation
var currentSimTime = null;

function setSimulatedTime(day, time, btnEl) {
  if (!day) {
    currentSimTime = null;
  } else {
    currentSimTime = { day: day, time: time };
  }
  document.querySelectorAll(".sim-btn").forEach(function (b) { b.classList.remove("active"); });
  if (btnEl) {
    btnEl.classList.add("active");
  } else if (!day) {
    var liveBtn = document.getElementById("sim-live-btn");
    if (liveBtn) liveBtn.classList.add("active");
  }
  renderBoard();
}

// Room Board (Home Page)
function getRoomStatus(roomCode) {
  var now = new Date();
  var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var today = currentSimTime ? currentSimTime.day : days[now.getDay()];
  var hh = String(now.getHours()).padStart(2, "0");
  var mm = String(now.getMinutes()).padStart(2, "0");
  var currentTime = currentSimTime ? currentSimTime.time : (hh + ":" + mm);
  var todayDate = now.toISOString().split("T")[0];

  // Check timetable
  for (var i = 0; i < timetable.length; i++) {
    var entry = timetable[i];
    if (entry.room === roomCode && entry.days.indexOf(today) !== -1) {
      if (currentTime >= entry.start && currentTime < entry.end) {
        return { status: "busy", label: entry.course + " until " + formatTime(entry.end) };
      }
      // Upcoming within 30 minutes
      var startMin = parseInt(entry.start.split(":")[0], 10) * 60 + parseInt(entry.start.split(":")[1], 10);
      var curMin = parseInt(currentTime.split(":")[0], 10) * 60 + parseInt(currentTime.split(":")[1], 10);
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

  var timeLabel = currentSimTime ?
    (currentSimTime.day + " · " + formatTime(currentSimTime.time) + " (Simulated)") :
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  document.getElementById("board-time").textContent = timeLabel;
}

// Student Dashboard
function renderStudentDashboard() {
  if (!currentUser || currentUser.role !== "student") return;

  var nameEl = document.getElementById("dash-name");
  var deptEl = document.getElementById("dash-dept");
  if (nameEl) nameEl.textContent = "Hi, " + currentUser.name;
  if (deptEl) deptEl.textContent = currentUser.dept;

  var bookings = getBookings().filter(function (b) { return b.student === currentUser.email; });

  // Stats (personalized to student)
  var statsEl = document.getElementById("dash-stats");
  if (statsEl) {
    var myTotal = bookings.length;
    var myApproved = bookings.filter(function (b) {
      return b.status === "Approved" || b.status === "Occupied" || b.status === "Completed";
    }).length;
    var myPending = bookings.filter(function (b) {
      return b.status === "Pending" || b.status === "Alternative Suggested";
    }).length;

    statsEl.innerHTML =
      '<div class="card stat-card"><div class="stat-label">My Requests</div><div class="stat-num">' + myTotal + '</div><div class="stat-sub">Submitted all-time</div></div>' +
      '<div class="card stat-card"><div class="stat-label">Approved &amp; Active</div><div class="stat-num" style="color:var(--teal)">' + myApproved + '</div><div class="stat-sub">Confirmed bookings</div></div>' +
      '<div class="card stat-card"><div class="stat-label">Pending Review</div><div class="stat-num" style="color:var(--amber)">' + myPending + '</div><div class="stat-sub">Awaiting admin action</div></div>';
  }

  // Today's timetable
  var ttEl = document.getElementById("dash-timetable");
  if (ttEl) {
    var todayEntries = getTodayClasses();
    if (todayEntries.length === 0) {
      ttEl.innerHTML = '<div class="empty-state"><div class="icon">📚</div>No classes scheduled for today.</div>';
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
      listEl.innerHTML = '<div class="empty-state"><div class="icon">📋</div><strong>No Bookings Yet</strong><p style="font-size:13px;color:var(--muted);max-width:32ch;margin:6px auto 14px">Submit your first classroom reservation request and track approval in real time.</p><button class="btn btn-primary btn-sm" onclick="show(\'book\')">+ Request a Room</button></div>';
    } else {
      listEl.innerHTML = bookings.slice().reverse().map(function (b) {
        var actions = "";
        if (b.status === "Alternative Suggested") {
          actions = '<div class="actions">' +
            '<p style="font-size:13px;color:var(--amber);margin:6px 0">Admin suggests: <strong>' + b.alternativeRoom + '</strong> instead of ' + b.room + '</p>' +
            '<button class="btn btn-teal btn-sm" onclick="handleAcceptAlt(\'' + b.id + '\')">Accept</button> ' +
            '<button class="btn btn-ghost btn-sm" onclick="handleDeclineAlt(\'' + b.id + '\')">Decline</button> ' +
            '<button class="btn btn-ghost btn-sm" style="color:var(--rust);border-color:var(--rust)" onclick="handleCancelBooking(\'' + b.id + '\')">Cancel Request</button>' +
            '</div>';
        } else if (b.status === "Pending") {
          actions = '<div class="actions"><button class="btn btn-ghost btn-sm" style="color:var(--rust);border-color:var(--rust)" onclick="handleCancelBooking(\'' + b.id + '\')">Cancel Request</button></div>';
        } else if (b.status === "Approved" && b.qrToken) {
          actions = '<div class="actions"><button class="btn btn-ghost btn-sm" onclick="showQR(\'' + b.id + '\')">View QR Code</button></div>';
        } else if (b.status === "Rejected" && b.adminRemark) {
          actions = '<div class="actions"><p style="font-size:13px;color:var(--rust);margin:4px 0">Reason: ' + b.adminRemark + '</p></div>';
        } else if (b.status === "Completed") {
          if (b.rating) {
            var starStr = "★".repeat(b.rating) + "☆".repeat(5 - b.rating);
            var tagText = (b.feedbackTags && b.feedbackTags.length) ? ' · <span style="color:var(--muted)">' + escapeHtml(b.feedbackTags.join(", ")) + '</span>' : '';
            var commentText = b.studentFeedback ? '<p style="font-size:12.5px;color:var(--ink-soft);margin:4px 0 0;font-style:italic">"' + escapeHtml(b.studentFeedback) + '"' + tagText + '</p>' : '';
            actions = '<div class="actions" style="margin-top:10px;padding-top:8px;border-top:1px dashed var(--line-soft)">' +
              '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
              '<span style="color:#e59819;font-size:14px;letter-spacing:1px">' + starStr + '</span>' +
              '<span style="font-size:12.5px;font-weight:600;color:var(--ink)">Rated ' + b.rating + '/5</span>' +
              '<button class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:11px" onclick="openRatingModal(\'' + escapeHtml(b.id) + '\')">Edit Feedback</button>' +
              '</div>' + commentText + '</div>';
          } else {
            actions = '<div class="actions" style="margin-top:10px">' +
              '<button class="btn btn-primary btn-sm" style="background:var(--brass-deep)" onclick="openRatingModal(\'' + escapeHtml(b.id) + '\')">⭐ Rate Experience &amp; Leave Feedback</button>' +
              '<span style="font-size:12px;color:var(--muted);margin-left:8px">Session completed — let us know how the room was</span>' +
              '</div>';
          }
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
    "Completed":              '<span class="badge badge-ink">COMPLETED</span>',
    "Cancelled":              '<span class="badge badge-ink" style="opacity:0.65">CANCELLED</span>'
  };
  return map[status] || '<span class="badge badge-ink">' + status + '</span>';
}

function handleCancelBooking(bookingId) {
  if (confirm("Are you sure you want to cancel booking request " + bookingId + "?")) {
    var result = cancelBooking(bookingId);
    if (result.success) {
      showToast("Booking " + bookingId + " cancelled.", "info");
      renderStudentDashboard();
    } else {
      showToast(result.error, "error");
    }
  }
}

// Show QR for approved booking
function showQR(bookingId) {
  var bookings = getBookings();
  var booking = bookings.find(function (b) { return b.id === bookingId; });
  if (!booking) return;
  renderConfirmation(booking);
  show("confirm");
}

// Timetable Calendar with Day and Room Filters
function renderTimetable() {
  var tbody = document.getElementById("timetable-body");
  if (!tbody) return;

  // Dynamically populate room filter options from real rooms/timetable
  var roomFilterEl = document.getElementById("filter-tt-room");
  if (roomFilterEl && roomFilterEl.options.length <= 1) {
    var roomCodes = {};
    if (Array.isArray(rooms)) {
      rooms.forEach(function (r) {
        if (r.code && r.code !== "L/P" && r.code !== "ROOM") roomCodes[r.code] = r.capacity;
      });
    }
    if (Array.isArray(timetable)) {
      timetable.forEach(function (t) {
        if (t.room && t.room !== "L/P" && t.room !== "ROOM" && !roomCodes[t.room]) roomCodes[t.room] = "";
      });
    }
    var sortedCodes = Object.keys(roomCodes).sort();
    sortedCodes.forEach(function (rc) {
      var opt = document.createElement("option");
      opt.value = rc;
      opt.textContent = rc + (roomCodes[rc] ? " (Capacity " + roomCodes[rc] + ")" : "");
      roomFilterEl.appendChild(opt);
    });
  }

  var dayFilter = document.getElementById("filter-tt-day") ? document.getElementById("filter-tt-day").value : "all";
  var roomFilter = document.getElementById("filter-tt-room") ? document.getElementById("filter-tt-room").value : "all";

  var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  if (dayFilter !== "all") {
    days = [dayFilter];
  }

  var todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];

  var rows = [];
  days.forEach(function (day) {
    var entries = timetable.filter(function (e) {
      var matchDay = e.days.indexOf(day) !== -1;
      var matchRoom = roomFilter === "all" || e.room === roomFilter;
      return matchDay && matchRoom;
    }).sort(function (a, b) { return a.start.localeCompare(b.start); });

    entries.forEach(function (e) {
      var isToday = day === todayName;
      rows.push('<tr' + (isToday ? ' class="today"' : '') + '><td><strong>' + escapeHtml(day) + '</strong></td><td>' + formatTime(e.start) + '–' + formatTime(e.end) + '</td><td>' + escapeHtml(e.course) + ' · ' + escapeHtml(e.title) + '</td><td><span class="badge badge-amber">' + escapeHtml(e.room) + '</span></td></tr>');
    });
  });

  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--muted)">No classes scheduled for the selected filter.</td></tr>';
  } else {
    tbody.innerHTML = rows.join("");
  }
}

// Quick duration calculator (+1 hr, +1.5 hrs, etc.)
function setBookingDuration(minutes) {
  var startInput = document.getElementById("f-start");
  var endInput = document.getElementById("f-end");
  var startTime = startInput.value || "15:00";
  startInput.value = startTime;

  var parts = startTime.split(":");
  var totalMin = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) + minutes;
  if (totalMin > 23 * 60 + 59) totalMin = 23 * 60 + 59;
  var endH = String(Math.floor(totalMin / 60)).padStart(2, "0");
  var endM = String(totalMin % 60).padStart(2, "0");
  endInput.value = endH + ":" + endM;
  updateRoomPicker();
}

// Booking Form
function renderBookingForm() {
  selectedRoom = null;
  var errorEl = document.getElementById("book-errors");
  if (errorEl) errorEl.innerHTML = "";

  var bannerEl = document.getElementById("selected-room-banner");
  if (bannerEl) bannerEl.style.display = "none";

  // Set min date to today using local timezone
  var dateInput = document.getElementById("f-date");
  if (dateInput) {
    var todayLocal = (typeof getLocalDateString === "function") ? getLocalDateString() : new Date().toISOString().split("T")[0];
    dateInput.min = todayLocal;
    if (!dateInput.value) dateInput.value = todayLocal;
  }

  // Set smart default start/end times if not already set or at default
  var startInput = document.getElementById("f-start");
  var endInput = document.getElementById("f-end");
  if (startInput && endInput) {
    var now = new Date();
    var currentH = now.getHours();
    var targetStartH = currentH + 1;
    if (targetStartH < 8) targetStartH = 9;
    if (targetStartH >= 20) {
      targetStartH = 9;
      var tomorrow = new Date(now.getTime() + 86400000);
      var tomorrowStr = (typeof getLocalDateString === "function") ? getLocalDateString(tomorrow) : tomorrow.toISOString().split("T")[0];
      if (dateInput) dateInput.value = tomorrowStr;
    }
    var startHStr = String(targetStartH).padStart(2, "0") + ":00";
    var targetEndH = targetStartH + 2;
    if (targetEndH > 22) targetEndH = 22;
    var endHStr = String(targetEndH).padStart(2, "0") + ":00";

    if (!startInput.value || startInput.value === "15:00") {
      startInput.value = startHStr;
    }
    if (!endInput.value || endInput.value === "17:00") {
      endInput.value = endHStr;
    }
  }

  currentRoomCategory = "recommended";
  var pills = document.querySelectorAll("#room-category-filters .category-pill");
  pills.forEach(function (p) {
    if (p.getAttribute("data-cat") === "recommended") p.classList.add("active");
    else p.classList.remove("active");
  });

  updateRoomPicker();
}

function setRoomCategoryFilter(category, btn) {
  currentRoomCategory = category;
  var pills = document.querySelectorAll("#room-category-filters .category-pill");
  pills.forEach(function (p) { p.classList.remove("active"); });
  if (btn) {
    btn.classList.add("active");
  } else {
    var matching = document.querySelector('#room-category-filters .category-pill[data-cat="' + category + '"]');
    if (matching) matching.classList.add("active");
  }
  updateRoomPicker();
}

// Intelligent Recommendation Scoring Engine
function getRecommendedRooms(roomList, purpose, attendees, notes) {
  var scored = roomList.map(function (r) {
    var score = 0;
    var reasons = [];

    // Base availability check
    if (!r.available) {
      return { room: r, score: -1000, reasons: [r.reason || "Unavailable in this slot"] };
    }

    // 1. Capacity & Nearest-Fit Matching
    if (attendees > 0) {
      var diff = r.capacity - attendees;
      var absDiff = Math.abs(diff);
      var pctDiff = absDiff / attendees;

      if (diff >= 0) {
        if (diff <= 15 || pctDiff <= 0.15) {
          score += 180; // Ideal fit
          reasons.push("Optimal capacity fit (" + r.capacity + " seats for " + attendees + " attendees)");
        } else if (pctDiff <= 0.6) {
          score += 110; // Comfortable fit
          reasons.push("Comfortable fit (" + r.capacity + " seats)");
        } else if (pctDiff <= 1.5) {
          score += 45; // Acceptable but oversized
          reasons.push("Room seats " + r.capacity);
        } else {
          score -= 90; // Excessive capacity
          reasons.push("Large venue (" + r.capacity + " seats)");
        }
      } else {
        // Room capacity is slightly below requested headcount (e.g. 125 for 128)
        if (absDiff <= 5 || pctDiff <= 0.05) {
          score += 165; // High priority near match!
          reasons.unshift("Near capacity match (" + r.capacity + " seats for ~" + attendees + " expected — only " + absDiff + " seats diff)");
          r.isNearFit = true;
          r.seatDiff = absDiff;
        } else if (absDiff <= 10 || pctDiff <= 0.10) {
          score += 120; // Good near match
          reasons.unshift("Near capacity match (" + r.capacity + " seats — ~" + absDiff + " seats short, suitable if attendance fluctuates)");
          r.isNearFit = true;
          r.seatDiff = absDiff;
        } else if (absDiff <= 20 || pctDiff <= 0.20) {
          score += 40;
          reasons.push("Near capacity (" + r.capacity + " seats, ~" + absDiff + " short of target)");
          r.isNearFit = true;
          r.seatDiff = absDiff;
        } else {
          score -= 350;
          reasons.push("Significantly below required (" + r.capacity + " vs " + attendees + " seats)");
          r.isNearFit = false;
        }
      }
    } else {
      // General versatile rooms if headcount not specified yet
      if (r.capacity >= 50 && r.capacity <= 100) {
        score += 50;
      }
    }

    // 2. Keyword & Purpose relevance
    var pLower = ((purpose || "") + " " + (notes || "")).toLowerCase();
    var code = (r.code || "").toUpperCase();
    var cat = (r.category || "").toLowerCase();

    // Seminar / Presentation / Meeting keywords
    if (/seminar|presentation|talk|speaker|guest|discussion|review|meeting|agm|club|orientation/.test(pLower)) {
      if (code.includes("-SH") || cat.includes("seminar")) {
        score += 120;
        reasons.unshift("Seminar hall with stage podium & wireless mic");
      }
    }

    // Hackathon / Tech / Coding / Workshop keywords
    if (/workshop|hackathon|coding|python|ai|ml|data|robotics|hands-on|programming|project|lan/.test(pLower)) {
      if (code.startsWith("CS-") || code.startsWith("AI-")) {
        score += 130;
        reasons.unshift("Equipped with high-speed LAN, 4K display & power benches");
      } else if (code.startsWith("EE-")) {
        score += 80;
        reasons.unshift("Equipped with lab power benches & projector");
      }
    }

    // Large scale events / Keynotes
    if (/fest|cultural|annual|keynote|general body|convocation|plenary|freshers|farewell/.test(pLower) || attendees >= 140) {
      if (code === "AUDITORIUM") {
        score += 220;
        reasons.unshift("Full auditorium stage, PA system & tiered seating");
      }
    }

    // Lecture / Exam / Quiz / Study keywords
    if (/lecture|class|exam|quiz|math|study|tutorial|test|algebra/.test(pLower)) {
      if (code.startsWith("SRC-") || code.startsWith("S-")) {
        score += 90;
        reasons.unshift("Tiered classroom seating & large whiteboard");
      }
    }

    // Handover buffer bonus
    if (!r.bufferNotice) {
      score += 25;
    } else {
      score -= 15;
    }

    // Pending requests penalty
    if (r.pendingCount === 0) {
      score += 20;
    } else {
      score -= r.pendingCount * 15;
    }

    return {
      room: r,
      score: score,
      reasons: reasons
    };
  });

  scored.sort(function (a, b) { return b.score - a.score; });
  return scored;
}

function updateRoomPicker() {
  var date = document.getElementById("f-date").value;
  var startTime = document.getElementById("f-start").value;
  var endTime = document.getElementById("f-end").value;
  var attendees = document.getElementById("f-attendees").value;
  var purpose = document.getElementById("f-purpose") ? document.getElementById("f-purpose").value.trim() : "";
  var notes = document.getElementById("f-notes") ? document.getElementById("f-notes").value.trim() : "";
  var attendeesNum = parseInt(attendees, 10) || 0;

  var el = document.getElementById("room-picker");
  var bannerEl = document.getElementById("selected-room-banner");
  var noteEl = document.getElementById("room-picker-recommendation-note");

  if (!date || !startTime || !endTime) {
    el.innerHTML = '<div class="empty-state" style="grid-column:1/-1;padding:20px"><div class="icon">📅</div>Select date, start time, and end time to see available rooms.</div>';
    selectedRoom = null;
    if (bannerEl) bannerEl.style.display = "none";
    if (noteEl) noteEl.style.display = "none";
    return;
  }

  if (startTime >= endTime) {
    el.innerHTML = '<div class="empty-state" style="grid-column:1/-1;padding:20px"><div class="icon">⚠️</div>End time must be after start time.</div>';
    selectedRoom = null;
    if (bannerEl) bannerEl.style.display = "none";
    if (noteEl) noteEl.style.display = "none";
    return;
  }

  if (isTimeInPast(date, startTime)) {
    el.innerHTML = '<div class="empty-state" style="grid-column:1/-1;padding:20px"><div class="icon">⏰</div>Start time (' + formatTime(startTime) + ') is in the past for selected date. Please pick an upcoming time slot.</div>';
    selectedRoom = null;
    if (bannerEl) bannerEl.style.display = "none";
    if (noteEl) noteEl.style.display = "none";
    return;
  }

  var roomList = getAvailableRooms(date, startTime, endTime, attendees);

  // If selected room is no longer available in this slot, unselect it
  if (selectedRoom) {
    var stillAvail = roomList.find(function(r) { return r.code === selectedRoom && r.available; });
    if (!stillAvail) {
      selectedRoom = null;
      if (bannerEl) bannerEl.style.display = "none";
    }
  }

  // Update recommendation note banner
  if (noteEl) {
    if (currentRoomCategory === "recommended") {
      noteEl.style.display = "block";
      if (attendeesNum > 0 && purpose) {
        noteEl.innerHTML = "✨ <strong>Top Picks for \"" + escapeHtml(purpose) + "\" (" + attendeesNum + " attendees):</strong> Recommended venues matching your headcount and event needs.";
      } else if (attendeesNum > 0) {
        noteEl.innerHTML = "✨ <strong>Top Picks for " + attendeesNum + " attendees:</strong> Ranked by optimal seating capacity fit and available amenities.";
      } else if (purpose) {
        noteEl.innerHTML = "✨ <strong>Top Picks for \"" + escapeHtml(purpose) + "\":</strong> Ranked by venue equipment and room layout suitability.";
      } else {
        noteEl.innerHTML = "💡 <strong>Smart Suggestions:</strong> Enter expected attendees or purpose above to instantly refine recommendations.";
      }
    } else {
      noteEl.style.display = "none";
    }
  }

  // Score rooms
  var scoredList = getRecommendedRooms(roomList, purpose, attendeesNum, notes);
  var displayedRooms = [];

  if (currentRoomCategory === "recommended") {
    // Top 4 best matching available rooms
    var positiveScored = scoredList.filter(function (item) { return item.score > 0 && item.room.available; });
    if (positiveScored.length >= 3) {
      displayedRooms = positiveScored.slice(0, 4);
    } else {
      var availableScored = scoredList.filter(function (item) { return item.room.available; });
      displayedRooms = availableScored.slice(0, 4);
    }
  } else if (currentRoomCategory === "seminar") {
    displayedRooms = scoredList.filter(function (item) {
      var c = item.room.code.toUpperCase();
      var cat = (item.room.category || "").toLowerCase();
      return c.includes("-SH") || cat.includes("seminar") || c === "AUDITORIUM";
    });
  } else if (currentRoomCategory === "src") {
    displayedRooms = scoredList.filter(function (item) {
      return item.room.code.toUpperCase().startsWith("SRC-");
    });
  } else if (currentRoomCategory === "dept") {
    displayedRooms = scoredList.filter(function (item) {
      var c = item.room.code.toUpperCase();
      return c.startsWith("CS-") || c.startsWith("EE-") || c.startsWith("ME-") || c.startsWith("CY-") || c.startsWith("S-");
    });
  } else {
    // "all"
    displayedRooms = scoredList;
  }

  if (displayedRooms.length === 0) {
    el.innerHTML = '<div class="empty-state" style="grid-column:1/-1;padding:24px"><div class="icon">🏫</div>No venues found in this category for this slot. <button type="button" class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="setRoomCategoryFilter(\'all\')">View All Venues</button></div>';
    return;
  }

  var html = displayedRooms.map(function (item) {
    var r = item.room;
    var disabled = !r.available;
    var capWarn = r.available && !r.capacityOk;
    var isSelected = (selectedRoom === r.code);
    var isRecommended = (currentRoomCategory === "recommended" && item.score > 0 && r.available);
    var statusLine = "";

    if (disabled) {
      statusLine = r.reason || "Occupied";
    } else if (r.isNearCapacity || r.isNearFit) {
      var diffVal = r.seatDiff || (attendeesNum - r.capacity);
      statusLine = "Capacity " + r.capacity + " · ⚡ Near fit (~" + diffVal + " seats diff · suitable if attendance fluctuates)";
    } else if (capWarn) {
      statusLine = "Capacity " + r.capacity + " · ⚠ Below expected headcount (" + attendees + ")";
    } else {
      statusLine = "Capacity " + r.capacity + " · Available";
    }

    var extraBadges = "";
    if (r.available && r.bufferNotice) {
      extraBadges += '<div style="font-size:11.5px;color:var(--amber);margin-top:3px">⚠️ ' + escapeHtml(r.bufferNotice) + '</div>';
    }
    if (r.available && r.pendingCount > 0) {
      extraBadges += '<div style="font-size:11.5px;color:var(--muted);margin-top:2px">⏳ ' + r.pendingCount + ' request(s) awaiting admin review</div>';
    }

    var facBadges = "";
    if (r.facilities && r.facilities.length > 0) {
      facBadges = '<div class="room-fac">' + r.facilities.map(function(f){ return '<span class="room-fac-tag">' + escapeHtml(f) + '</span>'; }).join('') + '</div>';
    }

    var recHighlight = "";
    if (isRecommended) {
      var reasonText = (item.reasons && item.reasons.length > 0) ? item.reasons[0] : "Best Capacity Match";
      if (r.isNearFit || r.isNearCapacity) {
        recHighlight = '<div class="rec-badge" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a">⚡ Near Capacity Match</div><div class="rec-reason" style="color:#b45309">✓ ' + escapeHtml(reasonText) + '</div>';
      } else {
        recHighlight = '<div class="rec-badge">🌟 Best Match</div><div class="rec-reason">✓ ' + escapeHtml(reasonText) + '</div>';
      }
    }

    return '<button type="button" class="room-option ' + (disabled ? 'disabled' : '') + ' ' + (isSelected ? 'selected' : '') + (isRecommended ? ' recommended-card' : '') + '" ' +
      (disabled ? 'disabled' : '') + ' data-room="' + escapeHtml(r.code) + '" onclick="selectRoom(\'' + escapeHtml(r.code) + '\')">' +
      (recHighlight ? recHighlight : '') +
      '<div class="rn" style="' + (recHighlight ? 'margin-top:4px' : '') + '">' + escapeHtml(r.code) + (isSelected ? ' <span style="font-size:12px;color:var(--teal)">✓ Selected</span>' : '') + '</div>' +
      '<div class="rd">' + escapeHtml(statusLine) + '</div>' +
      facBadges +
      extraBadges +
      '</button>';
  }).join("");

  if (currentRoomCategory === "recommended") {
    html += '<div style="grid-column:1/-1;text-align:center;padding:12px 14px;background:var(--surface);border:1px dashed var(--line);border-radius:var(--radius-s);margin-top:4px">' +
      '<span style="font-size:13px;color:var(--muted)">Need a specific hall or want to browse the entire campus inventory? </span>' +
      '<button type="button" class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:12px;margin-left:6px" onclick="setRoomCategoryFilter(\'all\')">Browse All 32 Venues &rarr;</button>' +
      '</div>';
  }

  el.innerHTML = html;
}

function selectRoom(code) {
  selectedRoom = code;
  document.querySelectorAll(".room-option").forEach(function (b) { b.classList.remove("selected"); });
  var btn = document.querySelector('.room-option[data-room="' + code + '"]');
  if (btn) btn.classList.add("selected");

  var roomData = rooms.find(function(r) { return r.code === code; });
  var bannerEl = document.getElementById("selected-room-banner");
  if (bannerEl && roomData) {
    bannerEl.style.display = "flex";
    bannerEl.innerHTML = '<span>✓ <strong>Room ' + escapeHtml(roomData.code) + ' selected</strong> (Capacity ' + roomData.capacity + ' · ' + (roomData.facilities ? roomData.facilities.join(', ') : '') + ')</span><button type="button" class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:11.5px" onclick="clearSelectedRoom()">Change</button>';
  }

  // Clear any existing error messages
  var errorEl = document.getElementById("book-errors");
  if (errorEl) errorEl.innerHTML = "";
}

function clearSelectedRoom() {
  selectedRoom = null;
  document.querySelectorAll(".room-option").forEach(function (b) { b.classList.remove("selected"); });
  var bannerEl = document.getElementById("selected-room-banner");
  if (bannerEl) bannerEl.style.display = "none";
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
      result.errors.map(function (e) { return "<li>" + escapeHtml(e) + "</li>"; }).join("") +
      '</ul></div>';
    errorEl.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  errorEl.innerHTML = "";
  showToast("Booking request submitted for review!", "success");

  // Show confirmation
  renderConfirmation(result.booking);
  show("confirm");

  // Clear form
  document.getElementById("f-purpose").value = "";
  document.getElementById("f-attendees").value = "";
  document.getElementById("f-notes").value = "";
  selectedRoom = null;
  var bannerEl = document.getElementById("selected-room-banner");
  if (bannerEl) bannerEl.style.display = "none";
}

// Generate a procedural crisp QR Code SVG based on token string (fallback)
function generateQRCodeSVG(text) {
  var size = 21;
  var matrix = [];
  for (var r = 0; r < size; r++) {
    matrix[r] = [];
    for (var c = 0; c < size; c++) {
      matrix[r][c] = false;
    }
  }

  function drawFinder(r0, c0) {
    for (var r = 0; r < 7; r++) {
      for (var c = 0; c < 7; c++) {
        var isBorder = (r === 0 || r === 6 || c === 0 || c === 6);
        var isInner = (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        matrix[r0 + r][c0 + c] = isBorder || isInner;
      }
    }
  }

  for (var i = 8; i < size - 8; i++) {
    matrix[6][i] = (i % 2 === 0);
    matrix[i][6] = (i % 2 === 0);
  }

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  var hash = 0;
  for (var k = 0; k < text.length; k++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(k);
    hash |= 0;
  }

  var seed = Math.abs(hash);
  for (var r = 0; r < size; r++) {
    for (var c = 0; c < size; c++) {
      var inTL = (r < 8 && c < 8);
      var inTR = (r < 8 && c >= size - 8);
      var inBL = (r >= size - 8 && c < 8);
      if (!inTL && !inTR && !inBL && matrix[r][c] === false) {
        seed = (seed * 9301 + 49297) % 233280;
        matrix[r][c] = (seed / 233280) > 0.45;
      }
    }
  }

  var rects = "";
  for (var r = 0; r < size; r++) {
    for (var c = 0; c < size; c++) {
      if (matrix[r][c]) {
        rects += '<rect x="' + c + '" y="' + r + '" width="1" height="1" fill="#1c2541"/>';
      }
    }
  }

  return '<svg viewBox="0 0 ' + size + ' ' + size + '" style="width:160px;height:160px;background:#fff;padding:8px;border:1px solid var(--line);border-radius:var(--radius-s);margin:18px auto 8px;display:block">' + rects + '</svg>';
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
    qrHtml = '<div id="booking-qr-render" style="display:flex;justify-content:center;margin:18px auto 8px;min-height:170px"></div>' +
      '<p class="confirm-detail" style="font-size:12px;color:var(--muted)">Verified QR Token: <code>' + escapeHtml(booking.qrToken) + '</code></p>' +
      '<div style="margin:10px auto;display:flex;justify-content:center;gap:8px">' +
      '<button class="btn btn-ghost btn-sm" onclick="window.print()">🖨 Print / Save Pass</button>' +
      '</div>';
  } else {
    qrHtml = '<p class="confirm-detail" style="color:var(--amber);margin:16px 0">QR code will be available after admin approval.</p>';
  }

  var emailLine = '<p class="confirm-detail" style="font-size:13px;color:var(--muted);margin-top:12px">Email notification queued for ' + escapeHtml(booking.student) + '</p>';

  el.innerHTML =
    '<div class="' + ringClass + '">' + ringIcon + '</div>' +
    '<h1 style="font-size:24px">' + title + '</h1>' +
    getStatusBadge(booking.status) +
    '<h2 style="margin-top:16px;font-size:26px">' + escapeHtml(booking.room) + '</h2>' +
    '<p class="confirm-detail">' + formatDate(booking.date) + ' · ' + formatTime(booking.startTime) + ' – ' + formatTime(booking.endTime) + '</p>' +
    '<p class="confirm-detail">' + escapeHtml(booking.purpose) + '</p>' +
    qrHtml +
    '<div class="booking-id">' + escapeHtml(booking.id) + '</div>' +
    emailLine;

  // Render real QR code using qrcode.min.js
  if (booking.qrToken) {
    var qrContainer = document.getElementById("booking-qr-render");
    if (qrContainer) {
      qrContainer.innerHTML = "";
      if (typeof QRCode !== "undefined") {
        try {
          new QRCode(qrContainer, {
            text: booking.qrToken,
            width: 170,
            height: 170,
            colorDark: "#1c2541",
            colorLight: "#ffffff",
            correctLevel: (typeof QRCode.CorrectLevel !== "undefined") ? QRCode.CorrectLevel.M : 0
          });
        } catch (e) {
          qrContainer.innerHTML = generateQRCodeSVG(booking.qrToken);
        }
      } else {
        qrContainer.innerHTML = generateQRCodeSVG(booking.qrToken);
      }
    }
  }
}

// Admin Dashboard Filter State
var adminCurrentFilter = "all";

function setAdminFilter(filter, btn) {
  adminCurrentFilter = filter;
  var tabs = document.querySelectorAll("#admin .filter-tab");
  tabs.forEach(function (t) { t.classList.remove("active"); });
  if (btn) btn.classList.add("active");
  renderAdminDashboard();
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
    var todayStr = (typeof getLocalDateString === "function") ? getLocalDateString() : new Date().toISOString().split("T")[0];
    var approvedToday = bookings.filter(function (b) {
      return b.status === "Approved" && b.createdAt && b.createdAt.startsWith(todayStr);
    }).length;
    var occupiedCount = bookings.filter(function (b) { return b.status === "Occupied"; }).length;

    statsEl.innerHTML =
      '<div class="card stat-card"><div class="stat-label">Pending requests</div><div class="stat-num">' + pending.length + '</div><div class="stat-sub">Awaiting review</div></div>' +
      '<div class="card stat-card"><div class="stat-label">Currently Occupied</div><div class="stat-num" style="color:var(--rust)">' + occupiedCount + '</div><div class="stat-sub">Live in classrooms</div></div>' +
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
            '<div><div class="req-name">' + escapeHtml(b.studentName) + '</div><div class="req-id">' + escapeHtml(b.studentId) + ' · ' + escapeHtml(b.id) + '</div></div>' +
            '<div><span class="badge badge-amber">' + escapeHtml(b.room) + '</span></div>' +
            '<div>' + formatDate(b.date) + '<br>' + formatTime(b.startTime) + '–' + formatTime(b.endTime) + '</div>' +
            '<div>' + escapeHtml(b.purpose) + (b.attendees ? ' (' + escapeHtml(String(b.attendees)) + ' ppl)' : '') + '</div>' +
            '<div class="req-actions">' +
            '<button class="btn btn-teal btn-sm" onclick="handleApprove(\'' + escapeHtml(b.id) + '\')">Approve</button>' +
            '<button class="btn btn-rust btn-sm" onclick="handleReject(\'' + escapeHtml(b.id) + '\')">Reject</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="handleShowSuggest(\'' + escapeHtml(b.id) + '\')">Suggest Alt</button>' +
            '</div></div>';
        }).join("");
    }
  }

  // All bookings list with search & filter
  var allEl = document.getElementById("admin-all");
  if (allEl) {
    var searchInput = document.getElementById("admin-search");
    var query = searchInput ? searchInput.value.toLowerCase().trim() : "";

    var filtered = all.filter(function (b) {
      if (adminCurrentFilter !== "all" && b.status !== adminCurrentFilter) return false;
      if (query) {
        var match = (b.studentName && b.studentName.toLowerCase().indexOf(query) !== -1) ||
                    (b.student && b.student.toLowerCase().indexOf(query) !== -1) ||
                    (b.room && b.room.toLowerCase().indexOf(query) !== -1) ||
                    (b.purpose && b.purpose.toLowerCase().indexOf(query) !== -1) ||
                    (b.id && b.id.toLowerCase().indexOf(query) !== -1);
        if (!match) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      allEl.innerHTML = '<div class="empty-state"><div class="icon">📋</div>No bookings match criteria.</div>';
    } else {
      allEl.innerHTML = filtered.slice().reverse().map(function (b) {
        return '<div class="booking-card">' +
          '<div style="display:flex;justify-content:space-between;align-items:start">' +
          '<div><h3>' + escapeHtml(b.purpose) + '</h3>' +
          '<div class="meta"><span>' + escapeHtml(b.studentName) + '</span><span>🏫 ' + escapeHtml(b.room) + '</span><span>📅 ' + formatDate(b.date) + '</span><span>🕐 ' + formatTime(b.startTime) + '–' + formatTime(b.endTime) + '</span></div></div>' +
          '<div>' + getStatusBadge(b.status) + '</div></div>' +
          (b.conditionRemark ? '<p style="font-size:12px;color:var(--muted);margin:6px 0 0">Room condition: ' + escapeHtml(b.conditionRemark) + '</p>' : '') +
          (b.rating ? '<div style="margin-top:6px;font-size:12px;color:var(--ink);background:var(--paper);border:1px solid var(--line-soft);padding:4px 10px;border-radius:4px;display:inline-block"><span style="color:#e59819;font-weight:600">★ ' + b.rating + '/5</span> · Student Feedback: "<em>' + escapeHtml(b.studentFeedback || 'Session completed') + '</em>"' + (b.feedbackTags && b.feedbackTags.length ? ' · <span style="color:var(--muted)">Tags: ' + escapeHtml(b.feedbackTags.join(', ')) + '</span>' : '') + '</div>' : '') +
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

var _pendingRejectId = null;

function handleReject(bookingId) {
  _pendingRejectId = bookingId;
  var overlay = document.getElementById("reject-modal-overlay");
  var label = document.getElementById("reject-modal-booking-label");
  var input = document.getElementById("reject-reason-input");
  if (overlay) overlay.style.display = "flex";
  if (label) label.textContent = "Booking Reference: " + bookingId;
  if (input) {
    input.value = "";
    setTimeout(function () { input.focus(); }, 60);
  }
}

function closeRejectModal() {
  var overlay = document.getElementById("reject-modal-overlay");
  if (overlay) overlay.style.display = "none";
  _pendingRejectId = null;
}

function confirmReject() {
  if (!_pendingRejectId) return;
  var input = document.getElementById("reject-reason-input");
  var remark = (input && input.value.trim()) ? input.value.trim() : "Request declined by admin.";
  var targetId = _pendingRejectId;
  var result = rejectBooking(targetId, remark);
  closeRejectModal();
  if (result.success) {
    showToast("Booking " + targetId + " rejected.", "info");
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

// Security Camera & Scanning State
var html5QrCodeScanner = null;
var scannerActive = false;

function setScannerMode(mode) {
  var btnCam = document.getElementById("btn-mode-camera");
  var btnManual = document.getElementById("btn-mode-manual");
  var camView = document.getElementById("camera-scanner-view");
  var manView = document.getElementById("manual-scanner-view");

  if (mode === "camera") {
    if (btnCam) btnCam.classList.add("active");
    if (btnManual) btnManual.classList.remove("active");
    if (camView) camView.style.display = "block";
    if (manView) manView.style.display = "none";
  } else {
    if (btnCam) btnCam.classList.remove("active");
    if (btnManual) btnManual.classList.add("active");
    if (camView) camView.style.display = "none";
    if (manView) manView.style.display = "block";
    stopCameraScanner();
  }
}

function startCameraScanner() {
  if (typeof Html5Qrcode === "undefined") {
    showToast("Camera QR scanning library not loaded.", "error");
    return;
  }
  if (scannerActive) return;

  var qrReaderEl = document.getElementById("qr-reader");
  if (!qrReaderEl) return;

  if (!html5QrCodeScanner) {
    html5QrCodeScanner = new Html5Qrcode("qr-reader");
  }

  var config = { fps: 10, qrbox: { width: 220, height: 220 } };
  html5QrCodeScanner.start(
    { facingMode: "environment" },
    config,
    function (decodedText) {
      handleScannedToken(decodedText);
      showToast("QR code detected: " + decodedText, "info");
    },
    function (err) {
      // Ignored continuous frame scan error
    }
  ).then(function () {
    scannerActive = true;
    var startBtn = document.getElementById("btn-start-camera");
    var stopBtn = document.getElementById("btn-stop-camera");
    if (startBtn) startBtn.style.display = "none";
    if (stopBtn) stopBtn.style.display = "inline-block";
    showToast("Camera active. Point at student booking QR.", "info");
  }).catch(function (err) {
    console.warn("Camera start failed:", err);
    showToast("Camera access error: " + (err.name || err.message || err), "error");
  });
}

function stopCameraScanner() {
  if (html5QrCodeScanner && scannerActive) {
    html5QrCodeScanner.stop().then(function () {
      scannerActive = false;
      var startBtn = document.getElementById("btn-start-camera");
      var stopBtn = document.getElementById("btn-stop-camera");
      if (startBtn) startBtn.style.display = "inline-block";
      if (stopBtn) stopBtn.style.display = "none";
    }).catch(function (err) {
      scannerActive = false;
      var startBtn = document.getElementById("btn-start-camera");
      var stopBtn = document.getElementById("btn-stop-camera");
      if (startBtn) startBtn.style.display = "inline-block";
      if (stopBtn) stopBtn.style.display = "none";
    });
  }
}

function handleQRFileUpload(input) {
  if (!input || !input.files || input.files.length === 0) return;
  var file = input.files[0];
  if (typeof Html5Qrcode === "undefined") {
    showToast("QR scanner not available.", "error");
    return;
  }
  var fileScanner = new Html5Qrcode("qr-reader");
  fileScanner.scanFile(file, true)
    .then(function (decodedText) {
      handleScannedToken(decodedText);
      input.value = "";
    })
    .catch(function (err) {
      showToast("Could not detect a valid QR code in the image.", "error");
      input.value = "";
    });
}

function handleScannedToken(token, bypassDateCheck) {
  if (!token) return;
  var resultEl = document.getElementById("scan-result");
  var result = checkInBooking(token, bypassDateCheck);

  if (result.success) {
    var b = result.booking;
    if (resultEl) {
      resultEl.innerHTML =
        '<div class="card" style="background:var(--teal-soft);border:1px solid var(--teal);padding:16px;text-align:center">' +
        '<span class="badge badge-teal" style="font-size:12px">Access Granted · Verified</span>' +
        '<h2 style="margin:10px 0 4px;font-size:24px;color:var(--teal)">' + escapeHtml(b.room) + ' UNLOCKED</h2>' +
        '<p style="font-weight:600;margin:4px 0">' + escapeHtml(b.purpose) + '</p>' +
        '<p class="confirm-detail" style="font-size:13px;color:var(--ink-soft)">Booked by: <strong>' + escapeHtml(b.studentName) + '</strong> (' + escapeHtml(b.studentId) + ')</p>' +
        '<p class="confirm-detail" style="font-size:12px;color:var(--muted)">Checked in at ' + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + '</p>' +
        '</div>';
    }
    showToast("Check-in successful — " + b.room + " is now Occupied.", "success");
    renderSecurityPage();
  } else if (result.dateMismatch) {
    var b = result.booking;
    if (resultEl) {
      resultEl.innerHTML =
        '<div class="error-box" style="text-align:left">' +
        '<strong>⚠️ Date Mismatch Warning</strong><br>' +
        escapeHtml(result.error) + '<br>' +
        '<div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
        '<button class="btn btn-rust btn-sm" onclick="handleScannedToken(\'' + escapeHtml(b.qrToken) + '\', true)">Security Override: Check In Anyway</button>' +
        '<span style="font-size:12px;color:var(--muted)">Requires guard authorization</span>' +
        '</div></div>';
    }
    showToast("Date mismatch warning for booking " + b.id, "error");
  } else {
    if (resultEl) {
      resultEl.innerHTML = '<div class="error-box">' + escapeHtml(result.error) + '</div>';
    }
  }
}

function handleManualCheckIn() {
  var manualInput = document.getElementById("qr-manual-input");
  var selectEl = document.getElementById("qr-select");
  var token = (manualInput && manualInput.value.trim()) ? manualInput.value.trim() : (selectEl ? selectEl.value : "");
  if (!token) {
    var resultEl = document.getElementById("scan-result");
    if (resultEl) resultEl.innerHTML = '<div class="error-box">Please select an approved booking or enter a QR token.</div>';
    return;
  }
  handleScannedToken(token);
}

// Security Page
function renderSecurityPage() {
  if (!currentUser || currentUser.role !== "security") return;

  // Show currently occupied rooms
  var occupiedEl = document.getElementById("occupied-list");
  if (occupiedEl) {
    var occupied = getBookings().filter(function (b) { return b.status === "Occupied"; });
    if (occupied.length === 0) {
      occupiedEl.innerHTML = '<div class="empty-state"><div class="icon">🔓</div>No rooms currently occupied.</div>';
    } else {
      occupiedEl.innerHTML = occupied.map(function (b) {
        return '<div class="occupied-card">' +
          '<h3>' + escapeHtml(b.room) + ' — ' + escapeHtml(b.purpose) + '</h3>' +
          '<div class="meta"><span>👤 ' + escapeHtml(b.studentName) + '</span><span>🕐 ' + formatTime(b.startTime) + '–' + formatTime(b.endTime) + '</span>' +
          (b.checkinTime ? '<span>✅ Checked in ' + timeAgo(b.checkinTime) + '</span>' : '') + '</div>' +
          '<div style="margin-top:8px">' +
          '<p style="font-size:13px;font-weight:600;color:var(--ink-soft);margin:0 0 6px">Room condition on checkout:</p>' +
          '<div class="condition-picker" id="cond-' + escapeHtml(b.id) + '">' +
          '<button class="condition-btn selected" onclick="selectCondition(\'' + escapeHtml(b.id) + '\', this)">No damage observed</button>' +
          '<button class="condition-btn" onclick="selectCondition(\'' + escapeHtml(b.id) + '\', this)">Projector issue</button>' +
          '<button class="condition-btn" onclick="selectCondition(\'' + escapeHtml(b.id) + '\', this)">Furniture issue</button>' +
          '<button class="condition-btn" onclick="selectCondition(\'' + escapeHtml(b.id) + '\', this)">Cleaning required</button>' +
          '<button class="condition-btn" onclick="selectCondition(\'' + escapeHtml(b.id) + '\', this)">Other</button>' +
          '</div>' +
          '<button class="btn btn-primary btn-sm" onclick="handleCheckOut(\'' + escapeHtml(b.id) + '\')">Complete & Free Room</button>' +
          '</div></div>';
      }).join("");
    }
  }

  // Populate QR token dropdown from approved bookings
  var selectEl = document.getElementById("qr-select");
  if (selectEl) {
    var approved = getBookings().filter(function (b) { return b.status === "Approved" && b.qrToken; });
    selectEl.innerHTML = '<option value="">-- Select an approved booking --</option>' +
      approved.map(function (b) {
        return '<option value="' + escapeHtml(b.qrToken) + '">' + escapeHtml(b.qrToken) + ' (' + escapeHtml(b.room) + ' · ' + escapeHtml(b.studentName) + ')</option>';
      }).join("");
  }
}

function selectCondition(bookingId, btn) {
  var container = document.getElementById("cond-" + bookingId);
  if (!container) return;
  container.querySelectorAll(".condition-btn").forEach(function (b) { b.classList.remove("selected"); });
  btn.classList.add("selected");
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
    showToast("Checked out — " + result.booking.room + " is now free. Condition: " + remark, "success");
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
      '<div class="notif-body"><p>' + escapeHtml(n.text) + '</p><div class="notif-time">' + timeAgo(n.time) + '</div></div>' +
      '</div>';
  }).join("");
}

// Student Rating & Feedback System
var _ratingBookingId = null;
var _currentRatingValue = 5;
var _selectedFeedbackTags = [];

function openRatingModal(bookingId) {
  _ratingBookingId = bookingId;
  var bookings = getBookings();
  var b = bookings.find(function (x) { return x.id === bookingId; });
  if (!b) return;

  var overlay = document.getElementById("feedback-modal-overlay");
  var subtitle = document.getElementById("feedback-modal-subtitle");
  var commentsEl = document.getElementById("fb-comments");
  var tagsContainer = document.getElementById("feedback-tag-row");

  if (subtitle) {
    subtitle.textContent = b.room + " · " + b.purpose + " (" + formatDate(b.date) + ")";
  }

  // Pre-fill existing rating if already rated
  _currentRatingValue = b.rating || 5;
  _selectedFeedbackTags = Array.isArray(b.feedbackTags) ? b.feedbackTags.slice() : [];
  if (commentsEl) commentsEl.value = b.studentFeedback || "";

  renderStarDisplay(_currentRatingValue);

  // Update tag button selected states
  if (tagsContainer) {
    tagsContainer.querySelectorAll(".fb-tag").forEach(function (tagBtn) {
      var tagText = tagBtn.textContent.replace(/^[^\s]+\s*/, "").trim();
      if (_selectedFeedbackTags.indexOf(tagText) !== -1) {
        tagBtn.classList.add("selected");
      } else {
        tagBtn.classList.remove("selected");
      }
    });
  }

  if (overlay) overlay.style.display = "flex";
}

function closeRatingModal() {
  var overlay = document.getElementById("feedback-modal-overlay");
  if (overlay) overlay.style.display = "none";
  _ratingBookingId = null;
}

function setFeedbackRating(val) {
  _currentRatingValue = val;
  renderStarDisplay(val);
}

function hoverFeedbackRating(val) {
  renderStarDisplay(val);
}

function resetHoverRating() {
  renderStarDisplay(_currentRatingValue || 5);
}

function renderStarDisplay(val) {
  var stars = document.querySelectorAll("#star-rating-container .star-btn");
  stars.forEach(function (s, idx) {
    if (idx < val) {
      s.classList.add("active");
    } else {
      s.classList.remove("active");
    }
  });

  var descMap = {
    1: "1/5 — Needs Significant Improvement",
    2: "2/5 — Below Expectations",
    3: "3/5 — Average / Satisfactory",
    4: "4/5 — Very Good Venue Setup",
    5: "5/5 — Excellent Experience"
  };
  var descEl = document.getElementById("rating-label-desc");
  if (descEl) descEl.textContent = descMap[val] || (val + "/5 Stars");
}

function toggleFeedbackTag(btn, tag) {
  var cleanTag = btn.textContent.replace(/^[^\s]+\s*/, "").trim();
  var idx = _selectedFeedbackTags.indexOf(cleanTag);
  if (idx === -1) {
    _selectedFeedbackTags.push(cleanTag);
    btn.classList.add("selected");
  } else {
    _selectedFeedbackTags.splice(idx, 1);
    btn.classList.remove("selected");
  }
}

async function submitFeedbackRating() {
  if (!_ratingBookingId) return;
  var bookings = getBookings();
  var b = bookings.find(function (x) { return x.id === _ratingBookingId; });
  if (!b) return;

  var comments = document.getElementById("fb-comments") ? document.getElementById("fb-comments").value.trim() : "";
  var ratingVal = _currentRatingValue || 5;

  b.rating = ratingVal;
  b.studentFeedback = comments;
  b.feedbackTags = _selectedFeedbackTags.slice();
  b.feedbackSubmittedAt = new Date().toISOString();

  // Save to local storage and sync to Supabase
  saveBookings(bookings);

  closeRatingModal();
  showToast("⭐ Feedback recorded (" + ratingVal + "/5 stars)! Stored in cloud database.", "success");

  // Re-render student dashboard
  renderStudentDashboard();
}

// Sync data with Supabase backend
async function clearAllData() {
  if (typeof initSupabase === "function") {
    showToast("Synchronizing with Supabase database...", "info");
    try {
      await initSupabase();
      if (currentUser) {
        if (currentUser.role === "student") renderStudentDashboard();
        else if (currentUser.role === "admin") renderAdminDashboard();
        else if (currentUser.role === "security") renderSecurityPage();
      }
      showToast("Data synchronized with live database.", "success");
    } catch (e) {
      showToast("Sync completed with cached data.", "info");
    }
  } else {
    showToast("Offline mode: cache is up to date.", "info");
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

  // Real-time password match listener
  var confirmInput = document.getElementById("su-confirm");
  var pwInput = document.getElementById("su-password");
  if (confirmInput && pwInput) {
    function checkPwMatch() {
      var hint = document.getElementById("pw-match-hint");
      if (!hint) return;
      var pw = pwInput.value;
      var cf = confirmInput.value;
      if (!cf) {
        hint.style.display = "none";
        return;
      }
      hint.style.display = "block";
      if (pw === cf) {
        hint.textContent = "✓ Passwords match";
        hint.style.color = "var(--teal)";
      } else {
        hint.textContent = "✕ Passwords do not match";
        hint.style.color = "var(--rust)";
      }
    }
    confirmInput.addEventListener("input", checkPwMatch);
    pwInput.addEventListener("input", checkPwMatch);
  }

  // Password strength meter
  if (pwInput) {
    pwInput.addEventListener("input", function () {
      var pw = pwInput.value;
      var fill = document.getElementById("pw-strength-fill");
      var label = document.getElementById("pw-strength-label");
      if (!fill || !label) return;
      if (pw.length === 0) {
        fill.style.width = "0%";
        label.textContent = "";
        return;
      }
      var score = 0;
      if (pw.length >= 6) score++;
      if (pw.length >= 10) score++;
      if (/[A-Z]/.test(pw)) score++;
      if (/[0-9]/.test(pw)) score++;
      if (/[^A-Za-z0-9]/.test(pw)) score++;
      var colors = ["#a13d3d", "#e07a16", "#a1752b", "#1f6f5c", "#1f6f5c"];
      var labels = ["Too short (min 6 chars)", "Weak", "Fair", "Strong", "Very strong"];
      var widths = ["20%", "40%", "60%", "80%", "100%"];
      var idx = Math.min(score, 4);
      fill.style.width = widths[idx];
      fill.style.background = colors[idx];
      label.textContent = labels[idx];
      label.style.color = colors[idx];
    });
  }

  // Room picker auto-update on date/time/attendees/purpose change
  var dateInput  = document.getElementById("f-date");
  var startInput = document.getElementById("f-start");
  var endInput   = document.getElementById("f-end");
  var attInput   = document.getElementById("f-attendees");
  var purpInput  = document.getElementById("f-purpose");
  var notesInput = document.getElementById("f-notes");

  if (dateInput)  dateInput.addEventListener("change",  updateRoomPicker);
  if (startInput) startInput.addEventListener("change", updateRoomPicker);
  if (endInput)   endInput.addEventListener("change",   updateRoomPicker);
  if (attInput)   attInput.addEventListener("input",    updateRoomPicker);
  if (purpInput)  purpInput.addEventListener("input",   updateRoomPicker);
  if (notesInput) notesInput.addEventListener("input",  updateRoomPicker);

  renderBoard();

  // Initialize Supabase integration
  if (typeof initSupabase === "function") {
    initSupabase();
  }

  // Multi-tab synchronization
  window.addEventListener("storage", function (e) {
    if (["bookings", "notifications", "currentUser", "bookingCounter"].includes(e.key)) {
      if (e.key === "currentUser") {
        var s = localStorage.getItem("currentUser");
        currentUser = s ? JSON.parse(s) : null;
      }
      updateNav();
      updateNotifBadge();
      var activePage = document.querySelector(".page.active");
      if (activePage) {
        var pid = activePage.id;
        if (pid === "dash") renderStudentDashboard();
        else if (pid === "admin") renderAdminDashboard();
        else if (pid === "security") renderSecurityPage();
        else if (pid === "home") renderBoard();
        else if (pid === "notifications") renderNotifications();
      }
    }
  });
});
