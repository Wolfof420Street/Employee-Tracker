"use client";

import React, { useEffect, Suspense } from 'react';
import { useSession, signIn } from 'next-auth/react';
import DashboardPage from './dashboard/page';



const AuthenticatedLayout = () => {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn();
    }
  }, [status]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null; // Prevent flashing before redirect
  }

  const Spinner = () => (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
    </div>
  );

  return (
    <Suspense fallback={<Spinner />}>
      <DashboardPage />
    </Suspense>
  );
};

export default AuthenticatedLayout;