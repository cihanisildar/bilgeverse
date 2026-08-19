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
    /** Kullanıcının bağlı olduğu kurum (tenant). */
    organizationId: string;
    organizationCode: string;
    organizationName: string;
    /** Sistem sahibi. Kurum verisine erişmez, yalnız /superadmin panelini kullanır. */
    isSuperAdmin: boolean;
    /** Kurumun paketlerinden gelen açık modül (part) id'leri. */
    orgParts: number[];
    /** Kullanıcıya tek tek verilen ek modül izinleri (User.allowedParts). */
    allowedParts: number[];
    /** Şifrenin en son değiştiği an (epoch ms, hiç değişmediyse 0). */
    passwordChangedAt?: number;
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
    organizationId?: string;
    organizationCode?: string;
    organizationName?: string;
    isSuperAdmin?: boolean;
    orgParts?: number[];
    allowedParts?: number[];
    /** Kurum yetkilerinin en son ne zaman DB'den tazelendiği (epoch ms). */
    entitlementsCheckedAt?: number;
    /**
     * Oturum açılırken DB'de yazan `User.passwordChangedAt` (epoch ms).
     * Tazeleme turunda güncel değerle karşılaştırılır; DB'deki daha yeniyse
     * şifre bu oturumdan sonra değişmiş demektir ve token düşürülür.
     */
    passwordChangedAt?: number;
  }
}
