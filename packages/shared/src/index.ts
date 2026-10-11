// Shared schemas and types

export const PUNCH_TYPES = ['IN', 'OUT', 'BREAK_START', 'BREAK_END'] as const;
export type PunchType = typeof PUNCH_TYPES[number];

export const ROLES = ['super_admin', 'admin', 'supervisor', 'auditor', 'employee'] as const;
export type Role = typeof ROLES[number];
