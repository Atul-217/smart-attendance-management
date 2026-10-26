package edu.demo.attendance.service;

public interface VerificationRule {
    boolean isValid(String suppliedValue);
    String description();
}
