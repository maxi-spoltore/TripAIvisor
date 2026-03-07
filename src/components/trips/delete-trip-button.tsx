'use client';

import { MouseEvent, useRef, useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

export function DeleteTripButton() {
  const tCommon = useTranslations('common');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    formRef.current = event.currentTarget.closest('form');
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    startTransition(() => {
      setShowConfirm(false);
      formRef.current?.requestSubmit();
    });
  };

  return (
    <>
      <button
        onClick={handleClick}
        type="button"
        className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-subtle hover:text-danger"
        aria-label={tCommon('delete')}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <Dialog open={showConfirm} onOpenChange={(open) => { if (!isPending) setShowConfirm(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tCommon('delete')}</DialogTitle>
            <DialogDescription>{tCommon('confirmDelete')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button disabled={isPending} variant="outline" onClick={() => setShowConfirm(false)}>
              {tCommon('cancel')}
            </Button>
            <Button disabled={isPending} variant="destructive" onClick={handleConfirm}>
              {isPending ? (
                <>
                  <Spinner className="mr-2" />
                  {tCommon('deleting')}
                </>
              ) : (
                tCommon('delete')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
