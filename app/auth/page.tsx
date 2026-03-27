import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import AuthPageClient from "@/components/auth/AuthPageClient";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const auth = await getAuthContext();
  const query = await searchParams;
  const next = query.next || "/";

  if (auth) {
    redirect(next);
  }

  return <AuthPageClient nextPath={next} />;
}
