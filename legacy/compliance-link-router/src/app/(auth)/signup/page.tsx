/**
 * @file src/app/(auth)/signup/page.tsx
 * @description Premium Aegis Route signup page.
 *
 * Features:
 * - 'Create Account' gradient headline
 * - Full name, email, password (with strength indicator), confirm password
 * - Terms of service checkbox
 * - Loading state on submit
 * - Google OAuth
 * - Sign in link
 * - Zod SignupSchema validation
 * - On success → shows email confirmation message
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/lib/stores/auth-store";

// ---------------------------------------------------------------------------
// Zod SignupSchema
// ---------------------------------------------------------------------------

const SignupSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(80, "Full name cannot exceed 80 characters")
      .regex(/^[a-zA-Z\s'-]+$/, "Full name contains invalid characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address")
      .max(254, "Email is too long"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the Terms of Service" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupFormData = z.infer<typeof SignupSchema>;

// ---------------------------------------------------------------------------
// Password strength calculator
// ---------------------------------------------------------------------------

interface PasswordStrength {
  score: 0 | 1 | 2 | 3;
  label: "Weak" | "Fair" | "Good" | "Strong";
  color: string;
}

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "Weak", color: "bg-red-500" };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const map: Record<number, PasswordStrength> = {
    0: { score: 0, label: "Weak", color: "bg-red-500" },
    1: { score: 1, label: "Weak", color: "bg-red-500" },
    2: { score: 2, label: "Fair", color: "bg-yellow-500" },
    3: { score: 3, label: "Good", color: "bg-blue-500" },
    4: { score: 3, label: "Strong", color: "bg-green-500" },
  };

  return map[score] ?? map[0];
}

// ---------------------------------------------------------------------------
// Google OAuth icon
// ---------------------------------------------------------------------------

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Email confirmation view
// ---------------------------------------------------------------------------

function EmailConfirmation({ email }: { email: string }) {
  return (
    <Card className="border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/40">
      <CardContent className="pt-10 pb-10 flex flex-col items-center text-center gap-5">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Check Your Email</h2>
          <p className="text-sm text-white/50 max-w-xs">
            We sent a confirmation link to{" "}
            <span className="text-purple-400 font-medium">{email}</span>.
            Click the link to activate your account.
          </p>
        </div>
        <p className="text-xs text-white/30 mt-2">
          Didn&apos;t receive it? Check your spam folder or{" "}
          <button
            type="button"
            className="text-purple-400 hover:text-purple-300 transition-colors"
            onClick={() => window.location.reload()}
          >
            try again
          </button>
          .
        </p>
        <Link
          href="/login"
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium"
        >
          Back to Sign In →
        </Link>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null);
  const [watchedPassword, setWatchedPassword] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Watch password for strength indicator
  const passwordValue = watch("password", "");
  const strength = useMemo(
    () => getPasswordStrength(watchedPassword),
    [watchedPassword]
  );

  // ---- Form submit handler ------------------------------------------------

  const onSubmit = useCallback(async (data: SignupFormData) => {
    setGlobalError(null);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (error) throw new Error(error.message);

      setConfirmedEmail(data.email);
    } catch (err) {
      setGlobalError(
        err instanceof Error ? err.message : "Sign up failed. Please try again."
      );
    }
  }, []);

  // ---- Google OAuth -------------------------------------------------------

  const handleGoogleOAuth = async () => {
    setOauthLoading(true);
    setGlobalError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setGlobalError(
        err instanceof Error ? err.message : "Google sign-in failed."
      );
      setOauthLoading(false);
    }
  };

  // ---- Show confirmation screen ------------------------------------------

  if (confirmedEmail) {
    return <EmailConfirmation email={confirmedEmail} />;
  }

  // -------------------------------------------------------------------------
  return (
    <div className="w-full">
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20">
          <UserPlus className="w-7 h-7 text-purple-400" />
        </div>
      </div>

      <Card className="border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/40">
        <CardHeader className="pb-2 space-y-1">
          <h1
            className="text-3xl font-bold text-center"
            style={{
              background:
                "linear-gradient(135deg, #e9d5ff 0%, #818cf8 50%, #38bdf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Create Account
          </h1>
          <p className="text-center text-sm text-white/50">
            Start routing links with compliance confidence
          </p>
        </CardHeader>

        <CardContent className="pt-4 space-y-5">
          {/* Global error */}
          {globalError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{globalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Full name */}
            <div className="space-y-1.5">
              <label htmlFor="fullName" className="block text-sm font-medium text-white/70">
                Full Name
              </label>
              <Input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="Alice Johnson"
                aria-invalid={!!errors.fullName}
                {...register("fullName")}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25
                           focus-visible:ring-purple-500/60 focus-visible:border-purple-500/60
                           transition-all duration-300 h-11"
              />
              {errors.fullName && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="signupEmail" className="block text-sm font-medium text-white/70">
                Email Address
              </label>
              <Input
                id="signupEmail"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                aria-invalid={!!errors.email}
                {...register("email")}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25
                           focus-visible:ring-purple-500/60 focus-visible:border-purple-500/60
                           transition-all duration-300 h-11"
              />
              {errors.email && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password + strength indicator */}
            <div className="space-y-1.5">
              <label htmlFor="signupPassword" className="block text-sm font-medium text-white/70">
                Password
              </label>
              <div className="relative">
                <Input
                  id="signupPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  aria-invalid={!!errors.password}
                  {...register("password", {
                    onChange: (e) => setWatchedPassword(e.target.value),
                  })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25
                             focus-visible:ring-purple-500/60 focus-visible:border-purple-500/60
                             transition-all duration-300 pr-12 h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Strength indicator */}
              {watchedPassword && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength.score
                            ? strength.color
                            : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-white/40">
                    Strength:{" "}
                    <span
                      className={
                        strength.score === 3
                          ? "text-green-400"
                          : strength.score === 2
                          ? "text-blue-400"
                          : strength.score === 1
                          ? "text-yellow-400"
                          : "text-red-400"
                      }
                    >
                      {strength.label}
                    </span>
                  </p>
                </div>
              )}

              {errors.password && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/70">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  aria-invalid={!!errors.confirmPassword}
                  {...register("confirmPassword")}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25
                             focus-visible:ring-purple-500/60 focus-visible:border-purple-500/60
                             transition-all duration-300 pr-12 h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Terms of service */}
            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  {...register("acceptTerms")}
                  className="mt-0.5 w-4 h-4 rounded border border-white/20 bg-white/5 accent-purple-500 cursor-pointer shrink-0"
                />
                <label
                  htmlFor="acceptTerms"
                  className="text-sm text-white/60 cursor-pointer select-none leading-relaxed"
                >
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="text-xs text-red-400 flex items-center gap-1 pl-6">
                  <AlertCircle className="w-3 h-3" />
                  {errors.acceptTerms.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 font-semibold text-sm
                         bg-gradient-to-r from-purple-600 to-blue-600
                         hover:from-purple-500 hover:to-blue-500
                         text-white shadow-lg shadow-purple-500/25
                         transition-all duration-300 hover:shadow-purple-500/40
                         disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-white/10" />
            <span className="px-4 text-xs text-white/30 uppercase tracking-widest">
              or continue with
            </span>
            <div className="flex-grow border-t border-white/10" />
          </div>

          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleOAuth}
            disabled={oauthLoading || isSubmitting}
            className="w-full h-11 border border-white/10 bg-white/5 hover:bg-white/10
                       text-white/80 hover:text-white transition-all duration-200
                       flex items-center justify-center gap-3"
          >
            {oauthLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Sign up with Google
          </Button>

          {/* Sign in link */}
          <p className="text-center text-sm text-white/40">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
