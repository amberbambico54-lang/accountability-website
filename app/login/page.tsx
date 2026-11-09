"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";
import { getAppUser } from "@/lib/identity";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const { user, error: sessionError, signInDemo } = useAuth();
  const [email, setEmail] = useState("amberbambico.54@gmail.com");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.replace("/");
  }, [router, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!hasSupabaseConfig || !supabase) {
      setErrorMessage("Sign-in is not configured. Choose a temporary demo profile below.");
      return;
    }

    if (!getAppUser(email)) {
      setErrorMessage("This private space is limited to the two invited account emails.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      router.replace("/");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSignIn = (name: "Fernan" | "Alpha") => {
    setErrorMessage("");
    signInDemo(name);
    router.replace("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#F7F4ED_0%,#E7E0D2_100%)] p-4">
      <Card className="w-full max-w-md border-[#E7E0D2] bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Our Space</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!hasSupabaseConfig ? (
              <div role="status" className="space-y-3 rounded-2xl border border-[#D7C6A8] bg-[#FBF5E9] p-4 text-sm text-[#5D513F]">
                <div>
                  <p className="font-semibold">Temporary local demo sign-in</p>
                  <p className="mt-1">Choose a profile to preview the app. This is not secure authentication; the selected profile and app data stay in this browser.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="secondary" onClick={() => handleDemoSignIn("Fernan")}>Continue as Fernan</Button>
                  <Button type="button" variant="secondary" onClick={() => handleDemoSignIn("Alpha")}>Continue as Alpha</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#313B32]">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-[#313B32] outline-none focus:ring-2 focus:ring-[#A4B49B]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#313B32]">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-[#313B32] outline-none focus:ring-2 focus:ring-[#A4B49B]"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Signing in..." : "Continue to Our Space"}
                </Button>
                <p className="text-center text-sm text-[#4E5A52]">Private sign-in for Fernan and Alpha only. No public registration.</p>
              </>
            )}
            {(errorMessage || sessionError) && (
              <p role="alert" className="rounded-2xl border border-[#D9A6A6] bg-[#FBEEEE] p-3 text-sm text-[#8B3F3F]">
                {errorMessage || sessionError}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
