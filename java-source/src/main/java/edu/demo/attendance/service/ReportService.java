package edu.demo.attendance.service;

import edu.demo.attendance.model.AttendanceRecord;
import edu.demo.attendance.model.AttendanceRecord.Status;

import java.util.List;

public final class ReportService {
    public double attendancePercentage(List<AttendanceRecord> records, String studentId) {
        int total = 0;
        int attended = 0;
        for (AttendanceRecord record : records) {
            if (!record.getStudentId().equals(studentId) || record.getStatus() == Status.REJECTED) continue;
            total++;
            if (record.getStatus() == Status.PRESENT || record.getStatus() == Status.LATE) attended++;
        }
        return total == 0 ? 0.0 : attended * 100.0 / total;
    }
}
