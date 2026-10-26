package edu.demo.attendance.service;

import edu.demo.attendance.model.AttendanceRecord;
import edu.demo.attendance.model.AttendanceRecord.Status;
import edu.demo.attendance.model.Student;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

public final class AttendanceService {
    private final List<AttendanceRecord> records = new ArrayList<>();

    public synchronized AttendanceRecord markAttendance(Student student, String subjectId,
            String sessionId, String suppliedCode, VerificationRule verifier)
            throws AttendanceException {
        if (student == null || isBlank(subjectId) || isBlank(sessionId) || verifier == null) {
            throw new AttendanceException("Student, subject, session, and verifier are required.");
        }
        if (!verifier.isValid(suppliedCode)) {
            throw new AttendanceException("Session verification failed or has expired.");
        }
        boolean duplicate = records.stream().anyMatch(record ->
                record.getStudentId().equals(student.getId())
                        && record.getSubjectId().equalsIgnoreCase(subjectId.trim())
                        && record.getSessionId().equals(sessionId.trim()));
        if (duplicate) throw new AttendanceException("Attendance already exists for this session.");

        AttendanceRecord record = new AttendanceRecord(student.getId(), subjectId, sessionId,
                LocalDate.now(), LocalTime.now(), Status.PRESENT, verifier.description());
        records.add(record);
        return record;
    }

    public synchronized List<AttendanceRecord> findByStudent(String studentId) {
        String normalized = studentId.toLowerCase(Locale.ROOT);
        return records.stream().filter(record ->
                record.getStudentId().toLowerCase(Locale.ROOT).equals(normalized))
                .collect(Collectors.toList());
    }

    public synchronized List<AttendanceRecord> snapshot() {
        return new ArrayList<>(records);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
