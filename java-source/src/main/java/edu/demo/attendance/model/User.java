package edu.demo.attendance.model;

public abstract class User {
    private final String id;
    private String name;
    private final String email;

    protected User(String id, String name, String email) {
        if (id == null || id.trim().isEmpty() || name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("User ID and name are required.");
        }
        this.id = id.trim();
        this.name = name.trim();
        this.email = email == null ? "" : email.trim();
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) {
        if (name == null || name.trim().isEmpty()) throw new IllegalArgumentException("Name cannot be blank.");
        this.name = name.trim();
    }
    public String getEmail() { return email; }
    public abstract String getRoleDescription();
}
