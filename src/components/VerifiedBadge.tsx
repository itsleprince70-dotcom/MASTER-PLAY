import React from 'react';

interface VerifiedBadgeProps {
  verified?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  verified,
  size = 'sm',
  className = '',
}) => {
  if (!verified) return null;

  const sizeClasses =
    size === 'xs'
      ? 'w-3.5 h-3.5'
      : size === 'md'
      ? 'w-5 h-5'
      : 'w-4 h-4';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-sky-500 text-white shrink-0 shadow-sm shadow-sky-500/30 ${sizeClasses} ${className}`}
      title="Kont Sètifye"
      aria-label="Kont Sètifye"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[65%] h-[65%]"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
};
