import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

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
            include: {
              tutor: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
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
            tutorId: user.tutorId || undefined,
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
        token.tutorId = user.tutorId ?? undefined;
        token.tutor = user.tutor;
      }
      return token;
    },
    async session({ session, token }: { session: any, token: any }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.email = token.email as string;
        session.user.role = token.role as UserRole;
        session.user.tutorId = token.tutorId as string | undefined;
        session.user.tutor = token.tutor;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXT_AUTH_SECRET
}; 