package edu.demo.attendance.service;

public final class LocationVerifier {
    private static final double EARTH_RADIUS_METERS = 6_371_000;

    public boolean isWithinRadius(double latitude, double longitude, double campusLatitude,
                                  double campusLongitude, double radiusMeters) {
        if (!Double.isFinite(latitude) || !Double.isFinite(longitude)
                || !Double.isFinite(campusLatitude) || !Double.isFinite(campusLongitude)
                || !Double.isFinite(radiusMeters) || latitude < -90 || latitude > 90
                || campusLatitude < -90 || campusLatitude > 90
                || longitude < -180 || longitude > 180 || campusLongitude < -180
                || campusLongitude > 180 || radiusMeters <= 0) {
            throw new IllegalArgumentException("Coordinates or radius are outside the valid range.");
        }
        return distance(latitude, longitude, campusLatitude, campusLongitude) <= radiusMeters;
    }

    private double distance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
