"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const redirectUrl = searchParams.get("redirectedFrom") || "/app";

    if (showForgotPassword) {
      // Handle password reset request
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setSuccess("Password reset link sent! Check your email.");
        setEmail("");
        setLoading(false);
      }
      return;
    }

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        // Check if email confirmation is required
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.replace(redirectUrl);
        } else {
          setError("Please check your email to confirm your account");
          setLoading(false);
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        router.replace(redirectUrl);
      }
    }
  };

  return (
    <div className="relative flex flex-1 items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(155,109,255,0.14)_0%,transparent_60%),radial-gradient(ellipse_40%_40%_at_90%_80%,rgba(247,201,72,0.10)_0%,transparent_50%)]" />
      </div>

      <div className="absolute right-4 top-4">
        <ModeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            🏏
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight">
            {showForgotPassword
              ? "Reset password"
              : isSignUp
              ? "Create account"
              : "Welcome back"}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {showForgotPassword
              ? "Enter your email to receive a reset link"
              : isSignUp
              ? "Sign up to start predicting IPL matches"
              : "Sign in to continue predicting IPL matches"}
          </div>
        </div>

        <Card className="bg-card/70">
          <CardContent className="p-6 space-y-4">
            {error && (
              <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-500">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {!showForgotPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Password</label>
                    {!isSignUp && (
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setError(null);
                          setSuccess(null);
                        }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              )}

              <Button
                className="w-full"
                type="submit"
                disabled={loading || !email || (!password && !showForgotPassword)}
              >
                {loading
                  ? "Loading..."
                  : showForgotPassword
                  ? "Send reset link"
                  : isSignUp
                  ? "Sign up"
                  : "Sign in"}
              </Button>
            </form>

            {!showForgotPassword && (
              <div className="text-center text-xs text-muted-foreground">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  className="underline underline-offset-4 hover:text-foreground"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setSuccess(null);
                  }}
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </div>
            )}

            {showForgotPassword && (
              <div className="text-center text-xs text-muted-foreground">
                Remember your password?{" "}
                <button
                  className="underline underline-offset-4 hover:text-foreground"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setError(null);
                    setSuccess(null);
                  }}
                >
                  Sign in
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            className="underline underline-offset-4 hover:text-foreground"
            href="/"
          >
            ← Back to landing
          </Link>
        </div>
      </div>
    </div>
  );
}

