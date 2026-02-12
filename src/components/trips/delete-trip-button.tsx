'use client';

import { MouseEvent, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
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
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    formRef.current = event.currentTarget.closest('form');
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    formRef.current?.requestSubmit();
  };

  return (
    <>
      <button
        onClick={handleClick}
        type="button"
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
        aria-label={tCommon('delete')}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tCommon('delete')}</DialogTitle>
            <DialogDescription>{tCommon('confirmDelete')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              {tCommon('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              {tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
