import { PrismaClient } from '@prisma/client';
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verify } from 'jsonwebtoken';

// Initialize Prisma Client
const prisma = new PrismaClient();

// Define types for better type safety
interface JWTPayload {
  id: string;
  role: string;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (!process.env.NEXTAUTH_SECRET) {
        throw new Error('NEXTAUTH_SECRET is not defined');
      }

      if (user) {
        token.id = user.id.toString();
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = parseInt(token.id as string);
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  providers: [
    CredentialsProvider({
      name: "Access Key",
      credentials: {
        token: { 
          label: 'Token', 
          type: 'text',
          placeholder: 'Enter your access token'
        },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.token) {
            throw new Error('No token provided');
          }

          if (!process.env.NEXTAUTH_SECRET) {
            throw new Error('NEXTAUTH_SECRET is not defined');
          }

          const decoded = verify(
            credentials.token, 
            process.env.NEXTAUTH_SECRET
          ) as JWTPayload;

          // Validate decoded token structure
          if (!decoded.id || !decoded.role) {
            throw new Error('Invalid token structure');
          }

          return {
            id: decoded.id,
            role: decoded.role,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      }
    })
  ]
};