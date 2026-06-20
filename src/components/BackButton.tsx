'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

type BackButtonProps = {
  className?: string;
  label?: string;           // opcional: texto "Voltar"
  size?: 'sm' | 'md' | 'lg';
  href?: string;
};

const hitbox = { sm: 'h-9 w-9', md: 'h-10 w-10', lg: 'h-12 w-12' };

export default function BackButton({
  className = '',
  label,
  size = 'md',
  href,
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      type="button"
      aria-label="Voltar"
      onClick={handleClick}
      className={`group inline-flex items-center justify-center bg-transparent text-white/90 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-md ${hitbox[size]} ${className}`}
    >
      {/* SETA RETA (inline SVG, sem depender de lib) */}
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 stroke-current transition-transform duration-150 group-hover:-translate-x-0.5"
        fill="none"
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5" />
        <path d="M12 5l-7 7 7 7" />
      </svg>

      {label ? <span className="ml-2 text-sm font-medium">{label}</span> : null}
    </button>
  );
}
