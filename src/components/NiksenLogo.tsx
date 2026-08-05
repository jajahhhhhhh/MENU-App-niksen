import React from 'react';

interface NiksenLogoProps {
  className?: string;
  variant?: 'blue' | 'white' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const NiksenLogo: React.FC<NiksenLogoProps> = ({
  variant = 'blue',
  size = 'md',
  showSubtitle = true,
  className = ''
}) => {
  // Color selection — brand mark uses Slate Blue from the niksen palette
  const mainColor = variant === 'white' ? '#FFFFFF' : variant === 'dark' ? '#1E293B' : '#40536B';
  const subtitleColor = variant === 'white' ? '#E2E8F0' : variant === 'dark' ? '#475569' : '#C17A5A';

  // Size scalings
  const heightMap = {
    sm: 'h-8',
    md: 'h-11',
    lg: 'h-16'
  };

  return (
    <div className={`inline-flex items-center select-none ${heightMap[size]} ${className}`}>
      <svg
        viewBox="0 0 280 80"
        className="h-full w-auto max-w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill={mainColor}>
          {/* n */}
          <text
            x="5"
            y="48"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="900"
            fontSize="48"
            fontStyle="italic"
            letterSpacing="-1.5"
          >
            n
          </text>

          {/* i stem */}
          <rect x="42" y="16" width="9.5" height="32" rx="4.5" transform="skewX(-10 42 16)" />
          
          {/* teardrop below i */}
          <path
            d="M 46.5 53 C 43 53 40.5 56 40.5 59.5 C 40.5 63.5 43.8 66.5 46.5 66.5 C 49.2 66.5 52.5 63.5 52.5 59.5 C 52.5 56 50 53 46.5 53 Z"
          />

          {/* k s e n */}
          <text
            x="58"
            y="48"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="900"
            fontSize="48"
            fontStyle="italic"
            letterSpacing="-1"
          >
            ksen
          </text>

          {/* secret bar */}
          {showSubtitle && (
            <text
              x="125"
              y="66"
              fill={subtitleColor}
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontWeight="700"
              fontSize="16"
              letterSpacing="0.5"
            >
              secret bar
            </text>
          )}
        </g>
      </svg>
    </div>
  );
};
