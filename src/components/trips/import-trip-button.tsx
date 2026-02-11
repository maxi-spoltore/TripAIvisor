'use client';

import { Upload } from 'lucide-react';
import { ChangeEvent, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { importTripFromDataAction } from '@/app/actions/trips';
import { Button } from '@/components/ui/button';
import { validateImportData } from '@/lib/utils/import-export';

type ImportTripButtonProps = {
  locale: string;
  label: string;
  loadingLabel: string;
};

export function ImportTripButton({ locale, label, loadingLabel }: ImportTripButtonProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenFilePicker = () => {
    if (isPending) {
      return;
    }

    setErrorMessage(null);
    fileInputRef.current?.click();
  };

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';

    if (!selectedFile) {
      return;
    }

    try {
      const fileText = await selectedFile.text();
      const parsedData: unknown = JSON.parse(fileText);

      if (!validateImportData(parsedData)) {
        setErrorMessage(locale === 'es' ? 'Formato de archivo inválido.' : 'Invalid file format.');
        return;
      }

      startTransition(() => {
        void (async () => {
          try {
            const tripId = await importTripFromDataAction({
              locale,
              data: parsedData
            });
            router.push(`/${locale}/trips/${tripId}`);
            router.refresh();
          } catch {
            setErrorMessage(locale === 'es' ? 'No se pudo importar el viaje.' : 'Could not import the trip.');
          }
        })();
      });
    } catch {
      setErrorMessage(locale === 'es' ? 'El archivo no contiene JSON válido.' : 'The file is not valid JSON.');
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileSelection}
        ref={fileInputRef}
        type="file"
      />
      <Button disabled={isPending} onClick={handleOpenFilePicker} type="button" variant="outline">
        <Upload className="mr-2 h-4 w-4" />
        {isPending ? loadingLabel : label}
      </Button>
      {errorMessage ? <p className="text-xs text-red-600">{errorMessage}</p> : null}
    </div>
  );
}
