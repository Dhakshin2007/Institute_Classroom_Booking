// supabase.js - Real IIT Ropar Supabase Backend Integration
const SUPABASE_URL = "https://drblsmxstpxuburlfgcz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_gf_A-eAHt9LBX1ft3IRrqA_Trr-7Hty";

var supabaseClient = null;
var isSupabaseConnected = false;

// Initialize Supabase Client
try {
  if (typeof supabase !== "undefined" && supabase.createClient) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (err) {
  console.warn("Supabase client init warning:", err);
}

// Facility generator based on IIT Ropar room category
function getFacilitiesForCategory(category, code) {
  var cat = category || "";
  var cd = code || "";
  if (cd === "AUDITORIUM" || cat.indexOf("Auditorium") !== -1) {
    return ["Auditorium Stage", "PA System", "Central AC", "Dual Projector", "Tiered Seating"];
  }
  if (cat.indexOf("Seminar Hall") !== -1 || cd.indexOf("-SH") !== -1) {
    return ["Seminar Podium", "Dual Projector", "Wireless Mic", "Central AC", "Tiered Seating"];
  }
  if (cat.indexOf("SRC006/SRC005") !== -1 || cat.indexOf("SRC-10X") !== -1) {
    return ["Smart Board", "Dual Projector", "Central AC", "Tiered Seating", "Mic & PA"];
  }
  if (cat.indexOf("Lab") !== -1 || cd === "L/P") {
    return ["Workstations", "High-speed LAN", "Central AC", "Whiteboard", "Power Backup"];
  }
  if (cd.startsWith("CS-") || cd.startsWith("AI-")) {
    return ["Projector", "4K Display", "Central AC", "LAN Ports", "Whiteboard"];
  }
  if (cd.startsWith("EE-")) {
    return ["Projector", "Mic & PA", "AC", "Whiteboard", "Lab Power Bench"];
  }
  return ["Projector", "Mic & PA", "AC", "Whiteboard"];
}

// Load real IIT Ropar rooms from Supabase Seating_Capacity table
async function loadRoomsFromSupabase() {
  if (!supabaseClient) return null;
  try {
    var response = await supabaseClient
      .from("Seating_Capacity")
      .select("*")
      .order("Room_Code", { ascending: true });

    if (response.error) {
      console.warn("Error fetching Seating_Capacity:", response.error);
      return null;
    }

    if (response.data && response.data.length > 0) {
      var realRooms = response.data.map(function (r) {
        var cap = parseInt(r.Assumed_Seating_Capacity, 10);
        if (isNaN(cap) || cap <= 0) cap = 60;
        return {
          code: r.Room_Code,
          capacity: cap,
          category: r.Room_Category || "Classroom",
          facilities: getFacilitiesForCategory(r.Room_Category, r.Room_Code),
          sessionsCount: r.Scheduled_Sessions_Count || 0
        };
      });
      // Update global in-memory rooms
      rooms = realRooms;
      isSupabaseConnected = true;
      updateSupabaseBadge(true);
      return realRooms;
    }
  } catch (e) {
    console.warn("Supabase rooms fetch error:", e);
  }
  return null;
}

// Load scheduled timetable slots from vw_classroom_schedule
async function loadScheduleFromSupabase() {
  if (!supabaseClient) return null;
  try {
    var response = await supabaseClient
      .from("vw_classroom_schedule")
      .select("*")
      .limit(2000);

    if (response.error) {
      console.warn("Error fetching vw_classroom_schedule:", response.error);
      return null;
    }

    if (response.data && response.data.length > 0) {
      var realTimetable = response.data.map(function (row) {
        return {
          course: row.course_code || "CLASS",
          room: row.room_code || "ROOM",
          days: [row.day],
          start: (row.start_time || "08:00:00").substring(0, 5),
          end: (row.end_time || "08:50:00").substring(0, 5),
          title: row.raw_entry || (row.course_code + " in " + row.room_code)
        };
      });
      timetable = realTimetable;
      return realTimetable;
    }
  } catch (e) {
    console.warn("Supabase timetable fetch error:", e);
  }
  return null;
}

// Sync bookings from Supabase
async function loadBookingsFromSupabase() {
  if (!supabaseClient) return null;
  try {
    var response = await supabaseClient
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (response.error) {
      console.warn("Error fetching bookings:", response.error);
      return null;
    }

    if (response.data) {
      var mapped = response.data.map(function (b) {
        return {
          id: b.id,
          room: b.room_code,
          studentName: b.student_name,
          student: b.student_email,
          studentId: b.student_id,
          purpose: b.purpose,
          date: b.date,
          startTime: (b.start_time || "").substring(0, 5),
          endTime: (b.end_time || "").substring(0, 5),
          attendees: b.attendees,
          notes: b.notes,
          status: b.status,
          qrToken: b.qr_token,
          suggestedAltRoom: b.suggested_alt_room,
          adminRemark: b.admin_remark,
          conditionRemark: b.condition_remark,
          checkinTime: b.checkin_time,
          checkoutTime: b.checkout_time,
          createdAt: b.created_at
        };
      });

      // Update localStorage with fresh Supabase data
      localStorage.setItem("bookings", JSON.stringify(mapped));
      return mapped;
    }
  } catch (e) {
    console.warn("Supabase bookings fetch error:", e);
  }
  return null;
}

// Save a new booking to Supabase
async function saveBookingToSupabase(b) {
  if (!supabaseClient) return;
  try {
    var payload = {
      id: b.id,
      room_code: b.room,
      student_name: b.studentName,
      student_email: b.student,
      student_id: b.studentId,
      purpose: b.purpose,
      date: b.date,
      start_time: b.startTime,
      end_time: b.endTime,
      attendees: parseInt(b.attendees, 10) || 1,
      notes: b.notes || null,
      status: b.status,
      qr_token: b.qrToken || null,
      suggested_alt_room: b.suggestedAltRoom || null,
      admin_remark: b.adminRemark || null,
      condition_remark: b.conditionRemark || null,
      checkin_time: b.checkinTime || null,
      checkout_time: b.checkoutTime || null
    };

    var res = await supabaseClient.from("bookings").upsert(payload);
    if (res.error) console.error("Supabase upsert booking failed:", res.error);
  } catch (e) {
    console.error("Supabase upsert booking exception:", e);
  }
}

// Update an existing booking in Supabase
async function updateBookingInSupabase(id, updates) {
  if (!supabaseClient) return;
  try {
    var payload = {};
    if ("status" in updates) payload.status = updates.status;
    if ("qrToken" in updates) payload.qr_token = updates.qrToken;
    if ("adminRemark" in updates) payload.admin_remark = updates.adminRemark;
    if ("suggestedAltRoom" in updates) payload.suggested_alt_room = updates.suggestedAltRoom;
    if ("room" in updates) payload.room_code = updates.room;
    if ("conditionRemark" in updates) payload.condition_remark = updates.conditionRemark;
    if ("checkinTime" in updates) payload.checkin_time = updates.checkinTime;
    if ("checkoutTime" in updates) payload.checkout_time = updates.checkoutTime;

    var res = await supabaseClient.from("bookings").update(payload).eq("id", id);
    if (res.error) console.error("Supabase update booking failed:", res.error);
  } catch (e) {
    console.error("Supabase update booking exception:", e);
  }
}

// Realtime subscriptions for multi-user sync
function setupSupabaseRealtime() {
  if (!supabaseClient) return;
  try {
    supabaseClient
      .channel("public:bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, async function (payload) {
        console.log("⚡ Supabase Realtime booking change:", payload);
        await loadBookingsFromSupabase();
        // Re-render whichever view is active
        var active = document.querySelector(".page.active");
        if (active) {
          if (active.id === "dash" && typeof renderStudentDashboard === "function") renderStudentDashboard();
          else if (active.id === "admin" && typeof renderAdminDashboard === "function") renderAdminDashboard();
          else if (active.id === "security" && typeof renderSecurityPage === "function") renderSecurityPage();
          else if (active.id === "home" && typeof renderBoard === "function") renderBoard();
        }
      })
      .subscribe();
  } catch (e) {
    console.warn("Realtime subscribe error:", e);
  }
}

