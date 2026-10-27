import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  showTagline?: boolean;
  className?: string;
}

export const MasterPlayLogo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  showTagline = true,
  className = '',
}) => {
  const iconDimensions = {
    sm: { width: 36, height: 36, scale: 0.7 },
    md: { width: 50, height: 50, scale: 1 },
    lg: { width: 72, height: 72, scale: 1.4 },
    xl: { width: 100, height: 100, scale: 1.9 },
  }[size];

  const textSize = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Crown & M-Controller Emblem */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={iconDimensions.width}
          height={iconDimensions.height}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]"
        >
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0B0F19" />
            </linearGradient>
          </defs>

          {/* 5-Point Golden Crown */}
          <path
            d="M20 30L26 44L50 22L74 44L80 30L70 48H30L20 30Z"
            fill="url(#goldGrad)"
            stroke="#FEF08A"
            strokeWidth="1.5"
          />
          {/* Crown Jewels */}
          <circle cx="20" cy="28" r="2.5" fill="#FEF08A" />
          <circle cx="35" cy="33" r="2" fill="#FEF08A" />
          <circle cx="50" cy="20" r="3.5" fill="#FFFFFF" />
          <circle cx="65" cy="33" r="2" fill="#FEF08A" />
          <circle cx="80" cy="28" r="2.5" fill="#FEF08A" />

          {/* Golden 'M' Shield Container */}
          <path
            d="M22 45L50 38L78 45V68C78 80 50 94 50 94C50 94 22 80 22 68V45Z"
            fill="url(#shieldGrad)"
            stroke="url(#goldGrad)"
            strokeWidth="3.5"
          />

          {/* Stylized M-Wings */}
          <path
            d="M30 52L42 72L50 60L58 72L70 52"
            stroke="url(#goldGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* White Game Controller in Center */}
          <g transform="translate(32, 60) scale(0.65)">
            <rect x="0" y="2" width="56" height="34" rx="14" fill="#FFFFFF" />
            {/* D-pad */}
            <path
              d="M16 11V27M8 19H24"
              stroke="#0F172A"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Buttons */}
            <circle cx="38" cy="15" r="2.5" fill="#EF4444" />
            <circle cx="46" cy="19" r="2.5" fill="#F59E0B" />
            <circle cx="38" cy="23" r="2.5" fill="#10B981" />
            <circle cx="42" cy="11" r="2" fill="#3B82F6" />
          </g>
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col">
        <div className="flex items-baseline leading-none tracking-tight">
          <span className={`font-black text-white ${textSize} tracking-wider`}>MASTER</span>
          <span className={`font-black text-[#FBBF24] ml-1.5 ${textSize} tracking-wider`}>PLAY</span>
        </div>

        {showTagline && (
          <div className="text-[11px] font-bold text-amber-400 tracking-wider flex items-center gap-1 mt-0.5">
            <span>Kèkè Challenge</span>
          </div>
        )}

        {showSubtitle && (
          <div className="text-[9px] text-slate-400 tracking-widest mt-0.5 whitespace-nowrap font-medium">
            Jwe • Konpetisyon • Pataje • Peye
          </div>
        )}
      </div>
    </div>
  );
};
