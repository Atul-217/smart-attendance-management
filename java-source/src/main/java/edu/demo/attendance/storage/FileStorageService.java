package edu.demo.attendance.storage;

import edu.demo.attendance.model.AttendanceRecord;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Collectors;

public final class FileStorageService {
    public void writeCsv(Path destination, List<AttendanceRecord> records) throws IOException {
        List<String> lines = records.stream().map(record -> String.join(",",
                quote(record.getStudentId()), quote(record.getSubjectId()),
                quote(record.getSessionId()), quote(record.getDate().toString()),
                quote(record.getTime().toString()), quote(record.getStatus().name()),
                quote(record.getVerification()))).collect(Collectors.toList());
        lines.add(0, "studentId,subjectId,sessionId,date,time,status,verification");
        Path parent = destination.toAbsolutePath().getParent();
        if (parent != null) Files.createDirectories(parent);
        Files.write(destination, lines, StandardCharsets.UTF_8);
    }

    public List<String> readLines(Path source) throws IOException {
        return Files.readAllLines(source, StandardCharsets.UTF_8);
    }

    private String quote(String value) {
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
