(() => {
  "use strict";
  function csvCell(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }
  function exportRecords(data, records) {
    const headings = ["Student ID", "Student name", "Date", "Time", "Subject", "Status", "Verification", "Admin note"];
    const lines = [headings.map(csvCell).join(",")];
    records.forEach((record) => {
      const student = data.students.find((item) => item.id === record.studentId);
      const subject = data.subjects.find((item) => item.id === record.subjectId);
      lines.push([
        record.studentId, student ? student.name : "Unknown student", record.date, record.time,
        subject ? subject.name : "Unknown subject", record.status, record.verification, record.note
      ].map(csvCell).join(","));
    });
    const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
  window.AttendanceDemo.Reports = { exportRecords };
})();
