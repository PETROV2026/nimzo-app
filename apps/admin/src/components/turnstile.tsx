import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState } from 'react';

type TurnstileApi = {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      language: string;
      theme: 'light';
      size: 'flexible';
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
    },
  ): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile() {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile unavailable'));
    script.onerror = () => {
      scriptPromise = null;
      script.remove();
      reject(new Error('Turnstile failed to load'));
    };
    document.head.append(script);
  });
  return scriptPromise;
}

type TurnstileProps = {
  siteKey: string;
  resetKey: number;
  onToken: (token: string | null) => void;
};

export function Turnstile({ siteKey, resetKey, onToken }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<{ api: TurnstileApi; id: string } | null>(null);
  const onTokenRef = useRef(onToken);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    onTokenRef.current = onToken;
  });

  useEffect(() => {
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled || !containerRef.current) return;
        const id = api.render(containerRef.current, {
          sitekey: siteKey,
          language: 'es',
          theme: 'light',
          size: 'flexible',
          callback: (token) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null),
        });
        widgetRef.current = { api, id };
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
      if (widgetRef.current) widgetRef.current.api.remove(widgetRef.current.id);
      widgetRef.current = null;
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetKey === 0 || !widgetRef.current) return;
    widgetRef.current.api.reset(widgetRef.current.id);
    onTokenRef.current(null);
  }, [resetKey]);

  if (loadFailed) {
    return (
      <Typography role="alert" color="error">
        No se pudo cargar la verificación de seguridad. Revisa tu conexión y recarga la página.
      </Typography>
    );
  }

  return <Box ref={containerRef} sx={{ minHeight: 65 }} />;
}
