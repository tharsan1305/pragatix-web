import React from 'react';
import { Link } from 'react-router-dom';
import jjcetOfficialLogo from '../../assets/jjcet-logo.png';
import sowdambikaaLogo from '../../assets/sowdambikaa-logo.png';
import pragatixLogo from '../../assets/logo.png';

interface BrandHeaderProps {
  showLoginButton?: boolean;
}

export const JJCET_LOGO_PATH = jjcetOfficialLogo;
export const SOWDAMBIKAA_LOGO_PATH = sowdambikaaLogo;
export const PRAGATIX_LOGO_PATH = pragatixLogo;

export const BrandHeader: React.FC<BrandHeaderProps> = ({ showLoginButton = true }) => {
  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between">
        
        {/* Three-Way Brand Lockup */}
        <div className="flex items-center gap-3 sm:gap-5 md:gap-6 py-2">
          {/* 1. JJCET Official College Logo */}
          <a
            href="https://jjcet.ac.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center group transition-transform duration-200 hover:opacity-95"
            title="J.J. College of Engineering and Technology - Official Website"
          >
            <img
              src={JJCET_LOGO_PATH}
              alt="J.J. College of Engineering and Technology logo"
              className="h-10 sm:h-14 md:h-16 w-auto object-contain"
              loading="eager"
            />
          </a>

          {/* Divider */}
          <div className="h-8 sm:h-12 w-[1px] bg-slate-300/80 hidden sm:block" aria-hidden="true" />

          {/* 2. Sowdambikaa Group of Institutions Logo */}
          <div className="flex items-center">
            <img
              src={SOWDAMBIKAA_LOGO_PATH}
              alt="Sowdambikaa Group of Institutions logo"
              className="h-10 sm:h-14 md:h-16 w-auto object-contain"
              loading="eager"
            />
          </div>

          {/* Divider */}
          <div className="h-8 sm:h-12 w-[1px] bg-slate-300/80 hidden sm:block" aria-hidden="true" />

          {/* 3. PragatiX Product Logo */}
          <Link
            to="/"
            className="flex items-center group transition-transform duration-200 hover:scale-105"
            title="PragatiX - Student Performance & Development Platform"
          >
            <img
              src={PRAGATIX_LOGO_PATH}
              alt="PragatiX logo"
              className="h-11 sm:h-15 md:h-17 w-auto object-contain"
              loading="eager"
            />
          </Link>
        </div>

        {/* Header Action Button */}
        <div>
          {showLoginButton ? (
            <Link
              to="/login"
              className="type-btn inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all duration-200 cursor-pointer"
            >
              Log in
            </Link>
          ) : (
            <Link
              to="/"
              className="type-nav inline-flex items-center text-slate-600 hover:text-indigo-600 transition-colors"
            >
              ← Back to Home
            </Link>
          )}
        </div>

      </div>
    </header>
  );
};

export default BrandHeader;
