/**
 * Demo fixtures and simulated venue activity must be explicitly opted into.
 * Production builds default to authoritative provider/database data only.
 */
export const isDemoMode = import.meta.env.VITE_ENABLE_DEMO_DATA === 'true';
