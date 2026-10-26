package edu.demo.attendance.service;

import java.time.Instant;
import java.util.Locale;

public final class QRCodeVerifier implements VerificationRule {
    private final String sessionCode;
    private final Instant expiresAt;

    public QRCodeVerifier(String sessionCode, Instant expiresAt) {
        if (sessionCode == null || sessionCode.trim().isEmpty() || expiresAt == null) {
            throw new IllegalArgumentException("A session code and expiry are required.");
        }
        this.sessionCode = sessionCode.trim().toUpperCase(Locale.ROOT);
        this.expiresAt = expiresAt;
    }

    @Override
    public boolean isValid(String suppliedValue) {
        return suppliedValue != null
                && Instant.now().isBefore(expiresAt)
                && sessionCode.equals(suppliedValue.trim().toUpperCase(Locale.ROOT));
    }

    @Override
    public String description() {
        return "Manual demo session-code verification; not a production QR token.";
    }
}
