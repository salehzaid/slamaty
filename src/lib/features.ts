// Feature flags configuration
// This file centralizes all feature flags for the application.

export const features = {
    // Corrective Action Plans (CAPA)
    // Set to true to enable CAPA features, false to hide them.
    // Default: false (Hidden as per requirements)
    capa: false,
};

export const isCapaEnabled = () => features.capa;
