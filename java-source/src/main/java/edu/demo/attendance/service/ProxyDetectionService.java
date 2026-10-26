package edu.demo.attendance.service;

import java.util.Arrays;
import java.util.List;

public final class ProxyDetectionService {
    private final List<VerificationRule> rules;

    public ProxyDetectionService(VerificationRule... rules) {
        this.rules = Arrays.asList(rules);
    }

    public boolean passesAll(String suppliedValue) {
        return rules.stream().allMatch(rule -> rule.isValid(suppliedValue));
    }

    public String getRuleSummary() {
        return rules.stream().map(VerificationRule::description)
                .reduce((first, second) -> first + " " + second).orElse("No rules configured.");
    }
}
