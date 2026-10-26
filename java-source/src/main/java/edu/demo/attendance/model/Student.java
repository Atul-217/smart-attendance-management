package edu.demo.attendance.model;

public final class Student extends User {
    private final String course;
    private final int year;

    public Student(String id, String name, String email, String course, int year) {
        super(id, name, email);
        if (course == null || course.trim().isEmpty() || year < 1) {
            throw new IllegalArgumentException("Course and a positive year are required.");
        }
        this.course = course.trim();
        this.year = year;
    }

    public String getCourse() { return course; }
    public int getYear() { return year; }

    @Override
    public String getRoleDescription() {
        return "Student · " + course + " · Year " + year;
    }
}
