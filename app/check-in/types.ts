/**
 * Check-in related type definitions
 * Shared across all check-in pages
 */

export type CheckInType = 'meeting' | 'attendance' | 'event';

export interface Attendance {
    studentId?: string;
    userId?: string;
}

export interface Resource {
    id: string;
    title?: string;
    name?: string;
    qrCodeToken?: string | null;
    qrCodeExpiresAt?: string | null;
    attendances?: Attendance[];
}
