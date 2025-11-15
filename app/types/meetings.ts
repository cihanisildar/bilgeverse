import { MeetingStatus, CheckInMethod, DecisionStatus } from '@prisma/client';

export type MeetingWithRelations = {
  id: string;
  title: string;
  description: string | null;
  meetingDate: Date;
  location: string;
  status: MeetingStatus;
  qrCodeToken: string | null;
  qrCodeExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  };
  _count?: {
    attendees: number;
    decisions: number;
  };
};

export type AttendanceWithUser = {
  id: string;
  checkInMethod: CheckInMethod;
  checkInTime: Date;
  user: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  };
};

export type DecisionWithUser = {
  id: string;
  title: string;
  description: string | null;
  targetDate: Date | null;
  status: DecisionStatus;
  createdAt: Date;
  updatedAt: Date;
  responsibleUsers: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  }[];
};

