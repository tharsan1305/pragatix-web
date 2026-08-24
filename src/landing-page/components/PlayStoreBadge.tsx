import React from 'react';

interface PlayStoreBadgeProps {
  url?: string;
  className?: string;
}

// Configurable Play Store URL Placeholder
export const PLAYSTORE_URL = 'https://play.google.com/store/apps/details?id=com.jjcet.pragatix';

export const PlayStoreBadge: React.FC<PlayStoreBadgeProps> = ({
  url = PLAYSTORE_URL,
  className = ''
}) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Get PragatiX on Google Play"
      className={`inline-flex items-center gap-3 bg-black text-white px-5 py-2.5 rounded-xl border border-slate-700 shadow-md hover:bg-slate-900 active:scale-95 transition-all duration-200 group ${className}`}
    >
      {/* Official Google Play Vector Icon */}
      <svg
        className="w-7 h-7 shrink-0"
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M325.3 234.3L104.6 13l280.8 161.2-60.1 59.9zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm338.4 337.8L104.6 499l220.7-221.3 60.1 60.1zM483.5 235.5l-63.7-36.6-70.4 70.4 70.4 70.4 63.7-36.6c18.5-10.6 28.5-27.6 28.5-43.8s-10-33.2-28.5-43.8z"
          fill="url(#gpGradient)"
        />
        <defs>
          <linearGradient
            id="gpGradient"
            x1="25.3"
            y1="256"
            x2="512"
            y2="256"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#00E676" />
            <stop offset="0.33" stopColor="#00B0FF" />
            <stop offset="0.66" stopColor="#FF3D00" />
            <stop offset="1" stopColor="#FFC400" />
          </linearGradient>
        </defs>
      </svg>

      <div className="flex flex-col text-left">
        <span className="type-fine uppercase font-semibold text-slate-300 tracking-wider leading-none">
          GET IT ON
        </span>
        <span className="type-h4 text-white tracking-tight leading-tight">
          Google Play
        </span>
      </div>
    </a>
  );
};

export default PlayStoreBadge;
