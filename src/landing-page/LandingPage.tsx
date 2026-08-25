import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BrandHeader } from './components/BrandHeader';
import { LandingFooter } from './components/LandingFooter';
import { PlayStoreBadge } from './components/PlayStoreBadge';
import { ArrowRight, MapPin, Trophy, Zap, Flame, Award, Sparkles } from 'lucide-react';
import campusBg from '../assets/campus-bg.jpg';

export const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    url: 'https://share.google/HiHUihh8GDEdfmdOA',
    ariaLabel: 'JJCET & PragatiX on Facebook',
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    name: 'Instagram',
    url: 'https://share.google/juGc3qLgc5vFllLm1',
    ariaLabel: 'JJCET & PragatiX on Instagram',
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    url: 'https://in.linkedin.com/school/jj-college-of-engineering-and-technology/',
    ariaLabel: 'JJCET & PragatiX on LinkedIn',
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
    ),
  },
  {
    name: 'YouTube',
    url: 'https://share.google/1dOQhE78x0gWEDIJ1',
    ariaLabel: 'JJCET on YouTube',
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
];

export const LandingPage: React.FC = () => {
  useEffect(() => {
    document.title = "PragatiX — JJCET's Student Growth & Gamified XP Platform";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "PragatiX is J.J. College of Engineering and Technology's gamified Student Performance and Development Management System.");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative text-slate-900 font-sans selection:bg-indigo-500 selection:text-white bg-[#F8FAFC]">
      
      {/* 1. Header with Brand Lockup & Log in CTA */}
      <BrandHeader showLoginButton={true} />

      <main className="flex-1 flex flex-col justify-center">
        
        {/* 2. Split Hero Section (Gamified Text / Campus Visual) */}
        <section className="relative overflow-hidden py-10 sm:py-16 lg:py-20">
          
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-100/40 via-sky-50/20 to-transparent -z-10 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column (Gamified Content & CTA) - 7 Columns */}
              <div className="lg:col-span-7 space-y-6 sm:space-y-7 text-left">
                
                {/* Gamified Hero Pill */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-indigo-200 text-indigo-900 text-xs font-extrabold shadow-xs relative overflow-hidden group">
                  <div className="absolute inset-0 bg-amber-400/10 rounded-full animate-pulse-glow" />
                  <Flame className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0 relative z-10 animate-bounce" />
                  <span className="relative z-10">Gamified Student Progression & Skill Engine</span>
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                  Every step forward, <span className="bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">level up your XP.</span>
                </h1>

                {/* Subhead */}
                <p className="text-slate-600 text-base sm:text-lg max-w-xl font-medium leading-relaxed">
                  PragatiX turns your academics, skills, leadership, and growth into one clear gamified journey — earn XP for everything that makes you industry-ready, and climb the leaderboard in real time!
                </p>

                {/* Floating Gamified Badges Strip */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shadow-2xs">
                    <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
                    <span>+150 XP Per Activity</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold shadow-2xs">
                    <Trophy className="w-3.5 h-3.5 text-indigo-600" />
                    <span>5 Progression Stages</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold shadow-2xs">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <span>20+ Skill Badges</span>
                  </div>
                </div>

                {/* Primary Action Button (Routes to /login) */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-2xl text-base font-extrabold shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all duration-200 group cursor-pointer"
                  >
                    <span>Enter PragatiX Portal</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                {/* Get the App & Google Play Badge */}
                <div className="pt-2 flex flex-col items-start gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Also available on Android
                  </span>
                  <PlayStoreBadge />
                </div>

                {/* Institutional Social Channels */}
                <div className="pt-2 flex items-center gap-3.5">
                  {SOCIAL_LINKS.map((item) => (
                    <a
                      key={item.name}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.ariaLabel}
                      className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:scale-110 active:scale-95 transition-all duration-200"
                    >
                      {item.icon}
                    </a>
                  ))}
                </div>

              </div>

              {/* Right Column (Moving HD Campus Image & Gamified Overlay Badges) - 5 Columns */}
              <div className="lg:col-span-5 relative">
                
                {/* Visual Frame Container */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 group aspect-4/5 sm:aspect-1/1 lg:aspect-3/4 max-w-lg mx-auto">
                  
                  {/* Moving High-Definition Campus Photo */}
                  <img
                    src={campusBg}
                    alt="J.J. College of Engineering and Technology Campus Building"
                    className="w-full h-full object-cover object-top sm:object-center animate-campus-movement brightness-100 contrast-105"
                    loading="eager"
                  />

                  {/* Floating Gamified XP Card Overlay (Top Right) */}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md border border-white/60 p-3 rounded-2xl shadow-xl flex items-center gap-3 text-left animate-float-slow z-20">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300 flex items-center justify-center text-amber-600 shrink-0">
                      <Trophy className="w-5 h-5 fill-amber-400" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Top Performer</div>
                      <div className="text-xs font-black text-slate-900">Stage 4 Squad Leader</div>
                      <div className="text-[11px] font-extrabold text-amber-600">2,450 XP Points</div>
                    </div>
                  </div>

                  {/* Gentle Gradient at bottom for text badge */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/10 pointer-events-none" />

                  {/* Campus Location Badge Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-5 p-3.5 sm:p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-white/60 shadow-lg text-left">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-xs">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>J.J. College of Engineering and Technology</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 hidden sm:inline-block">
                        Autonomous
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 font-medium leading-relaxed">
                      Ammapettai, Poolangulathupatti Post, NH-45 (Trichy–Dindigul Highway), Tiruchirappalli, Tamil Nadu – 620009
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-indigo-600">
                      <a
                        href="https://www.google.com/maps/place/J.J.+College+of+Engineering+and+Technology/@10.7275908,78.5608574,218m/data=!3m1!1e3!4m6!3m5!1s0x3baa672ea9836699:0x7fe0abc63dbbca35!8m2!3d10.7276946!4d78.5610385!16s%2Fm%2F027xtyh!5m1!1e4?entry=ttu&g_ep=EgoyMDI2MDgxMi4wIKXMDSoASAFQAw%3D%3D"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-indigo-800 transition-colors"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>View on Map</span>
                      </a>
                      <a
                        href="https://jjcet.ac.in/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-indigo-800 transition-colors"
                      >
                        <span>Official Website</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>

        </section>

        {/* Infinite Live Activity Marquee Ticker */}
        <div className="py-4 bg-[#0B132B] text-slate-200 border-y border-slate-800 overflow-hidden relative">
          <div className="flex animate-marquee items-center space-x-8 whitespace-nowrap text-xs font-bold">
            <span className="flex items-center gap-2 text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              <Zap className="w-3.5 h-3.5 fill-amber-400" />
              John Doe (CSE) earned +150 XP for Hackathon Submission
            </span>
            <span className="flex items-center gap-2 text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20">
              <Flame className="w-3.5 h-3.5 fill-blue-400" />
              Captain Sarah unlocked a 10-Day Streak!
            </span>
            <span className="flex items-center gap-2 text-purple-400 bg-purple-400/10 px-3 py-1 rounded-full border border-purple-400/20">
              <Trophy className="w-3.5 h-3.5 text-purple-400" />
              ECE Department reached Stage 4 Squad Leader Standing
            </span>
            <span className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              Class 3B achieved 98.5% Verified Period Attendance
            </span>
            <span className="flex items-center gap-2 text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              <Zap className="w-3.5 h-3.5 fill-amber-400" />
              John Doe (CSE) earned +150 XP for Hackathon Submission
            </span>
            <span className="flex items-center gap-2 text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20">
              <Flame className="w-3.5 h-3.5 fill-blue-400" />
              Captain Sarah unlocked a 10-Day Streak!
            </span>
            <span className="flex items-center gap-2 text-purple-400 bg-purple-400/10 px-3 py-1 rounded-full border border-purple-400/20">
              <Trophy className="w-3.5 h-3.5 text-purple-400" />
              ECE Department reached Stage 4 Squad Leader Standing
            </span>
            <span className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              Class 3B achieved 98.5% Verified Period Attendance
            </span>
          </div>
        </div>

        {/* 3. GAMIFIED 5-STAGE PROGRESSION ROADMAP SHOWCASE */}
        <section className="py-12 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            <div className="max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Level Roadmap</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">5 Stage Progression System</h2>
              <p className="text-sm font-medium text-slate-600">Advance through stage levels by earning XP from academic performance, skill workshops, and co-curricular leadership.</p>
            </div>

            {/* 5 Stages Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-left">
              {/* Stage 1 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 relative flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">Stage 1</span>
                  <span className="text-xs font-black text-slate-500">0 XP</span>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700 font-bold mb-2">
                    🛡️
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Foundation Novice</h4>
                  <p className="text-xs text-slate-500 mt-1">Initial onboarding and baseline academic registration.</p>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-slate-500 h-full w-full" />
                </div>
              </div>

              {/* Stage 2 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 relative flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">Stage 2</span>
                  <span className="text-xs font-black text-blue-700">500 XP</span>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold mb-2">
                    🚀
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Active Explorer</h4>
                  <p className="text-xs text-slate-500 mt-1">Consistent attendance & first skill workshop activities.</p>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full w-3/4" />
                </div>
              </div>

              {/* Stage 3 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-indigo-200 relative flex flex-col justify-between space-y-3 ring-2 ring-indigo-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">Stage 3</span>
                  <span className="text-xs font-black text-indigo-700">1,500 XP</span>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mb-2">
                    ⚡
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Skill Innovator</h4>
                  <p className="text-xs text-slate-500 mt-1">Hackathons, project submissions & active squad participation.</p>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full w-1/2" />
                </div>
              </div>

              {/* Stage 4 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-purple-200 relative flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">Stage 4</span>
                  <span className="text-xs font-black text-purple-700">3,000 XP</span>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold mb-2">
                    👑
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Squad Leader</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Captain/Vice Captain squad mentorship & high performance.</p>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full w-1/3" />
                </div>
              </div>

              {/* Stage 5 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-amber-200 relative flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">Stage 5</span>
                  <span className="text-xs font-black text-amber-700">5,000+ XP</span>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold mb-2">
                    🏆
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Master Legend</h4>
                  <p className="text-xs text-slate-500 mt-1">Top departmental standing & institutional honors.</p>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-1/4" />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 4. GAMIFIED PODIUM SHOWCASE & BADGES PREVIEW */}
        <section className="py-12 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              
              {/* Left Column: Leaderboard Podium Visual Card */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-lg text-left space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">Live Rankings</span>
                    <h3 className="text-xl font-black text-slate-900 mt-1">Department Leaderboard</h3>
                  </div>
                  <Trophy className="w-8 h-8 text-amber-500" />
                </div>

                {/* Podium Top 3 Items */}
                <div className="space-y-3">
                  {/* #1 Gold */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-400 text-amber-950 font-black text-sm flex items-center justify-center shadow-xs">
                        #1
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Student Captain</h4>
                        <p className="text-[11px] font-medium text-slate-500">Computer Science &bull; 3rd Year</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-amber-700 bg-amber-100 px-3 py-1 rounded-lg">2,450 XP</span>
                  </div>

                  {/* #2 Silver */}
                  <div className="p-3.5 rounded-2xl bg-slate-100/60 border border-slate-300 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-300 text-slate-800 font-black text-sm flex items-center justify-center shadow-xs">
                        #2
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Vice Captain</h4>
                        <p className="text-[11px] font-medium text-slate-500">ECE &bull; 3rd Year</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-slate-700 bg-slate-200 px-3 py-1 rounded-lg">2,180 XP</span>
                  </div>

                  {/* #3 Bronze */}
                  <div className="p-3.5 rounded-2xl bg-amber-900/5 border border-amber-800/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-700 text-white font-black text-sm flex items-center justify-center shadow-xs">
                        #3
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Active Squad Lead</h4>
                        <p className="text-[11px] font-medium text-slate-500">Mechanical &bull; 4th Year</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-amber-800 bg-amber-100 px-3 py-1 rounded-lg">1,940 XP</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Achievements & Badges Showcase */}
              <div className="text-left space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 mb-2">
                    <Award className="w-3.5 h-3.5" />
                    <span>Gamified Rewards</span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Earn Badges for Every Milestone</h3>
                  <p className="text-sm font-medium text-slate-600 mt-1">Unlock official institution badges for attendance consistency, peer mentorship, hackathons, and leadership roles.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center gap-3 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg shrink-0">
                      🔥
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">Streak Master</h5>
                      <p className="text-[11px] text-slate-500 font-medium">10 Days Continuous XP</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center gap-3 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                      ⭐
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">Top Attendee</h5>
                      <p className="text-[11px] text-slate-500 font-medium">95%+ Class Attendance</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center gap-3 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg shrink-0">
                      👑
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">Squad Captain</h5>
                      <p className="text-[11px] text-slate-500 font-medium">Team Leader Role</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center gap-3 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-lg shrink-0">
                      🎯
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">Code Innovator</h5>
                      <p className="text-[11px] text-slate-500 font-medium">Technical Submissions</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 5. Trust Line */}
        <div className="py-6 bg-white border-t border-slate-200/80 text-center px-4 sm:px-6">
          <p className="max-w-3xl mx-auto text-xs sm:text-sm font-semibold text-slate-600 leading-relaxed">
            Built for JJCET, administered by the Sowdambikaa Group of Institutions — this isn't a third-party app bolted onto college life. It's how JJCET tracks and celebrates your growth, officially.
          </p>
        </div>

      </main>

      {/* 6. Shared Footer */}
      <LandingFooter />

    </div>
  );
};

export default LandingPage;
