'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
          background: '#09090b',
          color: '#f5f5f5',
          fontFamily: 'Roboto, sans-serif',
        }}
      >
        <p style={{ fontSize: '2.5rem', margin: 0 }}>😕</p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
          Ops, algo deu errado
        </h1>
        <p style={{ color: '#a1a1aa', maxWidth: '28rem', margin: 0 }}>
          Tivemos um problema ao carregar essa página. Tente novamente — se continuar acontecendo, volte para o início do app.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            onClick={() => reset()}
            style={{
              background: '#CA1854',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tentar novamente
          </button>
          <button
            onClick={() => { window.location.href = '/'; }}
            style={{
              background: 'transparent',
              color: '#f5f5f5',
              border: '1px solid #3f3f46',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Voltar ao início
          </button>
        </div>
      </body>
    </html>
  );
}
