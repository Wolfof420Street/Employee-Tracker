import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { User } from "./interfaces"; // Adjust the import according to your project structure

function isUser(obj: any): obj is User {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.role === 'string' &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  );
}

export async function checkAuth(req: NextRequest): Promise<User | NextResponse> {
  const session = await getServerSession();

  if (!session || !session.user || !isUser(session.user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return session.user;
}

export function checkPermission(user: User, allowedRoles: string[]): NextResponse | void {
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}