(() => {
  "use strict";
  const Demo = window.AttendanceDemo;
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const root = $("#app");
  let data;
  let page = "dashboard";
  let browserLocation = null;
  let cameraStream = null;
  let cameraMode = null;
  let cameraTimer = null;
  let cameraGeneration = 0;
  let scanner = null;
  let scanCanvas = null;
  let toastTimer;
  const filters = { history: {}, records: {}, report: {} };
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "⌂", roles: ["admin", "student"] },
    { id: "profile", label: "My profile", icon: "◉", roles: ["student"] },
    { id: "mark", label: "Mark attendance", icon: "✓", roles: ["student"] },
    { id: "history", label: "Attendance history", icon: "▤", roles: ["admin", "student"] },
    { id: "students", label: "Manage students", icon: "♙", roles: ["admin"] },
    { id: "records", label: "Manage attendance", icon: "▦", roles: ["admin"] },
    { id: "reports", label: "Reports & export", icon: "↗", roles: ["admin"] },
    { id: "settings", label: "Verification settings", icon: "⚙", roles: ["admin"] },
    { id: "about", label: "Java & OOP concepts", icon: "⌘", roles: ["admin", "student"] }
  ];
  const titles = {
    dashboard: "Dashboard", profile: "My profile", mark: "Mark attendance",
    history: "Attendance history", students: "Manage students", records: "Manage attendance",
    reports: "Reports & export", settings: "Verification settings", about: "Java & OOP concepts"
  };

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }
  function today() { return Demo.Storage.localDate(); }
  function toast(message, isError = false) {
    const element = $("#toast");
    element.textContent = message;
    element.className = `toast show${isError ? " error" : ""}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { element.className = "toast"; }, 3600);
  }
  function requireUser(role) {
    if (!data.currentUser || (role && data.currentUser.role !== role)) {
      page = "dashboard";
      toast("That page is not available for this demo account.", true);
      render();
      return false;
    }
    return true;
  }
  function statusBadge(status) {
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    return `<span class="badge ${esc(status)}">${esc(label)}</span>`;
  }
  function pageHeading(eyebrow, title, description, action = "") {
    return `<div class="page-heading"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1><p>${esc(description)}</p></div>${action}</div>`;
  }
  function statCard(label, value, detail, icon) {
    return `<article class="stat-card"><div class="stat-top"><span>${esc(label)}</span><span class="stat-icon" aria-hidden="true">${icon}</span></div><strong>${esc(value)}</strong><small>${esc(detail)}</small></article>`;
  }
  function attendanceTable(records, showStudent) {
    if (!records.length) return '<div class="empty-state">No attendance records match these filters.</div>';
    return `<div class="table-wrap"><table><thead><tr>${showStudent ? "<th>Student</th>" : ""}<th>Date / time</th><th>Subject</th><th>Status</th><th>Verification</th></tr></thead><tbody>${records.slice(0, 100).map((record) => {
      const student = Demo.Attendance.studentFor(data, record.studentId);
      const subject = Demo.Attendance.subjectFor(data, record.subjectId);
      return `<tr>${showStudent ? `<td><strong>${esc(student ? student.name : record.studentId)}</strong><br><small>${esc(record.studentId)}</small></td>` : ""}<td>${esc(record.date)}<br><small>${esc(record.time)}</small></td><td>${esc(subject ? subject.name : record.subjectId)}</td><td>${statusBadge(record.status)}</td><td>${esc(record.verification || "—")}</td></tr>`;
    }).join("")}</tbody></table></div>`;
  }
  function dashboardPage() {
    return data.currentUser.role === "admin" ? adminDashboard() : studentDashboard();
  }
  function adminDashboard() {
    const todayStats = Demo.Attendance.todaySummary(data);
    const averages = data.students.map((student) => Demo.Attendance.studentSummary(data, student.id).percentage);
    const overall = averages.length ? Math.round(averages.reduce((sum, item) => sum + item, 0) / averages.length) : 0;
    const lowStudents = data.students.filter((student) => Demo.Attendance.studentSummary(data, student.id).percentage < Number(data.settings.threshold));
    const recent = [...data.records].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)).slice(0, 7);
    return `${pageHeading("ADMIN OVERVIEW", "Good day, administrator", "Monitor today's class activity and review attendance records.")}
      <div class="grid stats">${statCard("Registered students", data.students.length, "Sample demo roster", "♙")}${statCard("Present today", todayStats.present, "Students with a present or late record", "✓")}${statCard("Absent today", todayStats.absent, "Based on today's recorded check-ins", "—")}${statCard("Average attendance", `${overall}%`, `Threshold is ${data.settings.threshold}%`, "◷")}</div>
      <div class="grid two-col"><section class="panel"><div class="panel-heading"><div><h2>Recent attendance</h2><p>Latest sample and live demo records</p></div><button class="button secondary small" data-go="records">View records</button></div>${attendanceTable(recent, true)}</section>
      <section class="panel"><div class="panel-heading"><div><h2>Below threshold</h2><p>Students who may need support</p></div><span class="badge ${lowStudents.length ? "late" : ""}">${lowStudents.length} students</span></div>${lowStudents.length ? lowStudents.map((student) => {
        const summary = Demo.Attendance.studentSummary(data, student.id);
        return `<div class="progress-row"><div class="progress-label"><strong>${esc(student.name)}</strong><span>${summary.percentage}%</span></div><div class="progress-track"><i class="${summary.percentage < 60 ? "low" : ""}" style="width:${summary.percentage}%"></i></div></div>`;
      }).join("") : '<div class="empty-state">All students are at or above the configured threshold.</div>'}<div class="footer-note">Attendance summaries count present and late records as attended. Rejected attempts are excluded.</div></section></div>
      ${data.attempts.length ? `<section class="panel" style="margin-top:16px"><div class="panel-heading"><div><h2>Rejected or suspicious attempts</h2><p>For review; a failed check alone does not establish proxy attendance.</p></div></div>${attemptsTable(data.attempts.slice(0, 5))}</section>` : ""}`;
  }
  function periodSummary(studentId, days) {
    const firstDay = new Date();
    firstDay.setHours(0, 0, 0, 0);
    firstDay.setDate(firstDay.getDate() - days + 1);
    const records = data.records.filter((record) => record.studentId === studentId &&
      record.status !== "rejected" && new Date(`${record.date}T00:00:00`) >= firstDay);
    const attended = records.filter((record) => Demo.Attendance.isAttended(record.status)).length;
    return { attended, total: records.length, percentage: records.length ? Math.round(attended / records.length * 100) : 0 };
  }
  function studentDashboard() {
    const student = Demo.Attendance.studentFor(data, data.currentUser.id);
    const summary = Demo.Attendance.studentSummary(data, student.id);
    const recent = data.records.filter((record) => record.studentId === student.id)
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)).slice(0, 7);
    const low = summary.percentage < Number(data.settings.threshold);
    const subjects = data.subjects.map((subject) => ({
      subject, summary: Demo.Attendance.studentSummary(data, student.id, subject.id)
    }));
    return `${pageHeading("STUDENT OVERVIEW", `Welcome, ${student.name.split(" ")[0]}`, "Your attendance overview and recent class activity.", '<button class="button" data-go="mark">Mark attendance</button>')}
      ${low ? `<div class="notice warning" style="margin-bottom:16px"><strong>Attendance warning:</strong> your attendance is ${summary.percentage}%, below the ${data.settings.threshold}% minimum. Review your subject-wise attendance and contact your faculty advisor.</div>` : ""}
      <div class="grid stats">${statCard("Overall attendance", `${summary.percentage}%`, `${summary.attended} of ${summary.total} counted classes attended`, "◷")}${statCard("Present", data.records.filter((r) => r.studentId === student.id && r.status === "present").length, "Across your recorded classes", "✓")}${statCard("Late", data.records.filter((r) => r.studentId === student.id && r.status === "late").length, "Late check-ins count as attended", "◷")}${statCard("Subjects", data.subjects.length, "Subjects in this demo", "▤")}</div>
      <section class="panel" style="margin-bottom:16px"><div class="panel-heading"><div><h2>Attendance by period</h2><p>Rolling periods through today; rejected attempts are excluded.</p></div></div><div class="grid three-col">${[[1, "Today"], [7, "Last 7 days"], [30, "Last 30 days"]].map(([days, label]) => { const result = periodSummary(student.id, Number(days)); return `<div><div class="progress-label"><strong>${label}</strong><span>${result.attended}/${result.total} · ${result.percentage}%</span></div><div class="progress-track" style="margin-top:8px"><i class="${result.percentage < Number(data.settings.threshold) ? "low" : ""}" style="width:${result.percentage}%"></i></div></div>`; }).join("")}</div></section>
      <div class="grid two-col"><section class="panel"><div class="panel-heading"><div><h2>Subject attendance</h2><p>Minimum requirement: ${esc(data.settings.threshold)}%</p></div></div>${subjects.map(({ subject, summary: item }) => `<div class="progress-row"><div class="progress-label"><strong>${esc(subject.name)}</strong><span>${item.percentage}% · ${item.attended}/${item.total}</span></div><div class="progress-track"><i class="${item.percentage < Number(data.settings.threshold) ? "low" : ""}" style="width:${item.percentage}%"></i></div></div>`).join("")}<div class="footer-note">Subject percentages count present and late records as attended.</div></section>
      <section class="panel"><div class="panel-heading"><div><h2>Recent history</h2><p>Your latest attendance records</p></div><button class="button secondary small" data-go="history">All records</button></div>${attendanceTable(recent, false)}</section></div>`;
  }
  function profilePage() {
    if (!requireUser("student")) return "";
    const student = Demo.Attendance.studentFor(data, data.currentUser.id);
    const summary = Demo.Attendance.studentSummary(data, student.id);
    return `${pageHeading("STUDENT", "My profile", "Your demo student account and attendance summary.")}
      <section class="panel"><div class="panel-heading"><div><h2>Student information</h2><p>Sample profile data for this browser demo</p></div></div><div class="grid three-col">
      ${profileField("Student ID", student.id)}${profileField("Full name", student.name)}${profileField("Email", student.email)}${profileField("Course", student.course)}${profileField("Year", student.year)}${profileField("Overall attendance", `${summary.percentage}%`)}</div>
      <div class="notice" style="margin-top:15px">This profile uses sample data. Do not enter real student personal information into this frontend-only project.</div></section>`;
  }
  function profileField(label, value) {
    return `<div><div class="label-caps">${esc(label)}</div><p><strong>${esc(value)}</strong></p></div>`;
  }
  function markPage() {
    if (!requireUser("student")) return "";
    const student = Demo.Attendance.studentFor(data, data.currentUser.id);
    return `${pageHeading("CHECK-IN", "Mark attendance", "Enter the class session code provided by your instructor.")}
      <div class="grid two-col"><section class="panel"><div class="panel-heading"><div><h2>Class check-in</h2><p>Signed in as ${esc(student.name)} · ${esc(student.id)}</p></div><span class="badge">Demo mode</span></div>
      <form id="checkinForm"><div class="field"><label for="checkSubject">Subject</label><select id="checkSubject" name="subjectId" required>${subjectOptions()}</select></div>
      <div class="field"><label for="sessionCode">Session code</label><input id="sessionCode" name="code" autocomplete="off" placeholder="Enter the code from the class session" required maxlength="20"></div>
      <div class="grid two-col media-tools">
        <div class="panel media-panel"><h3>Class session QR preview</h3><div id="studentQr" class="qr-code" role="img" aria-label="QR code for the selected attendance session"></div><p id="studentQrStatus" class="footer-note">This is the current demo QR for the selected subject.</p><button type="button" class="button secondary small" data-action="download-qr" data-qr-target="studentQr">Download class QR</button></div>
        <div class="panel media-panel"><h3>Face camera demo</h3><p class="muted">Camera preview only. This does not recognize a face or confirm identity.</p><video id="studentCamera" class="camera-preview" autoplay muted playsinline hidden></video><p id="cameraStatus" class="footer-note">Camera is off. No image is recorded or saved.</p><button type="button" class="button secondary small" data-action="face-camera">Start camera demo</button><button type="button" class="button secondary small" data-action="stop-camera" hidden>Stop camera</button></div>
      </div>
      <div class="panel scanner-panel"><h3>Scan instructor's class QR code</h3><p class="muted">Allow camera access to scan the QR code displayed by your instructor. The scanner uses your browser's QR API or a JavaScript fallback.</p><video id="scannerCamera" class="camera-preview" autoplay muted playsinline hidden></video><button type="button" class="button secondary small" data-action="scan-qr">Open QR scanner</button><p id="scannerStatus" class="footer-note" role="status">Scanner is off. Camera access starts only when you choose Open QR scanner. You can enter the session code manually if needed.</p></div>
      <div class="check-field"><input type="checkbox" id="useLocation"><label for="useLocation">Request my browser location and include an approximate campus-radius check (optional, requires permission).</label></div>
      <button type="button" class="button secondary small" data-action="location">Check my location</button><span id="locationResult" class="muted" style="margin-left:8px;font-size:10px">${browserLocation ? "Location available for this check-in." : "No location check performed."}</span>
      ${data.settings.requireLocation ? '<div class="notice warning" style="margin:12px 0">Location check is required by the demo administrator. Use “Check my location” and enable the location option above.</div>' : ""}
      <button class="button full" type="submit">Submit attendance</button></form>
      <p class="footer-note">A valid check-in stores a demo record in this browser. Duplicate and invalid attempts are logged for admin review. This frontend cannot guarantee prevention of proxy attendance.</p></section>
      <aside class="panel"><div class="panel-heading"><div><h2>Session rules</h2><p>Current demo validation</p></div></div><div class="notice">Session codes expire at the configured time. Attendance is recorded once per student, subject and session date.</div>
      <div class="footer-note"><strong>Location:</strong> ${data.settings.requireLocation ? "required by administrator" : "optional"} · allowed radius ${esc(data.settings.radiusMeters)} m.<br><strong>Face feature:</strong> camera preview only; not face recognition.</div>
      <div class="notice warning" style="margin-top:15px">Location checks are approximate and browser coordinates can be spoofed. They are not secure proof of presence.</div></aside></div>`;
  }
  function historyPage() {
    const studentId = data.currentUser.role === "student" ? data.currentUser.id : "";
    return `${pageHeading("RECORDS", "Attendance history", studentId ? "Filter your own attendance records." : "Browse daily attendance across the sample roster.")}
      <section class="panel"><div class="filters"><input class="filter-control" type="search" id="historyQuery" placeholder="Search student or subject" value="${esc(filters.history.query || "")}" ${studentId ? "disabled" : ""}><input class="filter-control" type="date" id="historyDate" value="${esc(filters.history.date || "")}"><select class="filter-control" id="historySubject"><option value="">All subjects</option>${subjectOptions(filters.history.subjectId)}</select><select class="filter-control" id="historyStatus"><option value="">All statuses</option>${statusOptions(filters.history.status)}</select><button class="button secondary small" data-action="filter-history">Apply filters</button></div>
      <div id="historyResults">${attendanceTable(filteredRecords("history"), !studentId)}</div></section>`;
  }
  function subjectOptions(selected = "") { return data.subjects.map((s) => `<option value="${esc(s.id)}" ${s.id === selected ? "selected" : ""}>${esc(s.name)}</option>`).join(""); }
  function statusOptions(selected = "") { return ["present", "absent", "late", "rejected"].map((s) => `<option value="${s}" ${s === selected ? "selected" : ""}>${s[0].toUpperCase()}${s.slice(1)}</option>`).join(""); }
  function filteredRecords(prefix) {
    const isStudent = data.currentUser.role === "student";
    const records = Demo.Attendance.filterRecords(data, {
      query: isStudent ? "" : filters[prefix].query || "",
      date: filters[prefix].date || "",
      subjectId: filters[prefix].subjectId || "",
      status: filters[prefix].status || ""
    });
    return isStudent ? records.filter((record) => record.studentId === data.currentUser.id) : records;
  }
  function studentsPage() {
    if (!requireUser("admin")) return "";
    const rows = data.students.map((student) => {
      const summary = Demo.Attendance.studentSummary(data, student.id);
      return `<tr><td><strong>${esc(student.name)}</strong></td><td>${esc(student.id)}</td><td>${esc(student.email)}</td><td>${esc(student.course)} · ${esc(student.year)}</td><td><span class="badge ${summary.percentage < Number(data.settings.threshold) ? "late" : ""}">${summary.percentage}%</span></td><td><button class="button secondary small" data-action="edit-student" data-student-id="${esc(student.id)}">Edit</button></td></tr>`;
    }).join("");
    return `${pageHeading("ROSTER", "Manage students", "Review demo students or add a sample student record.")}
      <div class="grid two-col"><section class="panel"><div class="panel-heading"><div><h2>Student roster</h2><p>${data.students.length} records in local demo storage</p></div></div><div class="filters"><input class="filter-control" type="search" id="studentSearch" placeholder="Search roster" data-action="search-students"></div><div class="table-wrap"><table><thead><tr><th>Name</th><th>ID</th><th>Email</th><th>Program</th><th>Attendance</th><th>Manage</th></tr></thead><tbody id="studentRows">${rows}</tbody></table></div></section>
      <section class="panel"><div class="panel-heading"><div><h2>Add student</h2><p>Use fictional/sample information only.</p></div></div><form id="studentForm"><div class="field"><label for="newStudentId">Student ID</label><input id="newStudentId" name="id" required pattern="[A-Za-z0-9]{3,16}" placeholder="STU005"></div><div class="field"><label for="newStudentName">Full name</label><input id="newStudentName" name="name" required minlength="2" maxlength="70"></div><div class="field"><label for="newStudentEmail">Email</label><input id="newStudentEmail" name="email" type="email" required></div><div class="field"><label for="newStudentCourse">Course</label><input id="newStudentCourse" name="course" required value="B.Tech IT"></div><div class="field"><label for="newStudentYear">Year</label><select name="year"><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option></select></div><button class="button full" type="submit">Add sample student</button></form></section></div>`;
  }
  function recordsPage() {
    if (!requireUser("admin")) return "";
    const records = filteredRecords("records");
    const rows = records.slice(0, 80).map((record) => {
      const student = Demo.Attendance.studentFor(data, record.studentId);
      const subject = Demo.Attendance.subjectFor(data, record.subjectId);
      return `<tr><td>${esc(student ? student.name : record.studentId)}<br><small>${esc(record.studentId)}</small></td><td>${esc(record.date)} ${esc(record.time)}</td><td>${esc(subject ? subject.name : record.subjectId)}</td><td>${statusBadge(record.status)}</td><td><select class="filter-control" data-record-status="${esc(record.id)}" aria-label="New status for ${esc(record.id)}">${statusOptions().replace(`value="${esc(record.status)}"`, `value="${esc(record.status)}" selected`)}</select> <button class="button secondary small" data-action="correct-record" data-record-id="${esc(record.id)}">Correct</button></td></tr>`;
    }).join("");
    return `${pageHeading("ADMIN TOOLS", "Manage attendance", "Filter records and correct them with a required audit note.")}
      <section class="panel"><div class="filters"><input class="filter-control" type="search" id="recordsQuery" placeholder="Search student or subject" value="${esc(filters.records.query || "")}"><input class="filter-control" type="date" id="recordsDate" value="${esc(filters.records.date || "")}"><select class="filter-control" id="recordsSubject"><option value="">All subjects</option>${subjectOptions(filters.records.subjectId)}</select><select class="filter-control" id="recordsStatus"><option value="">All statuses</option>${statusOptions(filters.records.status)}</select><button class="button secondary small" data-action="filter-records">Apply filters</button></div>
      <div class="table-wrap">${rows ? `<table><thead><tr><th>Student</th><th>Date / time</th><th>Subject</th><th>Current status</th><th>Correct status</th></tr></thead><tbody>${rows}</tbody></table>` : '<div class="empty-state">No attendance records match these filters.</div>'}</div>
      <div class="footer-note">Corrections require an audit note and are preserved in the audit history below. Showing up to 80 matches.</div></section>
      <section class="panel" style="margin-top:16px"><div class="panel-heading"><div><h2>Correction audit history</h2><p>Admin changes recorded in this browser</p></div></div>${auditTable(data.audit.slice(0, 10))}</section>
      <section class="panel" style="margin-top:16px"><div class="panel-heading"><div><h2>Rejected and suspicious attempts</h2><p>Review reasons without treating one failed check as proof of misconduct.</p></div></div>${attemptsTable(data.attempts.slice(0, 30))}</section>`;
  }
  function attemptsTable(attempts) {
    if (!attempts.length) return '<div class="empty-state">No rejected attempts recorded.</div>';
    return `<div class="table-wrap"><table><thead><tr><th>Student</th><th>Date / time</th><th>Subject</th><th>Result</th><th>Reason</th></tr></thead><tbody>${attempts.map((attempt) => {
      const student = Demo.Attendance.studentFor(data, attempt.studentId);
      const subject = Demo.Attendance.subjectFor(data, attempt.subjectId);
      return `<tr><td>${esc(student ? student.name : attempt.studentId)} (${esc(attempt.studentId)})</td><td>${esc(attempt.date)} ${esc(attempt.time)}</td><td>${esc(subject ? subject.name : attempt.subjectId)}</td><td>${statusBadge(attempt.status)}</td><td>${esc(attempt.reason)}</td></tr>`;
    }).join("")}</tbody></table></div>`;
  }
  function auditTable(entries) {
    if (!entries.length) return '<div class="empty-state">No corrections have been made.</div>';
    return `<div>${entries.map((entry) => `<div class="audit-item"><strong>${esc(entry.studentId)} · ${esc(entry.date)} · ${esc(entry.oldStatus)} → ${esc(entry.newStatus)}</strong><p>${esc(entry.note)}</p><small>By ${esc(entry.adminId)} · ${esc(new Date(entry.createdAt).toLocaleString())}</small></div>`).join("")}</div>`;
  }
  function reportsPage() {
    if (!requireUser("admin")) return "";
    const records = filteredRecords("report");
    const valid = records.filter((record) => record.status !== "rejected");
    const avg = valid.length ? Math.round(valid.filter((r) => Demo.Attendance.isAttended(r.status)).length / valid.length * 100) : 0;
    return `${pageHeading("REPORTING", "Reports & export", "Filter records, review attendance rates, and export a spreadsheet-ready CSV.", '<button class="button" data-action="export">Export CSV</button>')}
      <section class="panel"><div class="filters"><input class="filter-control" type="search" id="reportQuery" placeholder="Search student or subject" value="${esc(filters.report.query || "")}"><input class="filter-control" type="date" id="reportDate" value="${esc(filters.report.date || "")}"><select class="filter-control" id="reportSubject"><option value="">All subjects</option>${subjectOptions(filters.report.subjectId)}</select><select class="filter-control" id="reportStatus"><option value="">All statuses</option>${statusOptions(filters.report.status)}</select><button class="button secondary small" data-action="filter-reports">Apply filters</button></div>
      <div class="grid stats">${statCard("Matching records", records.length, "Based on selected filters", "▤")}${statCard("Attendance rate", `${avg}%`, "Present and late / counted records", "◷")}${statCard("Present", valid.filter((r) => r.status === "present").length, "Matching present statuses", "✓")}${statCard("Absent", valid.filter((r) => r.status === "absent").length, "Matching absent statuses", "—")}</div>
      <div id="reportResults">${attendanceTable(records, true)}</div></section>
      <p class="footer-note">CSV exports include the active filters and are generated locally in your browser. Rejected attempts are excluded from the attendance percentage.</p>`;
  }
  function localInputTime(value) {
    const date = new Date(value || Date.now());
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
  }
  function settingsPage() {
    if (!requireUser("admin")) return "";
    return `${pageHeading("DEMO CONFIGURATION", "Verification settings", "Configure the sample attendance threshold, campus area, and class session codes.")}
      <div class="grid two-col"><section class="panel"><div class="panel-heading"><div><h2>Attendance and location</h2><p>These settings are stored only in this browser.</p></div></div>
      <form id="settingsForm"><div class="field"><label for="threshold">Minimum attendance threshold (%)</label><input id="threshold" name="threshold" type="number" min="1" max="100" required value="${esc(data.settings.threshold)}"></div>
      <div class="field"><label for="radiusMeters">Permitted sample radius (meters)</label><input id="radiusMeters" name="radiusMeters" type="number" min="25" max="50000" required value="${esc(data.settings.radiusMeters)}"></div>
      <div class="field-grid"><div class="field"><label for="collegeLatitude">Sample campus latitude</label><input id="collegeLatitude" name="collegeLatitude" type="number" min="-90" max="90" step="any" required value="${esc(data.settings.collegeLatitude)}"></div><div class="field"><label for="collegeLongitude">Sample campus longitude</label><input id="collegeLongitude" name="collegeLongitude" type="number" min="-180" max="180" step="any" required value="${esc(data.settings.collegeLongitude)}"></div></div>
      <div class="check-field"><input type="checkbox" id="requireLocation" name="requireLocation" ${data.settings.requireLocation ? "checked" : ""}><label for="requireLocation">Require browser location before accepting check-ins (may block users who deny permission).</label></div><button class="button" type="submit">Save verification settings</button></form>
      <div class="notice warning" style="margin-top:14px">Geolocation is approximate and can be spoofed. Do not use it as secure authentication or sole evidence of misconduct.</div></section>
      <section class="panel"><div class="panel-heading"><div><h2>Class session codes</h2><p>Demo codes are visible to make testing easy, not secure secrets.</p></div></div>
      <form id="sessionsForm">${data.subjects.map((subject) => {
        const session = data.settings.sessions[subject.id] || { code: "", expiresAt: new Date().toISOString() };
        return `<div class="field-grid"><div class="field"><label for="code-${esc(subject.id)}">${esc(subject.name)} code</label><input id="code-${esc(subject.id)}" name="code-${esc(subject.id)}" required maxlength="20" value="${esc(session.code)}"></div><div class="field"><label for="expiry-${esc(subject.id)}">Expiry</label><input id="expiry-${esc(subject.id)}" name="expiry-${esc(subject.id)}" type="datetime-local" required value="${esc(localInputTime(session.expiresAt))}"></div></div>`;
      }).join("")}<button class="button" type="submit">Save session codes</button></form>
      <div class="session-qr-panel"><div class="field"><label for="settingsQrSubject">Share a class QR code</label><select id="settingsQrSubject">${subjectOptions()}</select></div><div id="settingsQr" class="qr-code" role="img" aria-label="QR code for the selected attendance session"></div><p id="settingsQrStatus" class="footer-note">Students can scan this code from their check-in screen when QR scanning is supported.</p><button type="button" class="button secondary small" data-action="download-qr" data-qr-target="settingsQr">Download QR</button></div>
      <hr style="border:0;border-top:1px solid var(--line);margin:20px 0"><div class="panel-heading"><div><h2>Reset browser demo</h2><p>Restore sample students, records, codes, and settings.</p></div></div><button class="button danger" data-action="reset">Reset demo data</button></section></div>
      <p class="footer-note">QR scanning and camera preview require a supported browser and permission. The camera feature is a preview-only demo; it does not recognize faces or verify identity.</p>`;
  }
  function aboutPage() {
    return `${pageHeading("JAVA PROJECT", "Java & OOP concepts", "How Java programming and object-oriented concepts support attendance features.")}
      <div class="grid two-col"><section class="panel"><div class="panel-heading"><div><h2>Five Java syllabus units</h2><p>Java source is kept separately under java-source/.</p></div></div>
      <div class="audit-item"><strong>Unit 1 · Java programming basics</strong><p>AttendanceManager demonstrates variables, data types, loops, conditions, methods, and a runnable main method.</p></div>
      <div class="audit-item"><strong>Unit 2 · OOP, arrays, collections and lambdas</strong><p>User is an abstract base class; Student and Admin inherit and override role descriptions. Attendance records use lists/maps, and lambda expressions filter records.</p></div>
      <div class="audit-item"><strong>Unit 3 · Packages, strings and exceptions</strong><p>Models, services, storage and app code are separated into packages. Session validation normalizes strings and throws clear domain exceptions.</p></div>
      <div class="audit-item"><strong>Unit 4 · Concurrency and I/O streams</strong><p>ConcurrentAttendanceProcessor illustrates safe parallel processing; FileStorageService reads and writes a CSV file using Java I/O.</p></div>
      <div class="audit-item"><strong>Unit 5 · GUI concepts, generics and collections</strong><p>This JavaScript browser interface demonstrates GUI concepts. Java uses generic collection APIs and a reusable generic filtering method; there is no Java GUI/backend in this demo.</p></div></section>
      <section class="panel"><div class="panel-heading"><div><h2>Architecture</h2><p>Static Netlify frontend + independent Java console demonstration</p></div></div><div class="notice">HTML builds the role-based UI, CSS provides responsive layouts, and vanilla JavaScript modules handle simulated authentication, validation, attendance, reporting, and localStorage persistence. Java source demonstrates OOP and syllabus topics; it is not a deployed backend.</div>
      <div class="notice warning" style="margin-top:14px"><strong>Security & privacy:</strong> demo passwords and data are fictional. localStorage can be inspected or modified. Real authentication, multi-user synchronization, reliable anti-proxy controls, secure audit trails, and sensitive-data protection require a server and database.</div>
      <div class="notice" style="margin-top:14px">Location uses browser permission only when explicitly requested. The camera feature is a student-started preview only; it does not recognize faces, verify identity, or save video. QR sessions are demo codes rather than secure tokens.</div></section></div>
      <section class="panel" style="margin-top:16px"><div class="panel-heading"><div><h2>Viva practice</h2><p>Short project-linked questions and answers</p></div></div>
      <div class="audit-item"><strong>Why is Student derived from User?</strong><p>Shared identity behavior is modeled once in an abstract base type; student-specific details remain in Student.</p></div>
      <div class="audit-item"><strong>How is attendance calculated?</strong><p>Present and late records count as attended; absent records count in the denominator and rejected attempts are excluded.</p></div>
      <div class="audit-item"><strong>Why is localStorage not suitable for real attendance?</strong><p>It is user-editable, browser-local, and cannot provide trusted identity, shared data, or server-enforced authorization.</p></div>
      <div class="audit-item"><strong>How does the Java example avoid duplicate check-ins?</strong><p>AttendanceService checks student, subject, and session before adding a record and throws a domain exception for duplicates.</p></div>
      <div class="audit-item"><strong>What does ExecutorService demonstrate?</strong><p>It demonstrates coordinating concurrent class-processing tasks. It is an educational example, not a production attendance service.</p></div></section>`;
  }
  function loginPage() {
    return `<main class="login-wrap"><section class="login-aside"><div><a class="brand" href="#" aria-label="Attendly home"><span class="brand-mark">A</span><span>Attendly <small style="display:block;color:#d3e0ff;font-size:9px;font-weight:500">SMART ATTENDANCE DEMO</small></span></a><h1>Make every class count.</h1><p>A student-friendly attendance management demonstration built with HTML, CSS, JavaScript, and localStorage.</p></div><div class="footer-note" style="color:#d7e3ff">Educational simulation only · No production authentication or face recognition</div></section>
      <section class="login-main"><div class="login-card"><div class="eyebrow">WELCOME</div><h2>Sign in to Attendly</h2><p>Choose a role and use the sample credentials below.</p><form id="loginForm"><div class="field"><label for="role">Role</label><select id="role" name="role"><option value="student">Student</option><option value="admin">Admin</option></select></div><div class="field"><label for="identifier">Student ID or admin email</label><input id="identifier" name="identifier" autocomplete="username" required placeholder="STU001"></div><div class="field"><label for="password">Demo password</label><input id="password" name="password" type="password" autocomplete="current-password" required value="demo123"></div><button class="button full" type="submit">Sign in</button></form>
      <div class="demo-hint"><strong>Sample credentials</strong><br>Admin: admin@demo.edu · Password: demo123<br>Student: STU001, STU002, STU003 or STU004 · Password: demo123<br><button type="button" class="button secondary small" data-action="fill-login" data-role="admin" style="margin-top:8px">Use admin demo</button> <button type="button" class="button secondary small" data-action="fill-login" data-role="student" style="margin-top:8px">Use student demo</button></div>
      <p class="footer-note">Authentication is simulated. Demo credentials are visible in source and must never be reused for real accounts.</p></div></section></main>`;
  }
  function shellPage() {
    const user = data.currentUser;
    const allowed = navItems.filter((item) => item.roles.includes(user.role));
    const name = user.name || user.id;
    return `<div class="app-shell"><aside class="sidebar"><a class="brand" href="#" data-go="dashboard"><span class="brand-mark">A</span><span>Attendly <small style="display:block;color:var(--muted);font-size:9px;font-weight:500">SMART ATTENDANCE</small></span></a><div class="nav-label">${user.role === "admin" ? "Administration" : "Student portal"}</div><nav class="nav-list" aria-label="Main navigation">${allowed.map((item) => `<button class="nav-item ${page === item.id ? "active" : ""}" data-go="${item.id}"><span class="nav-icon" aria-hidden="true">${item.icon}</span>${esc(item.label)}</button>`).join("")}</nav><div class="sidebar-bottom"><button class="nav-item" data-action="logout"><span class="nav-icon" aria-hidden="true">↪</span>Sign out</button><div class="sidebar-note">Demo data is stored locally in this browser. Do not use real personal or password data.</div></div></aside>
      <div class="main-area"><header class="topbar"><div><h2 class="topbar-title">${esc(titles[page] || "Dashboard")}</h2><div class="topbar-date">${new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div></div><div class="user-chip"><div class="avatar" aria-hidden="true">${esc(name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase())}</div><div><strong>${esc(name)}</strong><small>${user.role === "admin" ? "Administrator" : "Student account"}</small></div><button class="button secondary small" data-action="logout">Sign out</button></div></header><main class="content">${renderPage()}</main></div></div>`;
  }
  function renderPage() {
    switch (page) {
      case "dashboard": return dashboardPage();
      case "profile": return profilePage();
      case "mark": return markPage();
      case "history": return historyPage();
      case "students": return studentsPage();
      case "records": return recordsPage();
      case "reports": return reportsPage();
      case "settings": return settingsPage();
      case "about": return aboutPage();
      default: page = "dashboard"; return dashboardPage();
    }
  }
  function render() {
    stopCamera();
    if (!data.currentUser) root.innerHTML = loginPage();
    else root.innerHTML = shellPage();
    if (page === "mark") refreshQrCode("studentQr", "studentQrStatus", $("#checkSubject")?.value);
    if (page === "settings") refreshQrCode("settingsQr", "settingsQrStatus", $("#settingsQrSubject")?.value);
  }
  function sessionPayload(subjectId) {
    const session = data.settings.sessions[subjectId];
    if (!session || !session.code || !session.expiresAt || Date.now() >= new Date(session.expiresAt).getTime()) return null;
    return {
      app: "attendly-demo",
      subjectId,
      code: session.code,
      expiresAt: session.expiresAt
    };
  }
  function refreshQrCode(containerId, statusId, subjectId) {
    const container = $(`#${containerId}`);
    const status = $(`#${statusId}`);
    if (!container || !status) return;
    container.replaceChildren();
    const payload = sessionPayload(subjectId);
    if (!payload) {
      status.textContent = "No active session for this subject. Configure a future expiry and session code in Verification settings.";
      return;
    }
    if (typeof window.QRCode !== "function") {
      status.textContent = "QR generator could not load. Use the visible manual session code instead.";
      return;
    }
    try {
      new window.QRCode(container, {
        text: JSON.stringify(payload),
        width: 176,
        height: 176,
        correctLevel: window.QRCode.CorrectLevel.M
      });
      status.textContent = `QR for ${Demo.Attendance.subjectFor(data, subjectId).name}. It contains the demo session code and expiry; it is not a secure token.`;
    } catch (error) {
      status.textContent = `QR generation failed: ${error.message}. Use the manual session code.`;
    }
  }
  function readFilters(prefix) {
    filters[prefix] = {
      query: $(`#${prefix}Query`)?.value || "",
      date: $(`#${prefix}Date`)?.value || "",
      subjectId: $(`#${prefix}Subject`)?.value || "",
      status: $(`#${prefix}Status`)?.value || ""
    };
    return filters[prefix];
  }
  function handleClick(event) {
    const nav = event.target.closest("[data-go]");
    if (nav) {
      const target = nav.dataset.go;
      const item = navItems.find((candidate) => candidate.id === target);
      if (item && item.roles.includes(data.currentUser.role)) {
        stopCamera();
        page = target;
        browserLocation = null;
        render();
      }
      return;
    }
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "fill-login") {
      $("#role").value = button.dataset.role;
      $("#identifier").value = button.dataset.role === "admin" ? "admin@demo.edu" : "STU001";
      $("#password").value = "demo123";
    } else if (action === "logout") {
      try { Demo.Auth.signOut(data); page = "dashboard"; render(); toast("Signed out of the demo."); }
      catch (error) { toast(error.message, true); }
    } else if (action === "location") {
      requestLocation();
    } else if (action === "scan-qr") {
      startQrScanner();
    } else if (action === "download-qr") {
      downloadQrCode(button.dataset.qrTarget);
    } else if (action === "face-camera") {
      startCameraDemo();
    } else if (action === "stop-camera") {
      stopCamera();
    } else if (action === "filter-history") {
      readFilters("history");
      $("#historyResults").innerHTML = attendanceTable(filteredRecords("history"), data.currentUser.role === "admin");
    } else if (action === "filter-records") {
      readFilters("records");
      page = "records"; render();
    } else if (action === "filter-reports") {
      readFilters("report");
      page = "reports"; render();
    } else if (action === "export") {
      const records = Demo.Attendance.filterRecords(data, readFilters("report"));
      Demo.Reports.exportRecords(data, records);
      toast(`Exported ${records.length} matching attendance records.`);
    } else if (action === "correct-record") {
      const recordId = button.dataset.recordId;
      const select = $(`[data-record-status="${CSS.escape(recordId)}"]`);
      const note = window.prompt("Enter an audit note explaining this correction:");
      if (note === null) return;
      try {
        Demo.Attendance.correctRecord(data, recordId, select.value, note, data.currentUser.id);
        toast("Attendance corrected and audit note recorded.");
        render();
      } catch (error) { toast(error.message, true); }
    } else if (action === "edit-student") {
      const student = Demo.Attendance.studentFor(data, button.dataset.studentId);
      if (!student) { toast("Student record was not found.", true); return; }
      const name = window.prompt("Student name:", student.name);
      if (name === null) return;
      const email = window.prompt("Student email:", student.email);
      if (email === null) return;
      const course = window.prompt("Course:", student.course);
      if (course === null) return;
      const year = window.prompt("Year:", student.year);
      if (year === null) return;
      const normalizedEmail = email.trim().toLowerCase();
      if (name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || !course.trim() || !year.trim()) {
        toast("Enter a valid name, email, course, and year.", true);
        return;
      }
      if (data.students.some((other) => other.id !== student.id && other.email.toLowerCase() === normalizedEmail)) {
        toast("Another student already uses that email address.", true);
        return;
      }
      student.name = name.trim();
      student.email = normalizedEmail;
      student.course = course.trim();
      student.year = year.trim();
      Demo.Storage.write(data);
      render();
      toast(`Student ${student.id} updated.`);
    } else if (action === "reset") {
      if (window.confirm("Reset all Attendly demo data in this browser? This cannot be undone.")) {
        try { data = Demo.Storage.reset(); page = "dashboard"; render(); toast("Demo data reset to the original samples."); }
        catch (error) { toast(error.message, true); }
      }
    }
  }
  function requestLocation() {
    if (!navigator.geolocation) {
      toast("This browser does not provide geolocation.", true);
      return;
    }
    const status = $("#locationResult");
    status.textContent = "Requesting browser location permission…";
    navigator.geolocation.getCurrentPosition((position) => {
      browserLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      status.textContent = "Location obtained from browser; check the consent box to use it.";
      toast("Browser location obtained for this demo check-in.");
    }, (error) => {
      browserLocation = null;
      const messages = {
        1: "Location permission was denied.",
        2: "The browser could not determine a location.",
        3: "The location request timed out."
      };
      status.textContent = messages[error.code] || "Location is unavailable.";
      toast(status.textContent, true);
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 });
  }
  async function startCamera(mode) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera access is not available in this browser. Use the manual session code instead.");
    }
    stopCamera();
    const requestId = cameraGeneration;
    const video = mode === "scan" ? $("#scannerCamera") : $("#studentCamera");
    const status = mode === "scan" ? $("#scannerStatus") : $("#cameraStatus");
    if (!video || !status) throw new Error("Camera preview is only available on the student check-in page.");
    status.textContent = "Requesting camera permission…";
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: mode === "scan" ? "environment" : "user" },
      audio: false
    });
    if (requestId !== cameraGeneration) {
      stream.getTracks().forEach((track) => track.stop());
      throw new Error("Camera request was canceled because the page changed.");
    }
    cameraStream = stream;
    cameraMode = mode;
    video.srcObject = cameraStream;
    video.hidden = false;
    const stopButton = $('[data-action="stop-camera"]');
    if (stopButton) stopButton.hidden = false;
    status.textContent = mode === "face-demo"
      ? "Camera preview is active. No face is identified, analyzed, or saved."
      : "Camera is ready. Point it at an Attendly class QR code.";
  }
  function stopCamera() {
    cameraGeneration += 1;
    if (cameraTimer !== null) {
      clearTimeout(cameraTimer);
      cameraTimer = null;
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      cameraStream = null;
    }
    scanner = null;
    scanCanvas = null;
    cameraMode = null;
    ["studentCamera", "scannerCamera"].forEach((id) => {
      const video = $(`#${id}`);
      if (video) {
        video.pause();
        video.srcObject = null;
        video.hidden = true;
      }
    });
    const status = $("#cameraStatus");
    if (status) status.textContent = "Camera is off. No image is recorded or saved.";
    const stopButton = $('[data-action="stop-camera"]');
    if (stopButton) stopButton.hidden = true;
    const scannerStatus = $("#scannerStatus");
    if (scannerStatus) scannerStatus.textContent = "Scanner is off. Camera access starts only when you choose Open QR scanner. You can enter the session code manually if needed.";
  }
  async function startCameraDemo() {
    try {
      await startCamera("face-demo");
      toast("Camera demo started. It previews video only and does not recognize faces.");
    } catch (error) {
      toast(error.message, true);
    }
  }
  async function startQrScanner() {
    if (typeof window.BarcodeDetector !== "function" && typeof window.jsQR !== "function") {
      toast("This browser does not support QR scanning. Enter the session code manually.", true);
      return;
    }
    try {
      const detector = typeof window.BarcodeDetector === "function"
        ? new window.BarcodeDetector({ formats: ["qr_code"] })
        : null;
      await startCamera("scan");
      scanner = detector || window.jsQR;
      scanCanvas = document.createElement("canvas");
      scanQrFrame();
      const status = $("#scannerStatus");
      if (status) status.textContent = "Scanner is active. Point your camera at the instructor's class QR code.";
    } catch (error) {
      stopCamera();
      toast(`Could not start QR scanning: ${error.message}. Enter the code manually.`, true);
    }
  }
  async function scanQrFrame() {
    if (!cameraStream || cameraMode !== "scan" || !scanner) return;
    const video = $("#scannerCamera");
    if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      try {
      if (typeof scanner.detect === "function") {
        const codes = await scanner.detect(video);
        if (codes.length && applyScannedSession(codes[0].rawValue)) return;
      } else {
        const context = scanCanvas.getContext("2d", { willReadFrequently: true });
        scanCanvas.width = video.videoWidth;
        scanCanvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, scanCanvas.width, scanCanvas.height);
        const pixels = context.getImageData(0, 0, scanCanvas.width, scanCanvas.height);
        const code = scanner(pixels.data, pixels.width, pixels.height, { inversionAttempts: "dontInvert" });
        if (code && applyScannedSession(code.data)) return;
      }
    } catch (error) {
      stopCamera();
      toast(`QR scan failed: ${error.message}. Enter the code manually.`, true);
      return;
    }
    }
    if (cameraStream && cameraMode === "scan") cameraTimer = setTimeout(scanQrFrame, 250);
  }
  function applyScannedSession(rawValue) {
    let payload;
    try {
      payload = JSON.parse(rawValue);
    } catch {
      toast("That QR code is not an Attendly class session.", true);
      stopCamera();
      return false;
    }
    const currentSession = payload && data.settings.sessions[payload.subjectId];
    if (!payload || payload.app !== "attendly-demo" || !currentSession ||
        payload.code !== currentSession.code || payload.expiresAt !== currentSession.expiresAt ||
        Date.now() >= new Date(payload.expiresAt).getTime()) {
      toast("QR session is invalid, changed, or expired.", true);
      stopCamera();
      return false;
    }
    $("#checkSubject").value = payload.subjectId;
    $("#sessionCode").value = payload.code;
    refreshQrCode("studentQr", "studentQrStatus", payload.subjectId);
    stopCamera();
    toast("Class QR scanned. Confirm the subject and submit attendance.");
    return true;
  }
  function downloadQrCode(containerId) {
    const container = $(`#${containerId}`);
    const canvas = container && $("canvas", container);
    const image = container && $("img", container);
    const dataUrl = canvas ? canvas.toDataURL("image/png") : image && image.src;
    if (!dataUrl) {
      toast("No QR code is available to download. Check the session expiry or QR generator.", true);
      return;
    }
    const subjectId = containerId === "studentQr" ? $("#checkSubject")?.value : $("#settingsQrSubject")?.value;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `attendly-${subjectId || "session"}-${today()}.png`;
    document.body.append(link);
    link.click();
    link.remove();
    toast("Session QR downloaded as a PNG.");
  }
  function handleSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const fields = new FormData(form);
    try {
      const formId = form.getAttribute("id");
      if (formId === "loginForm") {
        const user = Demo.Auth.signIn(data, fields.get("role"), fields.get("identifier"), fields.get("password"));
        page = "dashboard";
        render();
        toast(`Signed in as ${user.role}. This is a simulated demo session.`);
      } else if (formId === "checkinForm") {
        const locationAllowed = $("#useLocation").checked;
        if (locationAllowed && !browserLocation) throw new Error("Request location first or uncheck the optional location box.");
        const record = Demo.Attendance.checkIn(data, {
          studentId: data.currentUser.id,
          subjectId: fields.get("subjectId"),
          code: fields.get("code"),
          location: locationAllowed ? browserLocation : null,
          faceConsent: false
        });
        browserLocation = null;
        render();
        toast(`Attendance recorded for ${record.subjectId} at ${record.time}.`);
      } else if (formId === "studentForm") {
        const id = String(fields.get("id")).trim().toUpperCase();
        const name = String(fields.get("name")).trim();
        const email = String(fields.get("email")).trim();
        if (data.students.some((student) => student.id.toLowerCase() === id.toLowerCase() || student.email.toLowerCase() === email.toLowerCase())) {
          throw new Error("A student with that ID or email already exists.");
        }
        data.students.push({
          id, name, email, course: String(fields.get("course")).trim(), year: String(fields.get("year"))
        });
        Demo.Storage.write(data);
        render();
        toast(`Sample student ${id} added.`);
      } else if (formId === "settingsForm") {
        const threshold = Number(fields.get("threshold"));
        const radius = Number(fields.get("radiusMeters"));
        const latitude = Number(fields.get("collegeLatitude"));
        const longitude = Number(fields.get("collegeLongitude"));
        if (!Number.isInteger(threshold) || threshold < 1 || threshold > 100) throw new Error("Threshold must be a whole number from 1 to 100.");
        if (!Number.isInteger(radius) || radius < 25 || radius > 50000) throw new Error("Radius must be a whole number from 25 to 50,000 meters.");
        if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error("Enter valid latitude and longitude coordinates.");
        data.settings.threshold = threshold;
        data.settings.radiusMeters = radius;
        data.settings.collegeLatitude = latitude;
        data.settings.collegeLongitude = longitude;
        data.settings.requireLocation = $("#requireLocation").checked;
        Demo.Storage.write(data);
        render();
        toast("Verification settings saved.");
      } else if (formId === "sessionsForm") {
        data.subjects.forEach((subject) => {
          const code = String(fields.get(`code-${subject.id}`)).trim().toUpperCase();
          const expiry = new Date(String(fields.get(`expiry-${subject.id}`)));
          if (!code || Number.isNaN(expiry.getTime())) throw new Error(`Provide a valid code and expiry for ${subject.name}.`);
          data.settings.sessions[subject.id] = { code, expiresAt: expiry.toISOString() };
        });
        Demo.Storage.write(data);
        render();
        toast("Session codes and expiry times saved.");
      }
    } catch (error) {
      if (error instanceof Error) toast(error.message, true);
      else throw error;
    }
  }
  function handleInput(event) {
    if (event.target.id === "studentSearch") {
      const query = event.target.value.trim().toLowerCase();
      const rows = data.students.filter((student) => `${student.name} ${student.id} ${student.email}`.toLowerCase().includes(query));
      $("#studentRows").innerHTML = rows.map((student) => {
        const summary = Demo.Attendance.studentSummary(data, student.id);
        return `<tr><td><strong>${esc(student.name)}</strong></td><td>${esc(student.id)}</td><td>${esc(student.email)}</td><td>${esc(student.course)} · ${esc(student.year)}</td><td><span class="badge ${summary.percentage < Number(data.settings.threshold) ? "late" : ""}">${summary.percentage}%</span></td><td><button class="button secondary small" data-action="edit-student" data-student-id="${esc(student.id)}">Edit</button></td></tr>`;
      }).join("") || '<tr><td colspan="6" class="empty-state">No students found.</td></tr>';
    }
  }
  function handleChange(event) {
    if (event.target.id === "checkSubject") {
      refreshQrCode("studentQr", "studentQrStatus", event.target.value);
    } else if (event.target.id === "settingsQrSubject") {
      refreshQrCode("settingsQr", "settingsQrStatus", event.target.value);
    }
  }
  root.addEventListener("click", handleClick);
  root.addEventListener("submit", handleSubmit);
  root.addEventListener("input", handleInput);
  root.addEventListener("change", handleChange);
  try {
    data = Demo.Storage.read();
    if (data.currentUser && !((data.currentUser.role === "admin") || data.students.some((student) => student.id === data.currentUser.id))) {
      data.currentUser = null;
      Demo.Storage.write(data);
    }
    render();
  } catch (error) {
    root.innerHTML = `<main class="login-wrap"><section class="login-aside"><div><div class="brand"><span class="brand-mark">A</span>Attendly</div><h1>Attendance demo</h1></div></section><section class="login-main"><div class="login-card"><h2>Could not load demo data</h2><div class="notice danger-note">${esc(error.message)}</div><p class="footer-note">If saved data is malformed, clear this site's local storage in browser settings, then reload. No data was silently replaced.</p></div></section></main>`;
  }
})();
