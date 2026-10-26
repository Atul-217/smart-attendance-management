(() => {
  "use strict";
  const KEY = "attendly.demo.v1";
  const subjects = [
    { id: "JAVA101", name: "Java Programming", code: "JAVA101" },
    { id: "DSA102", name: "Data Structures", code: "DSA102" },
    { id: "MATH103", name: "Discrete Mathematics", code: "MATH103" }
  ];

  function localDate(date = new Date()) {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
  }
  function makeSeed() {
    const students = [
      { id: "STU001", name: "Aarav Mehta", email: "aarav@demo.edu", course: "B.Tech IT", year: "1st Year" },
      { id: "STU002", name: "Diya Sharma", email: "diya@demo.edu", course: "B.Tech IT", year: "1st Year" },
      { id: "STU003", name: "Kabir Patel", email: "kabir@demo.edu", course: "B.Tech IT", year: "1st Year" },
      { id: "STU004", name: "Sara Khan", email: "sara@demo.edu", course: "B.Tech IT", year: "1st Year" }
    ];
    const records = [];
    const today = new Date();
    const subjectIds = subjects.map((subject) => subject.id);
    for (let daysAgo = 18; daysAgo >= 0; daysAgo -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - daysAgo);
      if (date.getDay() === 0) continue;
      for (let studentIndex = 0; studentIndex < students.length; studentIndex += 1) {
        for (let subjectIndex = 0; subjectIndex < subjectIds.length; subjectIndex += 1) {
          const isToday = daysAgo === 0;
          if (isToday && !(studentIndex === 0 && subjectIndex === 0)) continue;
          let status = ((studentIndex * 5 + daysAgo + subjectIndex) % 10 < 8) ? "present" : "absent";
          if (studentIndex === 1 && (daysAgo + subjectIndex) % 3 === 0) status = "absent";
          if (studentIndex === 2 && (daysAgo + subjectIndex) % 5 === 0) status = "late";
          if (isToday) status = studentIndex === 3 && subjectIndex === 2 ? "absent" : "present";
          records.push({
            id: `seed-${studentIndex}-${daysAgo}-${subjectIndex}`,
            studentId: students[studentIndex].id,
            subjectId: subjectIds[subjectIndex],
            date: localDate(date),
            time: isToday ? "09:00" : "09:05",
            status,
            verification: "Sample record",
            note: "",
            sessionId: `session-${localDate(date)}-${subjectIds[subjectIndex]}`,
            createdAt: date.toISOString()
          });
        }
      }
    }
    const endToday = new Date();
    endToday.setHours(23, 59, 59, 999);
    return {
      students,
      subjects,
      records,
      audit: [],
      currentUser: null,
      settings: {
        threshold: 75,
        collegeLatitude: 19.076,
        collegeLongitude: 72.8777,
        radiusMeters: 500,
        requireLocation: false,
        sessions: subjects.reduce((map, subject, index) => {
          map[subject.id] = { code: ["JAVA75", "DATA82", "MATH90"][index], expiresAt: endToday.toISOString() };
          return map;
        }, {})
      },
      attempts: []
    };
  }
  function read() {
    let saved;
    try {
      saved = localStorage.getItem(KEY);
      if (saved === null) {
        const initial = makeSeed();
        write(initial);
        return initial;
      }
      const data = JSON.parse(saved);
      if (!data || !Array.isArray(data.students) || !Array.isArray(data.records) || !data.settings) {
        throw new Error("Saved demo data has an invalid format. Use Reset demo data after signing in as admin.");
      }
      data.subjects = Array.isArray(data.subjects) ? data.subjects : subjects;
      data.audit = Array.isArray(data.audit) ? data.audit : [];
      data.attempts = Array.isArray(data.attempts) ? data.attempts : [];
      data.settings.sessions = data.settings.sessions || {};
      return data;
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error("Saved demo data could not be read. Clear this site's storage to start a fresh demo.");
      throw error;
    }
  }
  function write(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (error) {
      throw new Error(`Demo data could not be saved in this browser: ${error.message}`);
    }
  }
  function reset() {
    const fresh = makeSeed();
    write(fresh);
    return fresh;
  }
  window.AttendanceDemo = window.AttendanceDemo || {};
  window.AttendanceDemo.Storage = { read, write, reset, localDate };
})();
