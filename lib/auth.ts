import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import { compare } from "bcrypt";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            username: credentials.username,
          },
          include: {
            tutor: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            },
            boardMember: {
              select: {
                id: true,
                isActive: true
              }
            },
            _count: {
              select: {
                academyAssignments: true,
                academyStudents: true
              }
            }
          }
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        const isAdmin = user.roles.includes('ADMIN') || user.role === 'ADMIN';
        const isBoardMember = user.roles.includes('BOARD_MEMBER') || user.role === 'BOARD_MEMBER' || user.boardMember?.isActive === true;
        const isInAcademy = (user as any).isInAcademy || (user._count.academyAssignments > 0) || (user._count.academyStudents > 0);

        return {
          id: user.id,
          username: user.username,
          role: user.role,
          roles: user.roles,
          isAdmin,
          isBoardMember,
          isInAcademy,
          tutorId: user.tutorId || undefined,
          tutor: user.tutor ? {
            id: user.tutor.id,
            username: user.tutor.username,
            firstName: user.tutor.firstName || undefined,
            lastName: user.tutor.lastName || undefined
          } : undefined
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          username: token.username,
          role: token.role,
          roles: token.roles,
          isAdmin: token.isAdmin,
          isBoardMember: token.isBoardMember,
          isInAcademy: token.isInAcademy,
          tutorId: token.tutorId,
          tutor: token.tutor
        },
      };
    },
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
        token.role = user.role;
        token.roles = user.roles;
        token.isAdmin = user.isAdmin;
        token.isBoardMember = user.isBoardMember;
        token.isInAcademy = user.isInAcademy;
        token.tutorId = user.tutorId;
        token.tutor = user.tutor;
      }
      return token;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXT_AUTH_SECRET,
  debug: true
}; 