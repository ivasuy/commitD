import { redirect } from "next/navigation";

import { getDashboardUrl } from "@/src/lib/dashboard-url";

type SearchParamValue = string | string[] | undefined;

interface SignInRedirectPageProps {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

function toQueryString(searchParams: Record<string, SearchParamValue>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
      continue;
    }

    if (typeof value === "string") {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export default async function LandingSignInRedirectPage({
  searchParams,
}: SignInRedirectPageProps) {
  const query = toQueryString(await searchParams);
  redirect(`${getDashboardUrl()}/signin${query}`);
}