// Badge in UI
function updateSupabaseBadge(connected) {
  var badge = document.getElementById("supabase-status-badge");
  if (!badge) return;
  if (connected) {
    badge.className = "supabase-badge connected";
    badge.innerHTML = '<span class="status-dot"></span> <strong>Supabase Live</strong> · drblsmxstpxuburlfgcz (33 IIT Ropar Rooms)';
    badge.title = "Connected to Supabase PostgreSQL database";
  } else {
    badge.className = "supabase-badge offline";
    badge.innerHTML = '<span class="status-dot"></span> Offline / Local Demo Cache';
  }
}

// Master init called at DOMContentLoaded
async function initSupabase() {
  var badge = document.getElementById("supabase-status-badge");
  if (badge) {
    badge.innerHTML = '<span class="status-dot"></span> Connecting to Supabase...';
  }

  var roomsLoaded = await loadRoomsFromSupabase();
  if (roomsLoaded) {
    await loadScheduleFromSupabase();
    await loadBookingsFromSupabase();
    setupSupabaseRealtime();
    updateSupabaseBadge(true);
    // Refresh room picker and timetable with real data
    if (typeof updateRoomPicker === "function") updateRoomPicker();
    if (typeof renderTimetable === "function") renderTimetable();
    if (typeof renderBoard === "function") renderBoard();
  } else {
    updateSupabaseBadge(false);
  }
}
