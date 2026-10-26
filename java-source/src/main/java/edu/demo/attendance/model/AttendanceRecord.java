package edu.demo.attendance.model;

import java.time.LocalDate;
import java.time.LocalTime;

public final class AttendanceRecord {
    public enum Status { PRESENT, ABSENT, LATE, REJECTED }

    private final String studentId;
    private final String subjectId;
    private final String sessionId;
    private final LocalDate date;
    private final LocalTime time;
    private Status status;
    private String verification;

    public AttendanceRecord(String studentId, String subjectId, String sessionId,
                            LocalDate date, LocalTime time, Status status, String verification) {
        if (isBlank(studentId) || isBlank(subjectId) || isBlank(sessionId) ||
                date == null || time == null || status == null) {
            throw new IllegalArgumentException("Attendance fields are required.");
        }
        this.studentId = studentId.trim();
        this.subjectId = subjectId.trim();
        this.sessionId = sessionId.trim();
        this.date = date;
        this.time = time;
        this.status = status;
        this.verification = verification == null ? "" : verification.trim();
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    public String getStudentId() { return studentId; }
    public String getSubjectId() { return subjectId; }
    public String getSessionId() { return sessionId; }
    public LocalDate getDate() { return date; }
    public LocalTime getTime() { return time; }
    public Status getStatus() { return status; }
    public String getVerification() { return verification; }

    public void correctStatus(Status status, String verificationNote) {
        if (status == null || isBlank(verificationNote)) {
            throw new IllegalArgumentException("A status and correction note are required.");
        }
        this.status = status;
        this.verification = verificationNote.trim();
    }
}
