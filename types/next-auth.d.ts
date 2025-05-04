import { UserRole } from '@prisma/client';
import NextAuth from 'next-auth';

type TutorInfo = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

declare module 'next-auth' {
  interface User {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    tutorId?: string | null;
    tutor?: TutorInfo;
  }

  interface Session {
    user: User & {
      id: string;
    };
  }
}
