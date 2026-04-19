"use client";

import { useAuthContext } from "@/src/components/auth/AuthProvider";

export function useAuth() {
  return useAuthContext();
}
