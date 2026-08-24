import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Globe, ExternalLink } from 'lucide-react';

interface PolicyLink {
  label: string;
  path: string;
  externalUrl: string;
}

const POLICY_LINKS: PolicyLink[] = [
  { label: 'Contact Us', path: '/contact', externalUrl: 'https://www.pragatix.in/contact' },
  { label: 'Terms of Service', path: '/terms', externalUrl: 'https://www.pragatix.in/terms' },
  { label: 'Privacy Policy', path: '/privacy', externalUrl: 'https://www.pragatix.in/privacy' },
  { label: 'Security', path: '/security', externalUrl: 'https://www.pragatix.in/security' },
  { label: 'Cookie & Tracking Policy', path: '/cookies', externalUrl: 'https://www.pragatix.in/cookies' },
  { label: 'DPDP Compliance', path: '/dpdp-compliance', externalUrl: 'https://www.pragatix.in/dpdp-compliance' },
  { label: 'Account & Data Deletion', path: '/data-deletion', externalUrl: 'https://www.pragatix.in/data-deletion' },
  { label: 'Disclaimer', path: '/disclaimer', externalUrl: 'https://www.pragatix.in/disclaimer' },
  { label: 'Data Safety Policy', path: '/data-safety', externalUrl: 'https://www.pragatix.in/data-safety' },
];

export const LandingFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-slate-900 text-slate-400 border-t border-slate-800 type-fine">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-8">
        
        {/* Row 1 — Policy Links */}
        <nav aria-label="Footer Policy Links" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {POLICY_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className="type-caption text-slate-300 hover:text-white transition-colors duration-150 font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Divider */}
        <div className="w-full h-[1px] bg-slate-800" aria-hidden="true" />

        {/* Row 2 — Campus Location & Quick Links */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left bg-slate-950/50 p-5 sm:p-6 rounded-2xl border border-slate-800/80">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center justify-center md:justify-start gap-2 text-slate-200 type-caption font-bold">
              <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>J.J. College of Engineering and Technology (Autonomous)</span>
            </div>
            <p className="type-fine text-slate-400 leading-relaxed">
              Ammapettai Village, Poolangulathupatti Post, NH-45 (Tiruchirappalli–Dindigul National Highway), Tiruchirappalli, Tamil Nadu – 620009 <span className="text-slate-500">(18 km from Trichy city)</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 shrink-0">
            <a
              href="https://jjcet.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="type-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all shadow-xs"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Official Website</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            <a
              href="https://www.google.com/maps/place/J.J.+College+of+Engineering+and+Technology/@10.7275908,78.5608574,218m/data=!3m1!1e3!4m6!3m5!1s0x3baa672ea9836699:0x7fe0abc63dbbca35!8m2!3d10.7276946!4d78.5610385!16s%2Fm%2F027xtyh!5m1!1e4?entry=ttu&g_ep=EgoyMDI2MDgxMi4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="type-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all shadow-xs"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span>View on Map</span>
              <ExternalLink className="w-3 h-3 text-indigo-400" />
            </a>
          </div>
        </div>

        {/* Row 3 — Institutional Copyright & Attribution */}
        <div className="text-center text-slate-400 type-fine leading-relaxed max-w-4xl mx-auto">
          © {currentYear} PragatiX ·{' '}
          <a
            href="https://jjcet.ac.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-200 hover:text-white underline underline-offset-4 decoration-slate-600 transition-colors font-semibold"
          >
            J.J. College of Engineering and Technology
          </a>{' '}
          · Administered by Sowdambikaa Group of Institutions
        </div>

      </div>
    </footer>
  );
};

export default LandingFooter;
