package edu.demo.attendance.app;

import edu.demo.attendance.model.Admin;
import edu.demo.attendance.model.AttendanceRecord;
import edu.demo.attendance.model.Student;
import edu.demo.attendance.model.User;
import edu.demo.attendance.service.AttendanceException;
import edu.demo.attendance.service.AttendanceService;
import edu.demo.attendance.service.ConcurrentAttendanceProcessor;
import edu.demo.attendance.service.QRCodeVerifier;
import edu.demo.attendance.service.ReportService;
import edu.demo.attendance.storage.FileStorageService;

import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class AttendanceManager {
    private AttendanceManager() { }

    public static <T> List<T> firstItems(List<T> items, int limit) {
        if (limit < 0) throw new IllegalArgumentException("Limit cannot be negative.");
        List<T> result = new ArrayList<>();
        for (T item : items) {
            if (result.size() == limit) break;
            result.add(item);
        }
        return result;
    }

    public static void main(String[] args) throws Exception {
        Student[] studentArray = {
                new Student("STU001", "Aarav Mehta", "aarav@demo.edu", "B.Tech IT", 1),
                new Student("STU002", "Diya Sharma", "diya@demo.edu", "B.Tech IT", 1)
        };
        Admin admin = new Admin("ADMIN", "Demo Administrator", "admin@demo.edu", "IT");
        List<User> users = new ArrayList<>(Arrays.asList(studentArray));
        users.add(admin);
        for (User user : users) System.out.println(user.getName() + " — " + user.getRoleDescription());

        AttendanceService attendanceService = new AttendanceService();
        Map<String, String> sessionCodes = new HashMap<>();
        sessionCodes.put("JAVA101", "JAVA75");
        QRCodeVerifier verifier = new QRCodeVerifier(sessionCodes.get("JAVA101"),
                Instant.now().plusSeconds(3600));
        try {
            attendanceService.markAttendance(studentArray[0], "JAVA101", "JAVA101-TODAY",
                    "JAVA75", verifier);
        } catch (AttendanceException exception) {
            System.err.println("Attendance was not recorded: " + exception.getMessage());
        }

        List<AttendanceRecord> records = attendanceService.snapshot();
        ReportService reportService = new ReportService();
        System.out.printf("Aarav attendance: %.1f%%%n",
                reportService.attendancePercentage(records, studentArray[0].getId()));
        System.out.println("First record count: " + firstItems(records, 1).size());

        try {
            List<Integer> counts = new ConcurrentAttendanceProcessor().countBySubject(records);
            System.out.println("Concurrent subject counts: " + counts);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw exception;
        }

        if (!records.isEmpty()) {
            FileStorageService storage = new FileStorageService();
            storage.writeCsv(Paths.get("attendance-demo.csv"), records);
            System.out.println("Wrote " + storage.readLines(Paths.get("attendance-demo.csv")).size()
                    + " CSV lines to attendance-demo.csv");
        }
    }
}
