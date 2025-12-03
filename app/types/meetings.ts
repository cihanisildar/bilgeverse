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
  attended: boolean | null;
  markedBy: string | null;
  markedAt: Date | null;
  user: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    boardMemberTitle: string | null;
  };
};

export type DecisionWithUser = {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: DecisionStatus;
  meetingId: string;
  createdAt: string;
  updatedAt: string;
  responsibleUsers: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  }[];
};

export type BoardMemberUser = {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  boardMemberTitle: string;
  isActive: boolean;
};

