"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { LogoIcon } from "./ui/LogoIcon";
import { 
  Github, 
  Linkedin, 
  ExternalLink, 
  Heart, 
  Shield, 
  Database, 
  Lock, 
  Brain, 
  LineChart, 
  Sparkles, 
  Activity, 
  Terminal, 
  Cloud, 
  Cpu, 
  Layers, 
  Network, 
  CheckCircle2, 
  Server
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function LandingPage() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  // Act I - III (Couple Narrative) Refs
  const coupleCanvasRef = useRef<HTMLDivElement>(null);
  const bfRef = useRef<HTMLDivElement>(null);
  const gfRef = useRef<HTMLDivElement>(null);
  const logoCircleRef = useRef<SVGSVGElement>(null);
  const logoCoreRef = useRef<HTMLDivElement>(null);
  const bfBubbleRef = useRef<HTMLDivElement>(null);
  const gfBubbleRef = useRef<HTMLDivElement>(null);
  const bfBubbleTextRef = useRef<HTMLSpanElement>(null);
  const gfBubbleTextRef = useRef<HTMLSpanElement>(null);
  const particlesLeftRef = useRef<HTMLDivElement>(null);
  const particlesRightRef = useRef<HTMLDivElement>(null);
  const finalHeartRef = useRef<HTMLDivElement>(null);

  // Act IV - VI (DevOps / Infrastructure Blueprint) Refs
  const infraCanvasRef = useRef<HTMLDivElement>(null);
  
  // Act IV Refs
  const verticalPathRef = useRef<SVGPathElement>(null);
  const terraformBlockRef = useRef<HTMLDivElement>(null);
  const awsBlockRef = useRef<HTMLDivElement>(null);
  const codeLinesRef = useRef<HTMLDivElement>(null);
  const codeParticlesRef = useRef<HTMLDivElement>(null);
  
  // Act V Refs
  const eksBlockRef = useRef<HTMLDivElement>(null);
  const eksOuterRing1Ref = useRef<SVGSVGElement>(null);
  const eksOuterRing2Ref = useRef<SVGSVGElement>(null);
  const computeNodesRef = useRef<HTMLDivElement>(null);

  // Act VI Refs
  const helmBlockRef = useRef<HTMLDivElement>(null);
  const helmShipRef = useRef<HTMLDivElement>(null);
  const monitorNamespaceRef = useRef<HTMLDivElement>(null);
  const tenantNamespaceRef = useRef<HTMLDivElement>(null);
  const telemetryBubbleRef = useRef<HTMLDivElement>(null);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          pin: pinRef.current,
          pinSpacing: false,
          anticipatePin: 1,
        },
      });

      // --- INITIAL STATE CONFIGURATIONS ---
      // Acts I - III
      gsap.set(bfRef.current, { x: -300, opacity: 0 });
      gsap.set(gfRef.current, { x: 300, opacity: 0 });
      gsap.set(bfBubbleRef.current, { scale: 0, opacity: 0 });
      gsap.set(gfBubbleRef.current, { scale: 0, opacity: 0 });
      gsap.set(logoCoreRef.current, { filter: "drop-shadow(0 0 0px rgba(239, 68, 68, 0))" });
      gsap.set(particlesLeftRef.current?.children || [], { opacity: 0, x: -100 });
      gsap.set(particlesRightRef.current?.children || [], { opacity: 0, x: 100 });
      gsap.set(finalHeartRef.current, { scale: 0, opacity: 0 });

      // Acts IV - VI
      gsap.set(infraCanvasRef.current, { opacity: 0, y: 150 });
      gsap.set(verticalPathRef.current, { strokeDasharray: 400, strokeDashoffset: 400 });
      gsap.set(terraformBlockRef.current, { opacity: 0, x: -100 });
      gsap.set(awsBlockRef.current, { opacity: 0, x: 100 });
      gsap.set(codeLinesRef.current?.children || [], { opacity: 0, y: 10 });
      gsap.set(codeParticlesRef.current?.children || [], { opacity: 0, scale: 0.5, y: 30 });
      
      gsap.set(eksBlockRef.current, { scale: 0.5, opacity: 0 });
      gsap.set(computeNodesRef.current?.children || [], { scale: 0, opacity: 0 });
      
      gsap.set(helmBlockRef.current, { opacity: 0 });
      gsap.set(helmShipRef.current, { y: -50, opacity: 0 });
      gsap.set(monitorNamespaceRef.current, { x: -50, opacity: 0 });
      gsap.set(tenantNamespaceRef.current, { x: 50, opacity: 0 });
      gsap.set(telemetryBubbleRef.current, { scale: 0, opacity: 0 });

      // ==========================================
      // --- ACT I: EMOTIONAL DISCONNECT (0% - 18%) ---
      // ==========================================
      tl.to(bfRef.current, { x: 0, opacity: 1, duration: 10, ease: "power2.out" }, 0);
      tl.to(bfBubbleRef.current, { scale: 1, opacity: 1, duration: 5, ease: "back.out(1.7)" }, 3);

      tl.to(gfRef.current, { x: 0, opacity: 1, duration: 10, ease: "power2.out" }, 6);
      tl.to(gfBubbleRef.current, { scale: 1, opacity: 1, duration: 5, ease: "back.out(1.7)" }, 9);

      // ==========================================
      // --- ACT II: THE INTERVENTION BRIDGE (18% - 42%) ---
      // ==========================================
      tl.to(bfRef.current, { x: 90, duration: 10, ease: "power2.inOut" }, 15);
      tl.to(gfRef.current, { x: -90, duration: 10, ease: "power2.inOut" }, 15);

      tl.to([bfBubbleRef.current, gfBubbleRef.current], { 
        backgroundColor: "rgba(239, 68, 68, 0.2)", 
        borderColor: "rgba(239, 68, 68, 0.4)", 
        duration: 5 
      }, 15);
      
      tl.call(() => {
        if (bfBubbleTextRef.current) bfBubbleTextRef.current.innerText = "???";
        if (gfBubbleTextRef.current) gfBubbleTextRef.current.innerText = "???";
      }, undefined, 17);

      const logoPaths = logoCoreRef.current?.querySelectorAll("path");
      if (logoPaths) {
        tl.to(logoPaths, { fill: "#ef4444", duration: 8 }, 15);
      }
      tl.to(logoCoreRef.current, { scale: 1.15, duration: 8, ease: "power1.inOut" }, 15);
      tl.to(logoCircleRef.current, { rotation: 360, duration: 25, ease: "none" }, 15);

      // Stream data particles inward
      const leftParticles = particlesLeftRef.current?.children || [];
      const rightParticles = particlesRightRef.current?.children || [];

      Array.from(leftParticles).forEach((particle, idx) => {
        tl.fromTo(particle, 
          { opacity: 0, x: -100 }, 
          { opacity: 1, x: 120, duration: 8, ease: "power1.in" }, 
          19 + idx * 1.5
        );
        tl.to(particle, { opacity: 0, duration: 2, ease: "power1.out" }, 25 + idx * 1.5);
      });

      Array.from(rightParticles).forEach((particle, idx) => {
        tl.fromTo(particle, 
          { opacity: 0, x: 100 }, 
          { opacity: 1, x: -120, duration: 8, ease: "power1.in" }, 
          19 + idx * 1.5
        );
        tl.to(particle, { opacity: 0, duration: 2, ease: "power1.out" }, 25 + idx * 1.5);
      });

      tl.to(logoCoreRef.current, { 
        filter: "drop-shadow(0 0 25px rgba(239, 68, 68, 0.8))", 
        duration: 10, 
        yoyo: true, 
        repeat: 1 
      }, 21);

      // ==========================================
      // --- ACT III: STRATEGIC RESOLUTION (42% - 60%) ---
      // ==========================================
      if (logoPaths) {
        tl.to(logoPaths, { fill: "#3b82f6", duration: 8 }, 38);
      }
      tl.to(logoCoreRef.current, { 
        filter: "drop-shadow(0 0 25px rgba(59, 130, 246, 0.8))", 
        scale: 1.0, 
        duration: 8 
      }, 38);

      tl.to([bfBubbleRef.current, gfBubbleRef.current], { 
        opacity: 0, 
        scale: 0.5, 
        duration: 5,
        ease: "power2.in"
      }, 38);

      tl.call(() => {
        if (bfBubbleTextRef.current) bfBubbleTextRef.current.innerText = "🥰💖";
        if (gfBubbleTextRef.current) gfBubbleTextRef.current.innerText = "🥰💖";
      }, undefined, 43);

      tl.to([bfBubbleRef.current, gfBubbleRef.current], {
        opacity: 1,
        scale: 1,
        backgroundColor: "rgba(168, 85, 247, 0.2)",
        borderColor: "rgba(168, 85, 247, 0.4)",
        duration: 6,
        ease: "back.out(1.5)"
      }, 44);

      tl.to([bfBubbleRef.current, gfBubbleRef.current], { 
        opacity: 0, 
        scale: 0.2, 
        duration: 6,
        ease: "power2.in"
      }, 51);

      tl.to(finalHeartRef.current, {
        scale: 1.3,
        opacity: 1,
        duration: 10,
        ease: "elastic.out(1, 0.5)"
      }, 53);

      tl.to(logoCircleRef.current, { rotation: 540, duration: 15, ease: "power1.out" }, 48);

      // ==========================================
      // --- TRANSITION TO DEVOPS VIEW (60% - 68%) ---
      // ==========================================
      // Fade out Act I-III canvas and slide upward
      tl.to(coupleCanvasRef.current, { 
        opacity: 0, 
        y: -150, 
        duration: 8, 
        ease: "power2.inOut" 
      }, 60);

      // Fade in Act IV-VI canvas and slide upward from bottom
      tl.to(infraCanvasRef.current, { 
        opacity: 1, 
        y: 0, 
        duration: 8, 
        ease: "power2.inOut" 
      }, 60);

      // Draw the vertical purple snaking dotted line (Initial stretch)
      tl.to(verticalPathRef.current, { 
        strokeDashoffset: 280, 
        duration: 8, 
        ease: "none" 
      }, 60);

      // ==========================================
      // --- ACT IV: TERRAFORM CORE & AWS VPC (68% - 85%) ---
      // ==========================================
      // Fade/slide in Terraform pipeline and AWS VPC mock-ups
      tl.to(terraformBlockRef.current, { opacity: 1, x: 0, duration: 8, ease: "power2.out" }, 68);
      tl.to(awsBlockRef.current, { opacity: 1, x: 0, duration: 8, ease: "power2.out" }, 68);

      // Draw path further down to AWS Map
      tl.to(verticalPathRef.current, { 
        strokeDashoffset: 180, 
        duration: 10, 
        ease: "none" 
      }, 68);

      // Fade in Terraform log lines sequentially (and let them stay visible!)
      const codeLines = codeLinesRef.current?.children || [];
      Array.from(codeLines).forEach((line, idx) => {
        tl.fromTo(line,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 4, ease: "power1.out" },
          68 + idx * 3
        );
      });

      // Stream floating configuration capsules to AWS VPC subnets
      const codeParticles = codeParticlesRef.current?.children || [];
      Array.from(codeParticles).forEach((particle, idx) => {
        tl.fromTo(particle, 
          { opacity: 0, scale: 0.5, x: 0, y: 20 }, 
          { opacity: 1, scale: 1, x: 190, y: -20, duration: 8, ease: "power2.out" }, 
          71 + idx * 2.5
        );
        tl.to(particle, { opacity: 0, scale: 0.8, duration: 2, ease: "power1.out" }, 77 + idx * 2.5);
      });

      // ==========================================
      // --- ACT V: EKS COMPUTE BOOTSTRAP (85% - 105%) ---
      // ==========================================
      // Dim Terraform & AWS to focus on center EKS Node Map
      tl.to([terraformBlockRef.current, awsBlockRef.current], { opacity: 0.1, duration: 6 }, 85);
      
      // Draw path into center EKS emblem
      tl.to(verticalPathRef.current, { 
        strokeDashoffset: 90, 
        duration: 8, 
        ease: "none" 
      }, 85);

      // Scale and activate EKS Node cluster
      tl.to(eksBlockRef.current, { scale: 1.0, opacity: 1, duration: 8, ease: "back.out(1.2)" }, 86);
      
      // Spin Concentric Rings around EKS
      tl.to(eksOuterRing1Ref.current, { rotation: 360, duration: 25, ease: "none" }, 86);
      tl.to(eksOuterRing2Ref.current, { rotation: -360, duration: 25, ease: "none" }, 86);

      // Scale in EC2 node groups and attach connections
      const nodes = computeNodesRef.current?.children || [];
      Array.from(nodes).forEach((node, idx) => {
        tl.to(node, {
          scale: 1,
          opacity: 1,
          duration: 5,
          ease: "back.out(1.5)"
        }, 90 + idx * 25 / nodes.length);
      });

      // ==========================================
      // --- ACT VI: HELM ORCHESTRATION & TELEMETRY (105% - 125%) ---
      // ==========================================
      // Dim EKS core node visual slightly
      tl.to(eksBlockRef.current, { opacity: 0.4, duration: 6 }, 105);

      // Finish drawing dotted line to base namespace pods
      tl.to(verticalPathRef.current, { 
        strokeDashoffset: 0, 
        duration: 8, 
        ease: "none" 
      }, 105);

      // Fade in Helm ship block and drop it down
      tl.to(helmBlockRef.current, { opacity: 1, duration: 5 }, 105);
      tl.to(helmShipRef.current, { y: 0, opacity: 1, duration: 6, ease: "bounce.out" }, 105);

      // Namespaces slide open
      tl.to(monitorNamespaceRef.current, { x: 0, opacity: 1, duration: 8, ease: "power2.out" }, 108);
      tl.to(tenantNamespaceRef.current, { x: 0, opacity: 1, duration: 8, ease: "power2.out" }, 108);

      // Lock monitor sub-nodes (Prometheus/Grafana) & Tenant pods into visual grids
      const monitorNodes = monitorNamespaceRef.current?.querySelectorAll(".monitor-node") || [];
      monitorNodes.forEach((node, idx) => {
        tl.fromTo(node, 
          { scale: 0.5, opacity: 0 }, 
          { scale: 1, opacity: 1, duration: 5, ease: "back.out(1.5)" }, 
          111 + idx * 1.5
        );
      });

      const tenantPod = tenantNamespaceRef.current?.querySelector(".tenant-pod");
      if (tenantPod) {
        tl.fromTo(tenantPod, 
          { scale: 0.5, opacity: 0 }, 
          { scale: 1, opacity: 1, duration: 6, ease: "back.out(1.5)" }, 
          113
        );
      }

      // Pulse the telemetry bubble
      tl.to(telemetryBubbleRef.current, { 
        scale: 1, 
        opacity: 1, 
        duration: 6, 
        ease: "elastic.out(1, 0.5)" 
      }, 115);

      // Solid blue path completion
      tl.to(verticalPathRef.current, { 
        stroke: "#3b82f6", 
        filter: "drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))", 
        duration: 8 
      }, 117);

    }, containerRef);

    return () => ctx.revert();
  }, [isMounted]);

  const handleGoClick = () => {
    if (token) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  const handleSignOut = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="relative min-h-screen bg-[#07050a] text-zinc-100 overflow-x-hidden scroll-smooth">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none -translate-y-1/2 -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full bg-violet-900/10 blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-10 w-[400px] h-[400px] rounded-full bg-indigo-950/10 blur-[100px] pointer-events-none -z-10" />

      {/* 🧭 Sticky Navigation Bar */}
      <nav className="fixed top-0 left-0 w-full z-[100] backdrop-blur-md bg-[#09070F]/70 border-b border-white/5 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          {/* Logo & Name */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 rounded-xl px-2 py-1">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/20 group-hover:scale-105 transition-transform">
              <LogoIcon className="w-5.5 h-5.5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">Relmonition</span>
          </Link>

          {/* Navigation Links & Action */}
          <div className="flex items-center gap-6 md:gap-8">
            <Link href="#features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#aboutme" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              About Me
            </Link>
            <div className="flex items-center gap-3">
              {token ? (
                <button
                  onClick={handleSignOut}
                  className="text-sm font-medium text-zinc-400 hover:text-white transition-colors mr-2 cursor-pointer"
                >
                  Logout
                </button>
              ) : null}
              <button
                onClick={handleGoClick}
                className="bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20 active:scale-95 transition-all rounded-lg px-5 py-2 text-sm font-medium cursor-pointer"
              >
                Go
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 🎭 Hero & Scroll-Trigger Timeline Container */}
      <div ref={containerRef} className="relative w-full">
        {/* Pinned animation canvas (Viewport) */}
        <div ref={pinRef} className="h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#07050a] z-10 pt-16">
          
          {/* Subtle grid background */}
          <div 
            className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(to right, #808080 1px, transparent 1px), linear-gradient(to bottom, #808080 1px, transparent 1px)`,
              backgroundSize: "4rem 4rem"
            }}
          />

          {/* ======================================================== */}
          {/* SECTION A: Couple Interaction Canvas (Acts I, II, III)   */}
          {/* ======================================================== */}
          <div ref={coupleCanvasRef} className="absolute inset-0 w-full h-full flex flex-col items-center justify-center">
            {/* Intro Hero Text (Visible initially, fades as scroll begins) */}
            <div className="text-center max-w-2xl px-6 mb-12 z-20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/20 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-4 tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" /> Privacy-First Intelligence
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-purple-100 to-purple-400 bg-clip-text text-transparent">
                Build a Deeper Connection
              </h2>
              <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                Experience the future of relationship development. Secure multi-tenant architecture, clinically-grounded metrics, and sovereign RAG memory that grows with you.
              </p>
              <div className="mt-6 text-xs text-purple-500/70 font-mono animate-bounce">
                Scroll to explore the narrative ↓
              </div>
            </div>

            {/* Core Animation Canvas Viewport */}
            <div className="relative w-full max-w-4xl h-[320px] flex items-center justify-between px-8 md:px-24">
              
              {/* 1. Left Character: Boyfriend */}
              <div ref={bfRef} className="relative flex flex-col items-center z-20">
                {/* Speech Bubble */}
                <div 
                  ref={bfBubbleRef}
                  className="absolute -top-16 left-4 bg-zinc-900/90 border border-zinc-800 backdrop-blur-md rounded-2xl rounded-bl-none px-4 py-2 flex items-center justify-center shadow-lg transition-colors duration-300"
                >
                  <span ref={bfBubbleTextRef} className="text-lg md:text-xl font-medium">🤨❓</span>
                </div>
                
                {/* Character SVG */}
                <div className="relative rounded-2xl overflow-hidden border border-purple-500/20 p-2 bg-gradient-to-b from-purple-950/20 to-transparent">
                  <svg viewBox="0 0 120 120" className="w-24 h-24 md:w-32 md:h-32">
                    <defs>
                      <linearGradient id="bfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>
                    </defs>
                    <path d="M20,110 C20,80 40,65 60,65 C80,65 100,80 100,110 Z" fill="url(#bfGrad)" opacity="0.8" />
                    <circle cx="60" cy="45" r="22" fill="#e9d5ff" stroke="#a855f7" strokeWidth="1.5" />
                    <path d="M38,40 C38,25 50,15 70,20 C82,25 82,38 80,45 C70,35 50,38 38,40 Z" fill="#3b0764" />
                    <circle cx="52" cy="45" r="2" fill="#1e1b4b" />
                    <circle cx="68" cy="45" r="2" fill="#1e1b4b" />
                    <rect x="45" y="41" width="10" height="7" rx="1.5" fill="none" stroke="#4f46e5" strokeWidth="1.2" />
                    <rect x="65" y="41" width="10" height="7" rx="1.5" fill="none" stroke="#4f46e5" strokeWidth="1.2" />
                    <line x1="55" y1="45" x2="65" y2="45" stroke="#4f46e5" strokeWidth="1.2" />
                    <path d="M55,54 Q60,57 65,54" fill="none" stroke="#1e1b4b" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="mt-3 text-xs text-purple-400/70 font-mono tracking-wider">BOYFRIEND</div>
              </div>

              {/* 2. Ghost Particles Left Container (streams to center) */}
              <div ref={particlesLeftRef} className="absolute left-1/4 top-1/2 -translate-y-1/2 w-48 h-32 pointer-events-none z-10 flex flex-col justify-around text-[10px] font-mono text-rose-500/80">
                <span className="whitespace-nowrap">"chat_logs_syncing..."</span>
                <span className="whitespace-nowrap translate-x-4">"sentiment_score: 0.45"</span>
                <span className="whitespace-nowrap -translate-x-4">"RAG_embedding_gen..."</span>
              </div>

              {/* 3. Center Section: Relmonition Logo and Bridge */}
              <div className="relative flex flex-col items-center justify-center z-30">
                {/* Outer rotating dotted stroke circle */}
                <svg 
                  ref={logoCircleRef}
                  className="absolute w-28 h-28 md:w-36 md:h-36 pointer-events-none" 
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(168, 85, 247, 0.3)"
                    strokeWidth="1.5"
                    strokeDasharray="6 6"
                    className="origin-center"
                  />
                </svg>

                {/* Central Heart (Morph destination in Act III) */}
                <div 
                  ref={finalHeartRef}
                  className="absolute z-30 w-16 h-16 pointer-events-none flex items-center justify-center"
                >
                  <Heart className="w-12 h-12 text-rose-500 fill-rose-500 filter drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] animate-pulse" />
                </div>

                {/* Core logo frame */}
                <div 
                  ref={logoCoreRef} 
                  className="relative z-20 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl transition-all duration-300"
                >
                  <LogoIcon className="w-9 h-9 md:w-11 md:h-11 text-zinc-600 transition-colors duration-300" />
                </div>
              </div>

              {/* 4. Ghost Particles Right Container (streams to center) */}
              <div ref={particlesRightRef} className="absolute right-1/4 top-1/2 -translate-y-1/2 w-48 h-32 pointer-events-none z-10 flex flex-col justify-around text-[10px] font-mono text-rose-500/80 items-end">
                <span className="whitespace-nowrap">"mood_logged: 3/10"</span>
                <span className="whitespace-nowrap -translate-x-4">"conflict_signals_found"</span>
                <span className="whitespace-nowrap translate-x-4">"tenant_shards_locked"</span>
              </div>

              {/* 5. Right Character: Girlfriend */}
              <div ref={gfRef} className="relative flex flex-col items-center z-20">
                {/* Speech Bubble */}
                <div 
                  ref={gfBubbleRef}
                  className="absolute -top-16 right-4 bg-zinc-900/90 border border-zinc-800 backdrop-blur-md rounded-2xl rounded-br-none px-4 py-2 flex items-center justify-center shadow-lg transition-colors duration-300"
                >
                  <span ref={gfBubbleTextRef} className="text-lg md:text-xl font-medium">😤❓</span>
                </div>
                
                {/* Character SVG */}
                <div className="relative rounded-2xl overflow-hidden border border-purple-500/20 p-2 bg-gradient-to-b from-purple-950/20 to-transparent">
                  <svg viewBox="0 0 120 120" className="w-24 h-24 md:w-32 md:h-32">
                    <defs>
                      <linearGradient id="gfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                    <path d="M20,110 C20,80 40,65 60,65 C80,65 100,80 100,110 Z" fill="url(#gfGrad)" opacity="0.8" />
                    <circle cx="60" cy="45" r="22" fill="#fbcfe8" stroke="#ec4899" strokeWidth="1.5" />
                    <path d="M38,45 C38,15 82,15 82,45 C82,50 86,52 82,60 C75,55 78,35 60,35 C42,35 45,55 38,60 C34,52 38,50 38,45 Z" fill="#500724" />
                    <circle cx="52" cy="45" r="2" fill="#31102f" />
                    <circle cx="68" cy="45" r="2" fill="#31102f" />
                    <path d="M55,54 Q60,57 65,54" fill="none" stroke="#31102f" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="mt-3 text-xs text-purple-400/70 font-mono tracking-wider">GIRLFRIEND</div>
              </div>

            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION B: Infrastructure Showcase (Acts IV, V, VI)      */}
          {/* ======================================================== */}
          <div ref={infraCanvasRef} className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6 pointer-events-none">
            
            {/* Background Purple Dotted SVG Path (Vertical snaking pipeline) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <svg className="w-full h-full" viewBox="0 0 800 600" fill="none">
                <path 
                  ref={verticalPathRef}
                  d="M 400 0 L 400 130 C 400 130 350 200 240 200 C 130 200 130 280 250 280 L 400 280 L 400 480"
                  stroke="#8b5cf6" 
                  strokeWidth="3.5" 
                  strokeDasharray="8 8"
                  strokeLinecap="round"
                  className="transition-colors duration-300"
                />
              </svg>
            </div>

            {/* Title / Phase Header */}
            <div className="text-center mb-10 z-20 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/20 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                <Layers className="w-3.5 h-3.5" /> DevOps & Cloud Architecture
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-white">Sovereign Pod Deployment</h3>
            </div>

            {/* Layout Canvas: IaC Terminal (Left), AWS VPC Map (Right), EKS Cluster (Center) */}
            <div className="relative w-full max-w-5xl h-[420px] flex items-center justify-between z-10 px-4 md:px-12">
              
              {/* Act IV: IaC Configuration Pipeline */}
              <div 
                ref={terraformBlockRef}
                className="w-72 bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 shadow-2xl font-mono text-[10px] text-zinc-300 flex flex-col h-60 justify-between relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-3">
                    <span className="text-[10px] text-purple-400 font-bold tracking-wider flex items-center gap-1.5 font-sans">
                      <Terminal className="w-3.5 h-3.5 text-purple-400" /> IaC Pipeline
                    </span>
                    <span className="text-[8px] text-zinc-500 font-semibold uppercase tracking-wider bg-zinc-900 px-2 py-0.5 rounded">relmonition.tf</span>
                  </div>
                  
                  <div ref={codeLinesRef} className="flex flex-col gap-2.5 text-zinc-400">
                    <div className="text-purple-400 font-semibold flex items-center gap-1">
                      <span className="text-zinc-600">&gt;</span> $ terraform apply
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                      <span>Reading configuration...</span>
                    </div>
                    <div className="text-emerald-400/90 flex items-center gap-1.5 font-semibold mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Infrastructure Provisioned
                    </div>
                  </div>
                </div>
                
                <div className="text-[8px] text-zinc-600 text-right">
                  Module.VPC.v1.0
                </div>
              </div>

              {/* Glowing IaC Data Packets */}
              <div ref={codeParticlesRef} className="absolute left-[33%] top-[45%] -translate-y-1/2 w-44 h-28 pointer-events-none z-20 flex flex-col justify-around">
                <span className="bg-purple-900/40 border border-purple-500/30 text-purple-300 text-[8px] font-mono px-2.5 py-1 rounded-full shadow-md w-fit flex items-center gap-1">
                  <Cloud className="w-2.5 h-2.5 text-purple-400" /> vpc_core
                </span>
                <span className="bg-blue-900/40 border border-blue-500/30 text-blue-300 text-[8px] font-mono px-2.5 py-1 rounded-full shadow-md w-fit translate-x-4 flex items-center gap-1">
                  <Network className="w-2.5 h-2.5 text-blue-400" /> subnets
                </span>
                <span className="bg-emerald-900/40 border border-emerald-500/30 text-emerald-300 text-[8px] font-mono px-2.5 py-1 rounded-full shadow-md w-fit -translate-x-2 flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 text-emerald-400" /> route_tables
                </span>
              </div>

              {/* Act V: EKS Cluster Node Map (Center Stage) */}
              <div 
                ref={eksBlockRef}
                className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-80 h-80"
              >
                {/* Pulsing Path Connections in background */}
                <svg className="absolute w-full h-full pointer-events-none z-0" viewBox="0 0 320 320">
                  <defs>
                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  
                  {/* Concentric rotating rings */}
                  <circle cx="160" cy="160" r="140" fill="none" stroke="url(#ringGrad)" strokeWidth="1" strokeDasharray="6 6" opacity="0.25" />
                  
                  {/* Pulsing connection lines */}
                  <path d="M 160 160 L 55 55" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="5 5" className="animate-pulse" opacity="0.6" />
                  <path d="M 160 160 L 265 265" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="5 5" className="animate-pulse" opacity="0.6" />
                  <path d="M 160 160 L 275 160" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="5 5" className="animate-pulse" opacity="0.6" />
                </svg>

                {/* Outer Concentric Rotating Ring 1 */}
                <svg ref={eksOuterRing1Ref} className="absolute w-72 h-72 pointer-events-none" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="48" fill="none" stroke="url(#ringGrad)" strokeWidth="1" strokeDasharray="4 4" />
                </svg>

                {/* Outer Concentric Rotating Ring 2 */}
                <svg ref={eksOuterRing2Ref} className="absolute w-[320px] h-[320px] pointer-events-none" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="48" fill="none" stroke="url(#ringGrad)" strokeWidth="1" strokeDasharray="12 6" />
                </svg>

                {/* Core Cluster Emblem */}
                <div className="relative z-10 w-28 h-28 rounded-3xl bg-zinc-900/90 border border-purple-500/30 flex flex-col items-center justify-center p-4 shadow-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-purple-900/20 border border-purple-500/40 flex items-center justify-center mb-1 text-purple-400">
                    <Cpu className="w-6 h-6 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-bold text-white tracking-widest uppercase">Amazon EKS</span>
                  <span className="text-[7.5px] font-mono text-purple-500 font-semibold tracking-wider">Kubernetes v1.30</span>
                </div>

                {/* Node Groups orbiting EKS Core */}
                <div ref={computeNodesRef} className="absolute inset-0 pointer-events-none">
                  {/* Managed Node Group 1 */}
                  <div className="absolute top-4 left-6 bg-zinc-950/90 border border-zinc-800 rounded-lg px-2.5 py-1 text-[8.5px] font-mono flex items-center gap-1.5 shadow-lg">
                    <Server className="w-3.5 h-3.5 text-purple-400" />
                    <span>mng-gp-01</span>
                  </div>
                  {/* Managed Node Group 2 */}
                  <div className="absolute bottom-4 right-6 bg-zinc-950/90 border border-zinc-800 rounded-lg px-2.5 py-1 text-[8.5px] font-mono flex items-center gap-1.5 shadow-lg">
                    <Server className="w-3.5 h-3.5 text-blue-400" />
                    <span>mng-gp-02</span>
                  </div>
                  {/* Control Plane API */}
                  <div className="absolute top-1/2 -right-4 -translate-y-1/2 bg-zinc-950/90 border border-zinc-800 rounded-lg px-2.5 py-1 text-[8.5px] font-mono flex items-center gap-1.5 shadow-lg">
                    <Network className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>ControlPlane API</span>
                  </div>
                </div>
              </div>

              {/* Act IV: AWS Network Map (VPC Box) */}
              <div 
                ref={awsBlockRef}
                className="w-72 border border-dashed border-zinc-800 rounded-2xl p-5 bg-zinc-950/20 backdrop-blur-md h-60 flex flex-col justify-between shadow-2xl relative overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-zinc-900/80 pb-3 mb-3 text-zinc-400 text-[10px] font-bold tracking-wide">
                  <span className="flex items-center gap-1.5"><Cloud className="w-4 h-4 text-purple-400" /> AWS VPC core</span>
                  <span className="text-[8px] bg-purple-950/40 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded font-mono">us-east-1</span>
                </div>
                
                <div className="flex-1 grid grid-cols-2 gap-3 text-[9px] font-sans">
                  {/* Subnet A */}
                  <div className="border border-zinc-900 bg-zinc-950/40 rounded-xl p-3 flex flex-col justify-between h-24 hover:border-purple-500/20 transition-colors">
                    <span className="text-zinc-400 font-semibold flex items-center gap-1"><Network className="w-3 h-3 text-purple-400" /> Public-A</span>
                    <span className="text-[8px] text-zinc-500 font-mono">10.0.1.0/24</span>
                  </div>
                  {/* Subnet B */}
                  <div className="border border-zinc-900 bg-zinc-950/40 rounded-xl p-3 flex flex-col justify-between h-24 hover:border-blue-500/20 transition-colors">
                    <span className="text-zinc-400 font-semibold flex items-center gap-1"><Shield className="w-3 h-3 text-blue-400" /> Private-B</span>
                    <span className="text-[8px] text-zinc-500 font-mono">10.0.2.0/24</span>
                  </div>
                </div>

                <div className="text-[8px] font-mono text-zinc-600 mt-2 flex items-center justify-between">
                  <span>igw-stable</span>
                  <span>nat-active</span>
                </div>
              </div>

            </div>

            {/* ======================================================== */}
            {/* Act VI: Helm Multi-Tenant Namespaces & Pod Telemetry     */}
            {/* ======================================================== */}
            <div 
              ref={helmBlockRef}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl flex flex-col items-center z-20 pointer-events-none"
            >
              {/* Helm Ship Package Launcher */}
              <div 
                ref={helmShipRef}
                className="mb-4 bg-zinc-900/90 border border-zinc-800 rounded-full px-4 py-1.5 flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase shadow-xl"
              >
                <Layers className="w-4 h-4 text-rose-500" />
                <span>Helm Release V3.1.2</span>
              </div>

              {/* Namespaces Parallel Grid */}
              <div className="w-full grid grid-cols-2 gap-8 px-4 md:px-16">
                
                {/* 1. Monitoring Namespace */}
                <div 
                  ref={monitorNamespaceRef}
                  className="bg-purple-950/5 border border-purple-500/10 rounded-2xl p-5 flex flex-col justify-between h-32 shadow-2xl"
                >
                  <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3 pb-1.5 border-b border-purple-500/5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> NS: monitoring
                  </div>
                  <div className="flex gap-2.5 flex-wrap">
                    <div className="monitor-node bg-zinc-950/70 border border-purple-500/20 text-purple-200 px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-medium shadow-md">
                      <Activity className="w-3.5 h-3.5 text-purple-400" /> Prometheus
                    </div>
                    <div className="monitor-node bg-zinc-950/70 border border-purple-500/20 text-purple-200 px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-medium shadow-md">
                      <LineChart className="w-3.5 h-3.5 text-purple-400" /> ServiceMonitor
                    </div>
                    <div className="monitor-node bg-zinc-950/70 border border-purple-500/20 text-purple-200 px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-medium shadow-md">
                      <Layers className="w-3.5 h-3.5 text-purple-400" /> GrafanaDB
                    </div>
                  </div>
                </div>

                {/* 2. Tenant Namespace (Isolates couple database logic) */}
                <div 
                  ref={tenantNamespaceRef}
                  className="bg-blue-950/5 border border-blue-500/10 rounded-2xl p-5 flex flex-col justify-between h-32 relative shadow-2xl"
                >
                  {/* Pulsing Telemetry Bubble above Pod */}
                  <div 
                    ref={telemetryBubbleRef}
                    className="absolute -top-12 right-2 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-2xl rounded-br-none shadow-2xl flex items-center gap-1.5 text-[9px] font-mono text-cyan-400/90 whitespace-nowrap"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>:3001 API Active | :9464 Telemetry Streaming</span>
                  </div>

                  <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3 pb-1.5 border-b border-blue-500/5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> NS: tenant-p20000
                  </div>
                  
                  <div className="flex items-center">
                    <div className="tenant-pod bg-zinc-950/70 border border-blue-500/20 text-blue-200 px-4 py-2 rounded-full flex items-center gap-2.5 text-[10px] font-mono shadow-md">
                      <Shield className="w-4 h-4 text-cyan-400 animate-pulse" />
                      <span className="font-semibold text-white">relmonition-api-0b892</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
          
        </div>

        {/* Scroll spacer that sets the total timeline scroll length (Acts I to VI = 350vh spacer) */}
        <div className="h-[350vh] w-full pointer-events-none" />
      </div>

      {/* 🚀 Features Grid Section */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6 relative border-t border-white/5 bg-[#09070f]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            How Relmonition Bridges the Gap
          </h2>
          <p className="text-zinc-400 text-sm md:text-base">
            Clinically aligned tools powered by high-performance architecture, isolated data structures, and tailored AI models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Private reflection */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 hover:bg-white/[0.04] transition-all group">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 mb-6 group-hover:scale-105 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">100% Private Reflections</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Your journal entries are yours alone. Database schemas strictly filter content by user ID, meaning your partner never sees your raw writings—maintaining healthy boundaries while informing shared RAG memory.
            </p>
          </div>

          {/* Card 2: Gottman ratio */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 hover:bg-white/[0.04] transition-all group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Gottman Relationship Metrics</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Log relationship interactions to compute your dynamic Gottman positivity ratio. Track daily mood states, analyze weekly harmony health indexes, and review automated conflict resolution guidelines.
            </p>
          </div>

          {/* Card 3: AI Coach */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 hover:bg-white/[0.04] transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-105 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Contextual AI Coach</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Engage with an AI Coach that holds the context of your relationship dynamics without exposing your private entries. Get streaming guidance backed by semantic search embeddings and conversation sessions.
            </p>
          </div>

          {/* Card 4: Personality Profiling */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 hover:bg-white/[0.04] transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-105 transition-transform">
              <LineChart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Personality Synthesis</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Build a dynamic portrait of traits, likes, dislikes, triggers, and attachment styles. Compare mutual trait grids to analyze compatibility score trends and uncover personalized growth targets.
            </p>
          </div>
        </div>

        {/* Technical Architecture Details */}
        <div className="mt-16 bg-gradient-to-r from-purple-950/20 to-indigo-950/20 border border-purple-500/10 rounded-3xl p-8 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/20 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4 uppercase font-mono">
                Security Core
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">Sovereign Data Shield</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Relmonition breaks from typical central database architecture. Built from the ground up for strict isolation, your metrics are fully secure, sandboxed, and protected.
              </p>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-black/30 border border-white/5 rounded-xl p-5">
                <Database className="w-5 h-5 text-purple-400 mb-3" />
                <h4 className="text-sm font-semibold mb-2">Namespace Isolation</h4>
                <p className="text-zinc-500 text-xs">Separate AWS EKS container namespaces for absolute compute and environment partitioning.</p>
              </div>
              <div className="bg-black/30 border border-white/5 rounded-xl p-5">
                <Shield className="w-5 h-5 text-indigo-400 mb-3" />
                <h4 className="text-sm font-semibold mb-2">Turso DB Sharding</h4>
                <p className="text-zinc-500 text-xs">Dedicated SQLite database instances per couple. Zero row sharing, zero accidental access.</p>
              </div>
              <div className="bg-black/30 border border-white/5 rounded-xl p-5">
                <Lock className="w-5 h-5 text-blue-400 mb-3" />
                <h4 className="text-sm font-semibold mb-2">BYO API Keys</h4>
                <p className="text-zinc-500 text-xs">Connect your own Gemini or OpenAI API keys directly, maintaining total cryptographical control.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🧑‍💻 Portfolio ("About Me") Section */}
      <section id="aboutme" className="py-24 max-w-7xl mx-auto px-6 border-t border-white/5 bg-[#07050a]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/20 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-4 uppercase font-mono">
            The Creator
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">About The Developer</h2>
          <p className="text-zinc-400 text-sm">
            Relmonition is engineered by Pranav Dwivedi. Explore developer links and project contributions below.
          </p>
        </div>

        {/* Developer Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          
          {/* GitHub Portal */}
          <a 
            href="https://github.com/p20000" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.05] hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-600/5 transition-all group flex flex-col justify-between h-48"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 group-hover:scale-105 transition-transform mb-4">
                <Github className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">GitHub Profile</h3>
              <p className="text-zinc-500 text-xs">Browse full repositories, infrastructure scripts, and active source contributions.</p>
            </div>
            <span className="text-purple-400 text-xs font-medium inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              github.com/p20000 <ExternalLink className="w-3.5 h-3.5" />
            </span>
          </a>

          {/* LinkedIn Profile */}
          <a 
            href="https://www.linkedin.com/in/pranav-dwivedi-535658219/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.05] hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-600/5 transition-all group flex flex-col justify-between h-48"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-900/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform mb-4">
                <Linkedin className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">LinkedIn Profile</h3>
              <p className="text-zinc-500 text-xs">Connect professionally, view background updates, and check industry experience.</p>
            </div>
            <span className="text-purple-400 text-xs font-medium inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              linkedin.com/in/pranavdwivedi <ExternalLink className="w-3.5 h-3.5" />
            </span>
          </a>

          {/* Web Apps Showcase */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.05] transition-all h-48 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-purple-900/20 flex items-center justify-center text-purple-400 mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold mb-1 text-white">Full Stack Ecosystem</h3>
              <p className="text-zinc-500 text-xs mb-2">A cohesive portfolio of high-utility systems built with Next.js, Express, and Docker.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="bg-purple-900/30 border border-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded-full font-mono">Relmonition</span>
              <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full font-mono">Payground</span>
              <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full font-mono">omni-map</span>
            </div>
          </div>

        </div>

        {/* Climax Asset: Smiling Couple Closing Narrative Loop */}
        <div className="text-center mt-12 bg-gradient-to-b from-purple-950/10 to-transparent border-t border-purple-500/5 pt-12 pb-6 rounded-3xl">
          <CoupleClimaxSVG />
          <p className="mt-4 text-sm text-purple-400/80 font-medium tracking-wide">
            "Realigning partners through secure, empathetic technology."
          </p>
        </div>
      </section>

      {/* 🥾 Fixed Footer Container */}
      <footer className="w-full bg-[#050308] border-t border-white/5 py-8 px-6 text-center text-xs text-zinc-600">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LogoIcon className="w-4 h-4 text-purple-600/50" />
            <span>&copy; {new Date().getFullYear()} Relmonition. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <span className="hover:text-zinc-400 transition-colors cursor-pointer">HIPAA & GDPR Compliance Core</span>
            <span className="hover:text-zinc-400 transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-zinc-400 transition-colors cursor-pointer">Privacy Isolation Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Inline Helper: Smiling Couple Climax SVG
function CoupleClimaxSVG() {
  return (
    <svg viewBox="0 0 200 150" className="w-56 h-40 md:w-64 md:h-48 mx-auto">
      <defs>
        <linearGradient id="coupleGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="bfGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="gfGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      {/* Soft glow background */}
      <circle cx="100" cy="80" r="55" fill="url(#coupleGlow)" />
      
      {/* Boyfriend */}
      <g transform="translate(18, 15)">
        <path d="M30,120 C30,95 45,85 60,85 C75,85 90,95 90,120 Z" fill="url(#bfGrad2)" opacity="0.9" />
        <circle cx="60" cy="65" r="18" fill="#e9d5ff" stroke="#a855f7" strokeWidth="1.5" />
        <path d="M42,61 C42,48 52,38 68,43 C78,48 78,58 76,65 C68,57 52,60 42,61 Z" fill="#3b0764" />
        <circle cx="53" cy="65" r="2" fill="#1e1b4b" />
        <circle cx="67" cy="65" r="2" fill="#1e1b4b" />
        <path d="M56,73 Q60,76 64,73" fill="none" stroke="#1e1b4b" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Girlfriend */}
      <g transform="translate(58, 15)">
        <path d="M30,120 C30,95 45,85 60,85 C75,85 90,95 90,120 Z" fill="url(#gfGrad2)" opacity="0.9" />
        <circle cx="60" cy="65" r="18" fill="#fbcfe8" stroke="#ec4899" strokeWidth="1.5" />
        <path d="M42,65 C42,40 78,40 78,65 C78,70 81,71 78,78 C72,74 74,57 60,57 C46,57 48,74 42,78 C39,71 42,70 42,65 Z" fill="#500724" />
        <circle cx="53" cy="65" r="2" fill="#31102f" />
        <circle cx="67" cy="65" r="2" fill="#31102f" />
        <path d="M56,73 Q60,76 64,73" fill="none" stroke="#31102f" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Floating Heart */}
      <g transform="translate(100, 30) scale(0.6)">
        <path d="M12,5 C12,5 10,2 6,2 C2,2 0,5 0,9 C0,14 6,18 12,21 C18,18 24,14 24,9 C24,5 22,2 18,2 C14,2 12,5 12,5 Z" fill="#f43f5e" />
      </g>
    </svg>
  );
}
