import { UserRole } from '@prisma/client';
import NextAuth from 'next-auth';

export type TutorInfo = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

declare module 'next-auth' {
  interface User {
    id: string;
    username: string;
    role: UserRole;
    roles: UserRole[];
    isInAcademy: boolean;
    isAdmin: boolean;
    isBoardMember: boolean;
    tutorId?: string | null;
    assistedTutorId?: string | null;
    tutor?: TutorInfo;
  }

  interface Session {
    user: User & {
      id: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username: string;
    role: UserRole;
    roles: UserRole[];
    isAdmin: boolean;
    isBoardMember: boolean;
    isInAcademy: boolean;
    tutorId?: string | null;
    tutor?: TutorInfo;
  }
}
