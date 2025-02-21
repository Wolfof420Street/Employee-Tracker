"use client"

import LoginPage from "@/app/login/page";
import { SessionProvider } from "next-auth/react";
import AuthenticatedLayout from "../auth";

export default function AuthenticatedPage({ session }: { session: any }) {
    return (
      <SessionProvider session={session}>
        {session ? <AuthenticatedLayout /> : <LoginPage />}
      </SessionProvider>
    );
  }