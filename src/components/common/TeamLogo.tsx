import React, { useState } from 'react';

interface TeamLogoProps {
  logo?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({
  logo,
  name = '',
  size = 'sm',
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);

  // Dimension presets
  const sizeMap: Record<string, { img: string; text: string }> = {
    xs: { img: 'w-3.5 h-3.5', text: 'text-xs w-3.5 h-3.5' },
    sm: { img: 'w-4 h-4', text: 'text-sm w-4 h-4' },
    md: { img: 'w-6 h-6', text: 'text-base w-6 h-6' },
    lg: { img: 'w-8 h-8', text: 'text-xl w-8 h-8' },
    xl: { img: 'w-10 h-10', text: 'text-2xl w-10 h-10' }
  };

  const currentSize = sizeMap[size] || sizeMap.sm;

  // Determine if logo is a web/image URL
  const isWebUrl =
    !imageError &&
    Boolean(
      logo &&
        typeof logo === 'string' &&
        (logo.startsWith('http://') ||
          logo.startsWith('https://') ||
          logo.startsWith('/') ||
          logo.includes('espncdn.com') ||
          logo.includes('.png') ||
          logo.includes('.svg') ||
          logo.includes('.jpg') ||
          logo.includes('.webp'))
    );

  if (isWebUrl && logo) {
    return (
      <img
        src={logo}
        alt={name ? `${name} logo` : 'Team logo'}
        onError={() => setImageError(true)}
        className={`${currentSize.img} object-contain flex-shrink-0 select-none ${className}`}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  // If logo is a short emoji/symbol (e.g. ⭐, 🤘, 🦁, ⚾)
  if (
    logo &&
    typeof logo === 'string' &&
    !logo.startsWith('http') &&
    !logo.includes('/') &&
    logo.length <= 4
  ) {
    return (
      <span
        className={`flex-shrink-0 leading-none inline-flex items-center justify-center select-none ${currentSize.text} ${className}`}
        role="img"
        aria-label={name}
      >
        {logo}
      </span>
    );
  }

  // Clean initial fallback badge if URL fails or logo is missing
  const initial = (name.trim().charAt(0) || 'T').toUpperCase();
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 font-bold flex-shrink-0 text-[10px] select-none ${currentSize.img} ${className}`}
      title={name}
    >
      {initial}
    </span>
  );
};
