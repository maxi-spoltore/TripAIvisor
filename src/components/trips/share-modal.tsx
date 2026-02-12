'use client';

import { Check, Copy, Share2 } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { createShareLinkAction } from '@/app/actions/shares';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type ShareModalProps = {
  locale: string;
  tripId: number;
  open: boolean;
  onClose: () => void;
};

export function ShareModal({ locale, tripId, open, onClose }: ShareModalProps) {
  const tShare = useTranslations('share');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setErrorMessage(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isPending, onClose, open]);

  const handleGenerateLink = () => {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result = await createShareLinkAction({ locale, tripId });
        setShareUrl(result.shareUrl);
      } catch {
        setErrorMessage(locale === 'es' ? 'No se pudo generar el enlace.' : 'Could not generate the share link.');
      }
    });
  };

  const handleCopyLink = async () => {
    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMessage(locale === 'es' ? 'No se pudo copiar el enlace.' : 'Could not copy the link.');
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={() => {
        if (!isPending) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-xl animate-scale-in rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Share2 className="h-5 w-5 text-primary-500" />
            {tShare('title')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{tShare('viewOnly')}</p>
        </div>

        {!shareUrl ? (
          <Button className="w-full" disabled={isPending} onClick={handleGenerateLink}>
            {isPending ? (
              <>
                <Spinner className="mr-2" />
                {locale === 'es' ? 'Generando...' : 'Generating...'}
              </>
            ) : (
              tShare('generateLink')
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input className="bg-slate-50 font-mono text-sm" readOnly value={shareUrl} />
              <Button
                aria-label={tShare('copyLink')}
                className={cn('transition-all duration-200', copied && 'border-emerald-400 bg-emerald-50 text-emerald-600')}
                disabled={isPending}
                onClick={handleCopyLink}
                type="button"
                variant="outline"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">{tShare('copyLink')}</span>
              </Button>
            </div>
            {copied ? <p className="text-sm text-emerald-700">{tShare('copied')}</p> : null}
          </div>
        )}

        {errorMessage ? <p className="mt-3 text-sm text-red-600">{errorMessage}</p> : null}

        <div className="mt-6 flex justify-end">
          <Button disabled={isPending} onClick={onClose} type="button" variant="outline">
            {locale === 'es' ? 'Cerrar' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
}
