import React from 'react';

interface JuspayLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  className?: string;
  withGlow?: boolean;
  withText?: boolean;
  textClassName?: string;
  subtextClassName?: string;
}

export const JuspayLogo: React.FC<JuspayLogoProps> = ({
  size = 'md',
  className = '',
  withGlow = false,
  withText = false,
  textClassName = '',
  subtextClassName = '',
}) => {
  const sizeMap: Record<string, string> = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
  };

  const isNumeric = typeof size === 'number';
  const dimClass = isNumeric ? '' : (sizeMap[size] || sizeMap.md);
  const inlineStyle = isNumeric ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <div className={`inline-flex items-center gap-3 juspay-logo-trigger ${className}`}>
      <div 
        style={inlineStyle}
        className={`relative ${dimClass} shrink-0 select-none flex items-center justify-center`}
      >
        {withGlow && (
          <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-xl animate-pulse pointer-events-none" />
        )}

        {/* 3D Emerald & Gold Hexagonal JP Emblem SVG */}
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:scale-105"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="logo-emerald-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="10" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="logo-gold-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.75" />
            </filter>

            {/* Metallic Gold Gradients */}
            <linearGradient id="logo-gold-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF3B0" />
              <stop offset="25%" stopColor="#D4AF37" />
              <stop offset="50%" stopColor="#AA771C" />
              <stop offset="75%" stopColor="#FDF0A6" />
              <stop offset="100%" stopColor="#8B5A00" />
            </linearGradient>

            <linearGradient id="logo-gold-grad-light" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF9D2" />
              <stop offset="50%" stopColor="#E5C158" />
              <stop offset="100%" stopColor="#B8860B" />
            </linearGradient>

            <linearGradient id="logo-gold-bevel" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5C3A00" />
              <stop offset="30%" stopColor="#B8860B" />
              <stop offset="70%" stopColor="#FFEAA7" />
              <stop offset="100%" stopColor="#734700" />
            </linearGradient>

            {/* Emerald Jewel Facet Gradients */}
            <linearGradient id="logo-emerald-facet-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="40%" stopColor="#059669" />
              <stop offset="100%" stopColor="#064E3B" />
            </linearGradient>

            <linearGradient id="logo-emerald-facet-light" x1="0%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="40%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>

            <linearGradient id="logo-emerald-facet-dark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#065F46" />
              <stop offset="60%" stopColor="#064E3B" />
              <stop offset="100%" stopColor="#022C22" />
            </linearGradient>

            <linearGradient id="logo-emerald-facet-deep" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="50%" stopColor="#022C22" />
              <stop offset="100%" stopColor="#011B14" />
            </linearGradient>

            <linearGradient id="logo-emerald-facet-highlight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A7F3D0" />
              <stop offset="50%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Ambient Background Glow */}
          <circle cx="250" cy="250" r="190" fill="#10B981" opacity="0.15" filter="url(#logo-emerald-glow)" />

          <g filter="url(#logo-gold-shadow)">
            {/* Outer Gold Hexagon Frame */}
            <polygon points="250,32 442,142 442,358 250,468 58,358 58,142" fill="url(#logo-gold-bevel)" stroke="#3D2600" strokeWidth="3" />
            <polygon points="250,40 430,145 430,355 250,460 70,355 70,145" fill="url(#logo-gold-grad-1)" stroke="#5C3A00" strokeWidth="2" />
            
            {/* Dark Inset Bed under facets */}
            <polygon points="250,54 416,150 416,350 250,446 84,350 84,150" fill="#011B14" stroke="url(#logo-gold-grad-light)" strokeWidth="3" />

            {/* Center Gold Dividing Spine (Between J and P) */}
            <line x1="248" y1="54" x2="248" y2="446" stroke="url(#logo-gold-bevel)" strokeWidth="4" />
            <line x1="252" y1="54" x2="252" y2="446" stroke="url(#logo-gold-grad-light)" strokeWidth="2" />

            {/* LEFT HALF: "J" */}
            <g id="logo-j">
              <polygon points="244,60 92,152 145,178 244,120" fill="url(#logo-emerald-facet-light)" stroke="url(#logo-gold-grad-1)" strokeWidth="2.5" />
              <polygon points="244,120 145,178 145,240 244,180" fill="url(#logo-emerald-facet-1)" stroke="url(#logo-gold-grad-light)" strokeWidth="1.5" />
              <polygon points="92,152 145,178 145,280 92,280" fill="url(#logo-emerald-facet-dark)" stroke="url(#logo-gold-bevel)" strokeWidth="2" />
              <polygon points="92,280 145,280 145,340 92,348" fill="url(#logo-emerald-facet-deep)" stroke="url(#logo-gold-grad-1)" strokeWidth="2" />
              <polygon points="92,280 175,280 145,240 92,280" fill="url(#logo-gold-grad-1)" stroke="#5C3A00" strokeWidth="2" />
              <polygon points="92,280 175,280 145,315" fill="url(#logo-gold-grad-light)" stroke="#8B5A00" strokeWidth="1.5" />
              <polygon points="92,348 145,340 185,385 105,370" fill="url(#logo-emerald-facet-1)" stroke="url(#logo-gold-grad-1)" strokeWidth="2" />
              <polygon points="105,370 185,385 244,440 170,415" fill="url(#logo-emerald-facet-dark)" stroke="url(#logo-gold-bevel)" strokeWidth="2" />
              <polygon points="170,415 244,440 244,380 185,385" fill="url(#logo-emerald-facet-light)" stroke="url(#logo-gold-grad-light)" strokeWidth="1.5" />
              <polygon points="185,385 244,440 215,440" fill="url(#logo-gold-grad-1)" stroke="#5C3A00" strokeWidth="1.5" />
            </g>

            {/* RIGHT HALF: "P" */}
            <g id="logo-p">
              <polygon points="256,60 408,152 355,178 256,120" fill="url(#logo-emerald-facet-light)" stroke="url(#logo-gold-grad-1)" strokeWidth="2.5" />
              <polygon points="256,120 355,178 355,235 256,175" fill="url(#logo-emerald-facet-1)" stroke="url(#logo-gold-grad-light)" strokeWidth="1.5" />
              <polygon points="408,152 408,270 355,235 355,178" fill="url(#logo-emerald-facet-dark)" stroke="url(#logo-gold-bevel)" strokeWidth="2" />
              <polygon points="256,260 408,270 355,305 256,305" fill="url(#logo-emerald-facet-highlight)" stroke="url(#logo-gold-grad-1)" strokeWidth="2" />
              <polygon points="280,185 340,205 340,245 280,245" fill="#011A13" stroke="url(#logo-gold-grad-light)" strokeWidth="2.5" />

              {/* Bitcoin Symbol inside P loop */}
              <g id="logo-bitcoin-sym" transform="translate(295, 200) scale(1.15)">
                <line x1="8" y1="2" x2="8" y2="7" stroke="url(#logo-gold-grad-light)" strokeWidth="2" strokeLinecap="round" />
                <line x1="14" y1="2" x2="14" y2="7" stroke="url(#logo-gold-grad-light)" strokeWidth="2" strokeLinecap="round" />
                <line x1="8" y1="31" x2="8" y2="36" stroke="url(#logo-gold-grad-light)" strokeWidth="2" strokeLinecap="round" />
                <line x1="14" y1="31" x2="14" y2="36" stroke="url(#logo-gold-grad-light)" strokeWidth="2" strokeLinecap="round" />

                <path
                  d="M 4 6 L 15 6 C 19 6 22 8 22 12 C 22 15 19 17.5 15 18 C 20 18.5 24 21 24 25.5 C 24 30 20 32 15 32 L 4 32 Z"
                  fill="url(#logo-gold-grad-1)"
                  stroke="#5C3A00"
                  strokeWidth="1.5"
                />
                <path d="M 9 10 L 14 10 C 16 10 18 11 18 13.5 C 18 16 16 17 14 17 L 9 17 Z" fill="#011A13" stroke="url(#logo-gold-grad-light)" strokeWidth="1" />
                <path d="M 9 21 L 15 21 C 17.5 21 19.5 22 19.5 25 C 19.5 28 17.5 28.5 15 28.5 L 9 28.5 Z" fill="#011A13" stroke="url(#logo-gold-grad-light)" strokeWidth="1" />
              </g>

              {/* P Bottom Struts */}
              <polygon points="256,305 320,305 310,410 256,440" fill="url(#logo-emerald-facet-dark)" stroke="url(#logo-gold-bevel)" strokeWidth="2" />
              <polygon points="320,305 355,305 390,360 350,420 310,410" fill="url(#logo-emerald-facet-1)" stroke="url(#logo-gold-grad-light)" strokeWidth="2" />
              <polygon points="355,305 408,270 408,350 390,360" fill="url(#logo-emerald-facet-deep)" stroke="url(#logo-gold-bevel)" strokeWidth="2" />
              <polygon points="408,350 350,420 390,360" fill="url(#logo-emerald-facet-light)" stroke="url(#logo-gold-grad-1)" strokeWidth="1.5" />
              <polygon points="350,420 256,440 310,410" fill="url(#logo-gold-grad-1)" stroke="#5C3A00" strokeWidth="1.5" />
            </g>

            {/* Specular Highlights */}
            <polygon points="250,54 360,110 320,135 250,85" fill="#FFFFFF" opacity="0.3" />
            <polygon points="120,170 145,178 135,230 105,210" fill="#FFFFFF" opacity="0.25" />
            <polygon points="380,165 408,152 400,220 375,210" fill="#FFFFFF" opacity="0.25" />
          </g>
        </svg>
      </div>

      {withText && (
        <div className="flex flex-col">
          <span className={`font-black tracking-tight text-white uppercase text-base leading-none ${textClassName}`}>
            juspay
          </span>
          <span className={`text-[10px] text-emerald-400/90 font-medium tracking-wide ${subtextClassName}`}>
            Institutional Fintech Vault
          </span>
        </div>
      )}
    </div>
  );
};

export default JuspayLogo;
