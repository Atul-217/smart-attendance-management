package edu.demo.attendance.service;

import edu.demo.attendance.model.AttendanceRecord;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.stream.Collectors;

public final class ConcurrentAttendanceProcessor {
    public List<Integer> countBySubject(List<AttendanceRecord> records) throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(3);
        try {
            List<Callable<Integer>> tasks = new ArrayList<>();
            List<String> subjectIds = records.stream().map(AttendanceRecord::getSubjectId)
                    .distinct().collect(Collectors.toList());
            for (String value : subjectIds) {
                final String subjectId = value;
                tasks.add(() -> (int) records.stream()
                        .filter(record -> subjectId.equals(record.getSubjectId())).count());
            }
            List<Future<Integer>> results = executor.invokeAll(tasks);
            List<Integer> counts = new ArrayList<>();
            for (Future<Integer> result : results) counts.add(result.get());
            return counts;
        } finally {
            executor.shutdown();
        }
    }
}
