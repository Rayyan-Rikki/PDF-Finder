"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, LogIn, Shield, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AuthPageClientProps {
  nextPath: string;
}

const DEFAULT_ADMIN_ID = "admin";

export default function AuthPageClient({ nextPath }: AuthPageClientProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [userMode, setUserMode] = useState<"login" | "signup">("login");
  const [userLoading, setUserLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleUserSubmit(formData: FormData) {
    setUserLoading(true);
    setMessage("");
    setError("");

    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const displayName = String(formData.get("display_name") || "").trim();

    try {
      if (userMode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
            },
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        if (data.session) {
          router.push(nextPath);
          router.refresh();
          return;
        }

        setMessage("Registration submitted. Check your email if confirmation is enabled in Supabase.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        router.push(nextPath);
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setUserLoading(false);
    }
  }

  async function handleAdminSubmit(formData: FormData) {
    setAdminLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminId: String(formData.get("admin_id") || "").trim(),
          password: String(formData.get("password") || ""),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Admin login failed.");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Admin login failed.");
    } finally {
      setAdminLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur">
            <Shield className="h-4 w-4" />
            Secure Worksheet Access
          </div>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl">
              Sign in before browsing worksheets or entering the admin portal.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-600">
              Students and teachers use email/password. Admin access is restricted to the configured admin ID.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="rounded-[2rem] border-white/70 bg-white/80 shadow-xl shadow-blue-100/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <UserRound className="h-5 w-5 text-blue-600" />
                  User Access
                </CardTitle>
                <CardDescription>
                  Register directly from this page and start browsing published worksheets.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="rounded-[2rem] border-white/70 bg-slate-950 text-white shadow-xl shadow-slate-300/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-amber-300" />
                  Admin Access
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Use the admin ID and password to manage uploads, reviews, and publishing.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <Card className="rounded-[2.5rem] border-white/70 bg-white/90 shadow-2xl shadow-slate-200/70 backdrop-blur">
          <CardHeader className="space-y-3 pb-2">
            <CardTitle className="text-3xl font-black tracking-tight text-slate-950">
              Authentication
            </CardTitle>
            <CardDescription>
              `next` redirect: <span className="font-medium text-slate-700">{nextPath}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="user" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-slate-100 p-1">
                <TabsTrigger value="user" className="rounded-2xl">User</TabsTrigger>
                <TabsTrigger value="admin" className="rounded-2xl">Admin</TabsTrigger>
              </TabsList>

              <TabsContent value="user" className="pt-4">
                <div className="mb-4 flex rounded-2xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setUserMode("login")}
                    className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                      userMode === "login" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserMode("signup")}
                    className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                      userMode === "signup" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Register
                  </button>
                </div>

                <form
                  className="space-y-4"
                  action={async (formData) => {
                    await handleUserSubmit(formData);
                  }}
                >
                  {userMode === "signup" && (
                    <div className="space-y-2">
                      <Label htmlFor="display_name">Display Name</Label>
                      <Input id="display_name" name="display_name" placeholder="Your name" required />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" minLength={8} required />
                  </div>
                  <Button
                    type="submit"
                    className="h-11 w-full rounded-2xl bg-blue-600 font-semibold hover:bg-blue-700"
                    disabled={userLoading}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    {userLoading ? "Working..." : userMode === "signup" ? "Create User Account" : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin" className="pt-4">
                <form
                  className="space-y-4"
                  action={async (formData) => {
                    await handleAdminSubmit(formData);
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="admin_id">Admin ID</Label>
                    <Input
                      id="admin_id"
                      name="admin_id"
                      defaultValue={DEFAULT_ADMIN_ID}
                      autoCapitalize="none"
                      autoCorrect="off"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin_password">Password</Label>
                    <Input id="admin_password" name="password" type="password" required />
                  </div>
                  <Button
                    type="submit"
                    className="h-11 w-full rounded-2xl bg-slate-950 font-semibold hover:bg-black"
                    disabled={adminLoading}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    {adminLoading ? "Checking..." : "Sign In As Admin"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {message && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
