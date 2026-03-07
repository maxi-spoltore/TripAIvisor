'use client';

import { Check, Copy, Share2 } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { createShareLinkAction } from '@/app/actions/shares';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
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

  const handleGenerateLink = () => {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result = await createShareLinkAction({ locale, tripId });
        setShareUrl(result.shareUrl);
      } catch {
        setErrorMessage(tErrors('generateShareLink'));
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
      setErrorMessage(tErrors('copyLink'));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isPending) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-brand-primary" />
            {tShare('title')}
          </DialogTitle>
          <DialogDescription>{tShare('viewOnly')}</DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          <Button className="w-full" disabled={isPending} onClick={handleGenerateLink}>
            {isPending ? (
              <>
                <Spinner className="mr-2" />
                {tShare('generating')}
              </>
            ) : (
              tShare('generateLink')
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input className="bg-subtle font-mono text-sm" readOnly value={shareUrl} />
              <Button
                aria-label={tShare('copyLink')}
                className={cn('transition-all duration-200', copied && 'border-success bg-subtle text-success')}
                disabled={isPending}
                onClick={handleCopyLink}
                type="button"
                variant="outline"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">{tShare('copyLink')}</span>
              </Button>
            </div>
            {copied ? <p className="text-sm text-success">{tShare('copied')}</p> : null}
          </div>
        )}

        {errorMessage ? <p className="mt-3 text-sm text-danger">{errorMessage}</p> : null}

        <DialogFooter>
          <Button disabled={isPending} onClick={onClose} type="button" variant="outline">
            {tCommon('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
