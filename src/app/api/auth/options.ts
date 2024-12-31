import NextAuth, { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verify } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { SubCounty } from '@/app/utils/interfaces';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter : PrismaAdapter(prisma),  
  providers: [
    CredentialsProvider({
      name: "Access Key",
      credentials: {
        accessKey: { label: "Access Key", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.accessKey) {
          return null
        }

        const subCounty = await prisma.subCounty.findUnique({
          where: { accessKey: credentials.accessKey },
          include: { user: true, county: true },
        })

        if (subCounty && subCounty.user) {
          return {
            id: subCounty.user.id.toString(),
            role: subCounty.user.role,
            name: subCounty.name,
            countyId: subCounty.countyId,
            subCountyId: subCounty.id,
          }
        }

        const county = await prisma.county.findFirst({
          where: { subCounties: { some: { accessKey: credentials.accessKey } } },
          include: { subCounties: { include: { user: true } } },
        })

        if (county) {
          const subCounty = county.subCounties.find((sc: SubCounty) => sc.accessKey === credentials.accessKey)
          if (subCounty && subCounty.user) {
            return {
              id: subCounty.user.id.toString(),
              role: subCounty.user.role,
              name: county.name,
              countyId: county.id,
              subCountyId: subCounty.id,
            }
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.countyId = user.countyId
        token.subCountyId = user.subCountyId
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as "COUNTRY_ADMIN" | "COUNTY_ADMIN" | "SUB_COUNTY_USER"
        session.user.countyId = token.countyId as string | undefined
        session.user.subCountyId = token.subCountyId as string | undefined
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
};