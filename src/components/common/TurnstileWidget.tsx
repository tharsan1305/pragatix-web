import { logger } from '../../utils/logger';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          action?: string;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  resetTrigger?: number | string | boolean;
}

const isProd = import.meta.env.PROD;
const configuredSiteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string)?.trim();
// In production, require VITE_TURNSTILE_SITE_KEY; use test key only in dev/staging environments
const SITE_KEY = configuredSiteKey || (isProd ? '' : '1x00000000000000000000AA');

export default function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
  resetTrigger,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!SITE_KEY) {
      if (isProd) {
        logger.warn('Turnstile widget: VITE_TURNSTILE_SITE_KEY is not configured in production.');
      }
      return;
    }

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile) return;

      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          logger.warn('Turnstile remove warning:', e);
        }
        widgetIdRef.current = null;
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          action: 'turnstile-spin-v2',
          callback: (token: string) => {
            if (isMounted) onVerify(token);
          },
          'expired-callback': () => {
            if (isMounted) {
              onVerify('');
              if (onExpire) onExpire();
            }
          },
          'error-callback': () => {
            if (isMounted) {
              onVerify('');
              if (onError) onError();
            }
          },
        });
        widgetIdRef.current = id;
      } catch (err) {
        logger.error('Failed to render Turnstile widget:', err);
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          if (isMounted) renderWidget();
        }
      }, 100);
      return () => clearInterval(interval);
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // ignore
        }
      }
    };
  }, [onVerify, onExpire, onError]);

  useEffect(() => {
    if (resetTrigger !== undefined && widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch (e) {
        logger.warn('Turnstile reset warning:', e);
      }
    }
  }, [resetTrigger]);

  if (!SITE_KEY && isProd) {
    return null;
  }

  return (
    <div className="flex justify-center my-3">
      <div
        ref={containerRef}
        className="cf-turnstile"
        data-sitekey={SITE_KEY}
        data-action="turnstile-spin-v2"
      />
    </div>
  );
}
