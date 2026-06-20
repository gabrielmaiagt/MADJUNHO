
'use client';

// This component is now only a loading fallback.
// The redirection logic has been moved to a script in `layout.tsx`
// to ensure UTM parameters are captured before any client-side navigation.
import Logo from '@/components/Logo';

export default function Home() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Logo className="animate-pulse" />
    </div>
  );
}
