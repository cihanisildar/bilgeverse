import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { TutorInfo } from "@/types/next-auth";
import { USER_AUTH_SELECT, normalizeUserRoles, isUserInAcademy } from "@/app/lib/auth-helpers";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          console.log('NextAuth authorize called with username:', credentials?.username);

          if (!credentials?.username || !credentials?.password) {
            console.error('Missing credentials');
            throw new Error("Missing credentials");
          }

          const user = await prisma.user.findUnique({
            where: { username: credentials.username.toLowerCase() },
            select: USER_AUTH_SELECT
          });

          if (!user) {
            console.error('User not found:', credentials.username);
            throw new Error("Invalid username or password");
          }

          console.log('User found, checking password...');
          const isValidPassword = await bcrypt.compare(credentials.password, user.password);

          if (!isValidPassword) {
            console.error('Invalid password for user:', credentials.username);
            throw new Error("Invalid username or password");
          }

          console.log('Login successful for user:', user.username);
          return {
            id: user.id,
            username: user.username,
            role: user.role,
            roles: normalizeUserRoles(user),
            isInAcademy: isUserInAcademy(user),
            isBoardMember: user.role === UserRole.BOARD_MEMBER || !!user.boardMember?.isActive,
            isAdmin: user.role === UserRole.ADMIN,
            tutorId: user.tutorId || undefined,
            assistedTutorId: user.assistedTutorId || undefined,
            tutor: user.tutor ? {
              id: user.tutor.id,
              username: user.tutor.username,
              firstName: user.tutor.firstName || undefined,
              lastName: user.tutor.lastName || undefined
            } : undefined
          };
        } catch (error) {
          console.error('NextAuth authorize error:', error);
          throw error;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
        token.role = user.role;
        token.roles = user.roles;
        token.isInAcademy = user.isInAcademy;
        token.tutorId = user.tutorId ?? undefined;
        token.assistedTutorId = user.assistedTutorId ?? undefined;
        token.isBoardMember = user.isBoardMember;
        token.isAdmin = user.isAdmin;
        token.tutor = user.tutor;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.email = token.email as string;
        session.user.role = token.role as UserRole;
        session.user.roles = token.roles as UserRole[];
        session.user.isInAcademy = token.isInAcademy as boolean;
        session.user.tutorId = token.tutorId as string | undefined;
        session.user.assistedTutorId = token.assistedTutorId as string | undefined;
        session.user.isBoardMember = token.isBoardMember as boolean;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.tutor = token.tutor as TutorInfo; // Use proper TutorInfo type extension
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXT_AUTH_SECRET
}; 