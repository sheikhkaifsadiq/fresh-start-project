"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, Activity, Brain, Globe, FileText, Lock, ChevronDown, BarChart, Route, Database, Zap, ShieldAlert, Cpu, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Testimonials } from "@/components/ui/unique-testimonial";
import { HeroVideo } from "@/components/ui/hero-video";

const features = [
  { icon: Shield, title: "Intelligent Bot Mitigation", desc: "Stop malicious scrapers, ad-fraud bots, and DDoS attacks before they hit your infrastructure with zero latency impact.", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { icon: Route, title: "Global Traffic Shaping", desc: "Seamlessly route users based on geography, device type, or custom parameters to optimize conversion rates and user experience.", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  { icon: Lock, title: "Enterprise-Grade Security", desc: "Military-grade encryption and strict access controls ensure your routing data and user destinations are never compromised.", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { icon: BarChart, title: "Advanced Traffic Analytics", desc: "Gain deep visibility into your audience with real-time dashboards detailing human vs. non-human traffic patterns.", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  { icon: FileText, title: "Compliance Automation", desc: "Built-in audit trails and automated data residency rules ensure seamless GDPR, HIPAA, and SOC2 compliance at scale.", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  { icon: Brain, title: "Predictive Threat Detection", desc: "Identify and neutralize emerging threats instantly using our proprietary behavioral intelligence engine.", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
];

const stats = [
  { value: "1M+", label: "Requests Analyzed Daily" },
  { value: "99.9%", label: "Threat Detection Rate" },
  { value: "<30ms", label: "Average Routing Latency" },
  { value: "99.99%", label: "Platform Uptime SLA" },
];

const compliance = ["GDPR", "CCPA", "HIPAA", "PCI DSS", "SOC 2", "ISO 27001"];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, type: "spring", bounce: 0.4 } },
};

const telemetryData = [
  { icon: Zap, text: "Tokyo Edge: 14ms", color: "text-emerald-400" },
  { icon: ShieldAlert, text: "Blocked: SQLi payload", color: "text-rose-400" },
  { icon: Globe, text: "Route: /checkout -> US-East", color: "text-indigo-400" },
  { icon: Cpu, text: "ML Bot Confidence: 99.8%", color: "text-amber-400" },
  { icon: Network, text: "Traffic Spike: 12k req/s", color: "text-cyan-400" },
  { icon: ShieldAlert, text: "Rate Limit Triggered (IP: 192.168.*)", color: "text-rose-400" },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden selection:bg-white/20 selection:text-white">
      
      {/* =========================================
          HERO SECTION (Power AI Theme)
          ========================================= */}
      <section className="relative min-h-screen flex flex-col overflow-visible z-10">
        
        {/* Background Video Wrapper */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <HeroVideo src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4" />
        </div>

        {/* Blurred Overlay Shape */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[984px] h-[527px] opacity-90 bg-gray-950 blur-[82px] pointer-events-none z-0" />

        {/* Navbar */}
        <nav className="relative z-50 w-full">
          <div className="w-full px-8 py-5 flex flex-row items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center gap-3 cursor-pointer">
              <Shield className="w-8 h-8 text-indigo-500 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
              <span className="text-xl font-bold tracking-tight text-foreground">Aegis Route</span>
            </div>

            {/* Center: Nav Items */}
            <div className="hidden md:flex items-center gap-8">
              <button className="flex items-center gap-1 text-foreground/90 hover:text-white transition-colors text-sm font-medium">
                Features <ChevronDown className="w-4 h-4 opacity-50" />
              </button>
              <button className="text-foreground/90 hover:text-white transition-colors text-sm font-medium">Solutions</button>
              <button className="text-foreground/90 hover:text-white transition-colors text-sm font-medium">Plans</button>
              <button className="flex items-center gap-1 text-foreground/90 hover:text-white transition-colors text-sm font-medium">
                Learning <ChevronDown className="w-4 h-4 opacity-50" />
              </button>
            </div>

            {/* Right: CTA */}
            <Link href="/signup">
              <button className="hero-secondary-btn px-6 py-2.5 text-sm">
                Sign Up
              </button>
            </Link>
          </div>
          {/* Gradient Divider */}
          <div className="w-full h-px mt-[3px] bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
        </nav>

        {/* Hero Content (Centered) */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 w-full">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-8xl lg:text-[110px] font-normal leading-[1.05] tracking-[-0.024em] max-w-7xl mx-auto drop-shadow-2xl"
          >
            <span className="text-foreground">Shield Every Link.</span>
            <br />
            <span className="gradient-power-ai">Route Every Request.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="text-hero-sub text-lg md:text-xl leading-8 max-w-2xl mt-[9px] font-medium"
          >
            The compliance-shielded link routing SaaS with behavioral threat analysis, global traffic shaping, and real-time enterprise visibility.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-[25px]"
          >
            <Link href="/signup">
              <button className="hero-secondary-btn px-[29px] py-[24px] text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                Schedule a Consult
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Futuristic Telemetry Stream (Pinned to bottom) */}
        <div className="relative z-10 w-full pb-10 overflow-hidden mt-8">
          <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <p className="text-foreground/50 text-sm font-mono tracking-widest uppercase">
                  Live Edge<br/>Telemetry
                </p>
              </div>
            </div>
            
            {/* Infinite Marquee Container */}
            <div className="flex-1 overflow-hidden relative w-full [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
              <div className="flex items-center gap-6 w-max animate-marquee">
                {/* Render two sets of telemetry data for seamless looping */}
                {[...telemetryData, ...telemetryData].map((item, idx) => (
                  <div key={idx} className="liquid-glass px-5 py-2.5 rounded-full flex items-center gap-3 border border-white/5 shadow-lg">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-sm font-mono text-foreground/80 tracking-wide">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          REST OF THE LANDING PAGE (Dark Cinematic Theme)
          ========================================= */}

      {/* ===== STATS STRIP ===== */}
      <section className="py-24 border-y border-white/5 relative z-10 bg-black/20 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.4 }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="text-center group"
              >
                <p className="text-5xl font-bold text-foreground group-hover:scale-110 group-hover:text-indigo-400 transition-all cursor-default drop-shadow-lg">{stat.value}</p>
                <p className="text-sm text-foreground/50 mt-4 font-mono uppercase tracking-widest font-semibold">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-40 px-4 relative z-10">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-24">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.8 }}
              className="text-sm font-bold font-mono text-indigo-400 uppercase tracking-widest mb-6"
            >
              Enterprise Capabilities
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.4 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-7xl font-bold tracking-tight text-foreground"
            >
              Intelligence applied to <span className="gradient-power-ai">every request</span>
            </motion.h2>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((f) => (
              <motion.div key={f.title} variants={itemVariants}>
                <div 
                  className="liquid-glass rounded-3xl p-10 h-full hover-lift cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-16 h-16 rounded-2xl ${f.bg} border flex items-center justify-center mb-8 shadow-inner`}>
                      <f.icon className={`w-8 h-8 ${f.color}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4 tracking-tight">{f.title}</h3>
                  </div>
                  <p className="text-lg text-foreground/60 leading-relaxed font-medium">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== VALUE FLOW DIAGRAM ===== */}
      <section className="py-40 px-4 border-y border-white/5 relative z-10 bg-black/20">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-28">
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.8 }}
              className="text-sm font-bold font-mono text-purple-400 uppercase tracking-widest mb-6"
            >
              The Shielding Process
            </motion.p>
            <motion.h2 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.4 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-7xl font-bold tracking-tight text-foreground"
            >
              Frictionless data flow
            </motion.h2>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0">
            {[
              { label: "Ingestion", sublabel: "Global Edge Network", color: "#6366f1", icon: Globe },
              { label: "Analysis", sublabel: "Behavioral Threat Scanning", color: "#8b5cf6", icon: Brain },
              { label: "Filtration", sublabel: "Smart Traffic Shaping", color: "#a855f7", icon: Activity },
              { label: "Protection", sublabel: "Zero-Trust Link Resolution", color: "#d946ef", icon: Shield },
              { label: "Insights", sublabel: "Real-time Analytics", color: "#f43f5e", icon: Database },
            ].map((node, i) => (
              <div key={node.label} className="flex flex-col md:flex-row items-center">
                <motion.div
                  initial={{ opacity: 0, y: 40, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  whileHover={{ scale: 1.1, y: -10 }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  viewport={{ once: false, amount: 0.5 }}
                  className="flex flex-col items-center w-48 cursor-default"
                >
                  <div
                    className="w-24 h-24 rounded-3xl flex items-center justify-center liquid-glass mb-5 shadow-[0_0_30px_rgba(255,255,255,0.03)]"
                  >
                    <node.icon className="w-10 h-10" style={{ color: node.color }} />
                  </div>
                  <p className="text-lg font-bold text-foreground">{node.label}</p>
                  <p className="text-sm text-foreground/50 text-center mt-2 font-mono font-medium">{node.sublabel}</p>
                </motion.div>
                {i < 4 && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    whileInView={{ width: 80, opacity: 1 }}
                    viewport={{ once: false, amount: 0.8 }}
                    transition={{ duration: 0.6, delay: i * 0.1 + 0.3 }}
                    className="h-[2px] bg-white/10 mx-4 hidden md:block rounded-full"
                    style={{ width: 80 }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-40 px-4 relative z-10">
        <div className="container mx-auto max-w-7xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 1 }}
          >
            <p className="text-sm font-bold font-mono text-amber-400 uppercase tracking-widest mb-6">Trusted Worldwide</p>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-20 text-foreground">
              Teams love <span className="gradient-power-ai">Aegis Route</span>
            </h2>
            <Testimonials />
          </motion.div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-40 px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 1.2 }}
          className="container mx-auto max-w-5xl"
        >
          <div className="liquid-glass rounded-[3rem] p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-amber-500/10 pointer-events-none" />
            <div className="relative z-10">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 mx-auto mb-10 liquid-glass rounded-full flex items-center justify-center shadow-inner"
              >
                <Shield className="w-12 h-12 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
              </motion.div>
              <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-foreground">
                Ready to protect your{" "}
                <span className="gradient-power-ai">digital assets?</span>
              </h2>
              <p className="text-foreground/60 mb-12 text-2xl max-w-3xl mx-auto font-medium">
                Start shielding your links with behavioral intelligence today. Join the secure routing revolution.
              </p>
              <Link href="/signup">
                <button className="hero-secondary-btn px-[40px] py-[28px] text-xl font-bold hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.05)]">
                  Launch Your Control Panel
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/5 py-16 px-4 bg-black/40 relative z-10">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4 cursor-pointer">
              <Shield className="w-8 h-8 text-indigo-500" />
              <span className="text-2xl font-bold text-foreground">Aegis Route</span>
            </div>
            <p className="text-sm text-foreground/40 font-mono font-medium">
              © 2026 Aegis Route · Secure Enterprise Cloud
            </p>
            <div className="flex items-center gap-8 text-sm text-foreground/60 font-bold">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Docs</a>
              <a href="#" className="hover:text-white transition-colors flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                Status
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
