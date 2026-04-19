import type { NextRequest } from "next/server";

import { getAdminAuth } from "@/src/lib/server/firebaseAdmin";

export class RouteAuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

function parseBearerToken(request: NextRequest): string {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new RouteAuthError("Unauthorized");
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    throw new RouteAuthError("Unauthorized");
  }

  return token;
}

export async function requireAuthenticatedUser(request: NextRequest): Promise<{
  uid: string;
  email: string | null;
}> {
  const token = parseBearerToken(request);

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);

    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
    };
  } catch {
    throw new RouteAuthError("Unauthorized");
  }
}
