// Official ECONVYX AI Brand Logo Component
// Implements the exact visual identity from the official reference image:
// - Futuristic geometric abstract symbol with bright turquoise/cyan gradient strokes
// - Subtle orange/yellow glowing accent where geometric strokes intersect
// - ECONVYX in bold, clean, modern white uppercase letters
// - Stylized X with cyan & orange diagonal strokes
// - AI below ECONVYX in cyan uppercase letters flanked by thin cyan horizontal lines
// - Deep dark navy background with responsive horizontal & stacked layouts

import React from 'react';

interface LogoProps {
  variant?: 'dark' | 'transparent';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  layout?: 'horizontal' | 'stacked';
  iconOnly?: boolean;
  className?: string;
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'transparent',
  size = 'md',
  layout = 'horizontal',
  iconOnly = false,
  className = '',
  showTagline = false,
}) => {
  // Dimension mappings
  const dimensions = {
    sm: {
      icon: 'w-7 h-7',
      horizontal: 'h-8',
      stacked: 'w-24',
      text: 'text-base',
      aiText: 'text-[10px]',
      lineWidth: 'w-8',
    },
    md: {
      icon: 'w-9 h-9',
      horizontal: 'h-10',
      stacked: 'w-36',
      text: 'text-xl',
      aiText: 'text-xs',
      lineWidth: 'w-12',
    },
    lg: {
      icon: 'w-12 h-12',
      horizontal: 'h-14',
      stacked: 'w-48',
      text: 'text-2xl',
      aiText: 'text-sm',
      lineWidth: 'w-16',
    },
    xl: {
      icon: 'w-20 h-20',
      horizontal: 'h-20',
      stacked: 'w-64',
      text: 'text-3xl',
      aiText: 'text-base',
      lineWidth: 'w-20',
    },
  };

  const dim = dimensions[size];

  // 1. ICON ONLY (Compact for collapsed sidebar, mobile nav, favicon)
  if (iconOnly) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 rounded-xl overflow-hidden ${dim.icon} ${
          variant === 'dark' ? 'bg-[#030514] p-1 border border-[#17283D]' : ''
        } ${className}`}
        title="ECONVYX AI"
      >
        <img
          src="/logo-icon.svg"
          alt="ECONVYX AI Symbol"
          className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(0,215,208,0.4)]"
        />
      </div>
    );
  }

  // 2. STACKED LAYOUT (Exact match to reference image: Symbol on top, ECONVYX, — AI —)
  if (layout === 'stacked') {
    return (
      <div
        className={`flex flex-col items-center text-center select-none ${
          variant === 'dark' ? 'bg-[#030514] p-6 rounded-2xl border border-[#17283D] shadow-2xl' : ''
        } ${className}`}
      >
        {/* Futuristic Geometric Abstract Symbol */}
        <div className="relative mb-3 flex items-center justify-center">
          <img
            src="/logo-icon.svg"
            alt="ECONVYX AI Emblem"
            className={`${dim.icon === 'w-7 h-7' ? 'w-12 h-12' : dim.icon === 'w-9 h-9' ? 'w-16 h-16' : 'w-24 h-24'} object-contain filter drop-shadow-[0_0_12px_rgba(0,215,208,0.45)]`}
          />
        </div>

        {/* Wordmark: ECONVY + Stylized X */}
        <div className="flex items-center tracking-widest leading-none">
          <span className={`font-black text-white ${dim.text}`}>
            ECONVY
          </span>
          {/* Stylized X (Cyan top & backslash, Orange bottom-right) */}
          <span className={`font-black relative inline-flex items-center ml-0.5 ${dim.text}`}>
            <span className="text-[#00f0ff] drop-shadow-[0_0_6px_rgba(0,240,255,0.6)]">
              X
            </span>
            {/* Subtle Orange Accent overlay on bottom-right of X */}
            <span
              className="absolute right-0 bottom-0 text-[#ff9e1b] pointer-events-none drop-shadow-[0_0_8px_rgba(255,158,27,0.7)]"
              style={{
                clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)',
              }}
            >
              X
            </span>
          </span>
        </div>

        {/* Subtitle: — AI — with glowing cyan horizontal lines */}
        <div className="flex items-center justify-center gap-2 mt-2 w-full">
          <div className={`h-[1.5px] bg-gradient-to-r from-transparent to-[#00f0ff] ${dim.lineWidth} shadow-[0_0_6px_#00f0ff]`} />
          <span
            className={`font-bold tracking-[0.3em] text-[#00f0ff] ${dim.aiText} drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]`}
          >
            AI
          </span>
          <div className={`h-[1.5px] bg-gradient-to-l from-transparent to-[#00f0ff] ${dim.lineWidth} shadow-[0_0_6px_#00f0ff]`} />
        </div>

        {showTagline && (
          <p className="text-[11px] text-slate-400 font-medium tracking-normal mt-2">
            Turn financial complexity into clarity.
          </p>
        )}      </div>
    );
  }

  // 3. HORIZONTAL LAYOUT (Responsive Navbar & Sidebar lockup)
  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${
        variant === 'dark' ? 'bg-[#030514] px-3 py-2 rounded-xl border border-[#17283D]' : ''
      } ${className}`}
    >
      {/* Symbol on Left */}
      <div className={`relative shrink-0 flex items-center justify-center ${dim.icon}`}>
        <img
          src="/logo-icon.svg"
          alt="ECONVYX AI Emblem"
          className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(0,215,208,0.4)]"
        />
      </div>

      {/* Typography on Right */}
      <div className="flex flex-col justify-center">
        {/* ECONVY + Stylized X */}
        <div className="flex items-center tracking-wider leading-none">
          <span className={`font-black text-white ${dim.text}`}>
            ECONVY
          </span>
          <span className={`font-black relative inline-flex items-center ml-0.5 ${dim.text}`}>
            <span className="text-[#00f0ff] drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]">
              X
            </span>
            <span
              className="absolute right-0 bottom-0 text-[#ff9e1b] pointer-events-none drop-shadow-[0_0_6px_rgba(255,158,27,0.7)]"
              style={{
                clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)',
              }}
            >
              X
            </span>
          </span>
        </div>

        {/* — AI — with horizontal lines */}
        <div className="flex items-center gap-1.5 mt-1">
          <div className="h-[1px] w-6 bg-gradient-to-r from-transparent to-[#00f0ff] shadow-[0_0_4px_#00f0ff]" />
          <span className="text-[9px] font-bold tracking-[0.25em] text-[#00f0ff] drop-shadow-[0_0_6px_rgba(0,240,255,0.7)]">
            AI
          </span>
          <div className="h-[1px] w-6 bg-gradient-to-l from-transparent to-[#00f0ff] shadow-[0_0_4px_#00f0ff]" />
        </div>
      </div>
    </div>
  );
};
