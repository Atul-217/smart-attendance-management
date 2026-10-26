package edu.demo.attendance.model;

public final class Admin extends User {
    private final String department;

    public Admin(String id, String name, String email, String department) {
        super(id, name, email);
        this.department = department == null ? "Administration" : department.trim();
    }

    public String getDepartment() { return department; }

    @Override
    public String getRoleDescription() {
        return "Administrator · " + department;
    }
}
