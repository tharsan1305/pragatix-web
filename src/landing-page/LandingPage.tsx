import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BrandHeader } from './components/BrandHeader';
import { LandingFooter } from './components/LandingFooter';
import { PlayStoreBadge } from './components/PlayStoreBadge';
import { ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
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
    document.title = "PragatiX — JJCET's Student Growth & Performance Platform";
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
        
        {/* 2. Split Hero Section (Half Text / Half Vibrant Campus Visual) */}
        <section className="relative overflow-hidden py-10 sm:py-16 lg:py-20">
          
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-indigo-100/40 via-sky-50/20 to-transparent -z-10 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column (Content & CTA) - 7 Columns */}
              <div className="lg:col-span-7 space-y-6 sm:space-y-7 text-left">
                
                {/* Trust Pill */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-indigo-200 text-indigo-900 type-caption font-bold shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Official Institutional Performance & Development Platform</span>
                </div>

                {/* Headline */}
                <h1 className="type-display text-slate-900 tracking-tight">
                  Every step forward, counted.
                </h1>

                {/* Subhead */}
                <p className="type-body-lg text-slate-600 max-w-xl">
                  PragatiX turns your academics, skills, leadership, and growth into one clear journey — earn XP for everything that makes you industry-ready, and watch it add up in real time.
                </p>

                {/* Primary Action Button (Routes to /login) */}
                <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <Link
                    to="/login"
                    className="type-btn inline-flex items-center justify-center gap-2.5 px-8 py-4 text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-2xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all duration-200 group cursor-pointer"
                  >
                    <span>Log in to PragatiX</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                {/* Get the App & Google Play Badge */}
                <div className="pt-4 flex flex-col items-start gap-2.5">
                  <span className="type-caption font-bold uppercase tracking-wider text-slate-400">
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

              {/* Right Column (Vibrant Half-Seen Moving Campus Image) - 5 Columns */}
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

                  {/* Gentle Gradient at bottom for text badge */}
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-black/10 pointer-events-none" />

                  {/* Campus Location Badge Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-5 p-3.5 sm:p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-white/60 shadow-lg text-left">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-indigo-600 font-bold type-caption">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>J.J. College of Engineering and Technology</span>
                      </div>
                      <span className="type-fine uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 hidden sm:inline-block">
                        Autonomous
                      </span>
                    </div>
                    <p className="type-fine text-slate-600 mt-1 font-medium leading-relaxed">
                      Ammapettai, Poolangulathupatti Post, NH-45 (Trichy–Dindigul Highway), Tiruchirappalli, Tamil Nadu – 620009
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between type-fine font-bold text-indigo-600">
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

                {/* Decorative Background Accent */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl -z-10 pointer-events-none" />

              </div>

            </div>
          </div>

        </section>

        {/* 3. Trust Line */}
        <div className="py-6 bg-white border-t border-slate-200/80 text-center px-4 sm:px-6">
          <p className="max-w-3xl mx-auto type-body-sm font-semibold text-slate-600 leading-relaxed">
            Built for JJCET, administered by the Sowdambikaa Group of Institutions — this isn't a third-party app bolted onto college life. It's how JJCET tracks and celebrates your growth, officially.
          </p>
        </div>

      </main>

      {/* 4. Shared Footer */}
      <LandingFooter />

    </div>
  );
};

export default LandingPage;
