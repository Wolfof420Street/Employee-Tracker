import { getServerSession } from "next-auth";



import { headers } from "next/headers";
import { authOptions } from "./api/auth/options";
import AuthenticatedPage from "./components/authenticated_page";

export default async function Home() {

  const session = await getServerSession(authOptions);

  headers()

  return <AuthenticatedPage session={session} />;
}