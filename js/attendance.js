(() => {
  "use strict";
  const { localDate } = window.AttendanceDemo.Storage;
  const VALID_STATUSES = ["present", "absent", "late", "rejected"];
  function studentFor(data, id) {
    return data.students.find((student) => student.id === id);
  }
  function subjectFor(data, id) {
    return data.subjects.find((subject) => subject.id === id);
  }
  function isAttended(status) {
    return status === "present" || status === "late";
  }
  function percentage(records) {
    const counted = records.filter((record) => record.status !== "rejected");
    if (!counted.length) return 0;
    return Math.round(counted.filter((record) => isAttended(record.status)).length / counted.length * 100);
  }
  function studentSummary(data, studentId, subjectId = "") {
    const records = data.records.filter((record) => record.studentId === studentId &&
      (!subjectId || record.subjectId === subjectId) && record.status !== "rejected");
    return {
      attended: records.filter((record) => isAttended(record.status)).length,
      total: records.length,
      percentage: percentage(records)
    };
  }
  function todaySummary(data) {
    const today = localDate();
    const todays = data.records.filter((record) => record.date === today && record.status !== "rejected");
    const presentIds = new Set(todays.filter((record) => isAttended(record.status)).map((record) => record.studentId));
    return {
      present: presentIds.size,
      absent: Math.max(data.students.length - presentIds.size, 0),
      attendance: todays.length ? Math.round(todays.filter((record) => isAttended(record.status)).length / todays.length * 100) : 0
    };
  }
  function checkIn(data, payload) {
    const student = studentFor(data, payload.studentId);
    const subject = subjectFor(data, payload.subjectId);
    if (!student || !subject) throw new Error("Choose a valid student and subject.");
    const session = data.settings.sessions[payload.subjectId];
    if (!session || !session.code || !session.expiresAt || Date.now() > new Date(session.expiresAt).getTime()) {
      recordAttempt(data, payload, "rejected", "Attendance session is expired or not configured.");
      throw new Error("This attendance session is expired or unavailable. Contact the admin.");
    }
    if (payload.code.trim().toUpperCase() !== session.code.toUpperCase()) {
      recordAttempt(data, payload, "rejected", "The entered session code did not match.");
      throw new Error("Session code is incorrect. The rejected attempt was recorded for admin review.");
    }
    const today = localDate();
    if (data.records.some((record) => record.studentId === student.id && record.subjectId === subject.id &&
      record.date === today && record.sessionId === `session-${today}-${subject.id}`)) {
      recordAttempt(data, payload, "rejected", "Duplicate attendance attempt for this class session.");
      throw new Error("Attendance is already recorded for this class today. Duplicate attempt logged.");
    }
    if (data.settings.requireLocation && !payload.location) {
      recordAttempt(data, payload, "rejected", "Required location check was not completed.");
      throw new Error("Location verification is required by the admin. The attempt was logged.");
    }
    let verification = "Session code (demo)";
    if (payload.location) {
      const distance = distanceMeters(payload.location.latitude, payload.location.longitude,
        Number(data.settings.collegeLatitude), Number(data.settings.collegeLongitude));
      if (distance > Number(data.settings.radiusMeters)) {
        recordAttempt(data, payload, "rejected", `Outside configured radius (${Math.round(distance)} m).`);
        throw new Error("Location is outside the configured campus radius. Attempt recorded for review.");
      }
      verification += `; browser location (${Math.round(distance)} m, demo only)`;
    }
    if (payload.faceConsent) verification += "; simulated face demo";
    const record = {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      studentId: student.id,
      subjectId: subject.id,
      date: today,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "present",
      verification,
      note: "",
      sessionId: `session-${today}-${subject.id}`,
      createdAt: new Date().toISOString()
    };
    data.records.unshift(record);
    window.AttendanceDemo.Storage.write(data);
    return record;
  }
  function recordAttempt(data, payload, status, reason) {
    data.attempts.unshift({
      id: `attempt-${Date.now()}`,
      studentId: payload.studentId,
      subjectId: payload.subjectId,
      date: localDate(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status,
      reason
    });
    data.attempts = data.attempts.slice(0, 150);
    window.AttendanceDemo.Storage.write(data);
  }
  function correctRecord(data, recordId, status, note, adminId) {
    if (!VALID_STATUSES.includes(status)) throw new Error("Choose a valid attendance status.");
    if (!note.trim()) throw new Error("Enter an audit note explaining the correction.");
    const record = data.records.find((item) => item.id === recordId);
    if (!record) throw new Error("Attendance record was not found.");
    const oldStatus = record.status;
    record.status = status;
    record.note = note.trim();
    data.audit.unshift({
      id: `audit-${Date.now()}`,
      recordId,
      adminId,
      studentId: record.studentId,
      subjectId: record.subjectId,
      date: record.date,
      oldStatus,
      newStatus: status,
      note: note.trim(),
      createdAt: new Date().toISOString()
    });
    window.AttendanceDemo.Storage.write(data);
  }
  function distanceMeters(lat1, lon1, lat2, lon2) {
    const rad = (value) => value * Math.PI / 180;
    const dLat = rad(lat2 - lat1);
    const dLon = rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function filterRecords(data, filters = {}) {
    return data.records.filter((record) => {
      const student = studentFor(data, record.studentId);
      const subject = subjectFor(data, record.subjectId);
      const query = (filters.query || "").trim().toLowerCase();
      if (query && !`${record.studentId} ${student ? student.name : ""} ${subject ? subject.name : ""}`.toLowerCase().includes(query)) return false;
      if (filters.status && record.status !== filters.status) return false;
      if (filters.subjectId && record.subjectId !== filters.subjectId) return false;
      if (filters.date && record.date !== filters.date) return false;
      return true;
    }).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }
  window.AttendanceDemo.Attendance = {
    studentFor, subjectFor, percentage, studentSummary, todaySummary,
    checkIn, correctRecord, filterRecords, isAttended
  };
})();
