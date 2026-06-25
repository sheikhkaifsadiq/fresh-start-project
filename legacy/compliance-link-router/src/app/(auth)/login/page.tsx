"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Link as LinkIcon, Eye, EyeOff, ArrowRight, Github, Chrome, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 cyber-grid-bg opacity-30 pointer-events-none" />
      <div
        className="fixed w-[500px] h-[500px] rounded-full blur-[100px] opacity-15 pointer-events-none animate-orb-drift"
        style={{ background: "radial-gradient(circle, rgb(168,85,247), transparent)", top: "10%", left: "10%" }}
      />
      <div
        className="fixed w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 pointer-events-none animate-orb-drift"
        style={{ background: "radial-gradient(circle, rgb(6,182,212), transparent)", bottom: "10%", right: "10%", animationDelay: "-10s" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-2xl bg-purple-600/40 blur-xl animate-pulse-glow" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-cyan-500 flex items-center justify-center shadow-2xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-display font-bold gradient-text-static tracking-tight">Aegis Route</h1>
          <p className="text-white/40 text-sm mt-1">Enterprise-grade compliance routing</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl border border-white/[0.08]">
          <div className="mb-6">
            <h2 className="text-xl font-display font-bold text-white">Welcome back</h2>
            <p className="text-sm text-white/40 mt-1">Sign in to your control panel</p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-white/60 uppercase tracking-wider">Email</label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/[0.04] border-white/10 focus:border-purple-500/60 focus:bg-white/[0.06] h-11 text-sm transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-medium text-white/60 uppercase tracking-wider">Password</label>
                <a href="#" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">Forgot password?</a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/[0.04] border-white/10 focus:border-purple-500/60 focus:bg-white/[0.06] h-11 text-sm pr-10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 btn-gradient text-sm font-semibold mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-transparent text-white/30">or continue with</span>
            </div>
          </div>

          {/* OAuth */}
          <Button
            variant="outline"
            className="w-full h-11 border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-sm text-white/70 flex items-center gap-2"
            onClick={() => alert("Configure Supabase OAuth in your dashboard")}
          >
            <Chrome className="w-4 h-4" />
            Continue with Google
          </Button>

          {/* Sign up link */}
          <p className="text-center text-sm text-white/40 mt-5">
            No account?{" "}
            <a href="/signup" className="text-purple-400 hover:text-purple-300 font-medium transition-colors animated-underline">
              Create one free
            </a>
          </p>
        </div>

        {/* Security notice */}
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-white/25">
          <Lock className="w-3 h-3" />
          <span>256-bit TLS · Supabase Auth · SOC 2 ready</span>
        </div>
      </motion.div>
    </div>
  );
}
