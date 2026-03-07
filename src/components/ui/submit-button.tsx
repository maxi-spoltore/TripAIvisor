'use client';

import { useFormStatus } from 'react-dom';
import { Button, type ButtonProps } from './button';
import { Spinner } from './spinner';

type SubmitButtonProps = ButtonProps & {
  pendingLabel?: string;
};

export function SubmitButton({ children, pendingLabel, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit" {...props}>
      {pending ? (
        <>
          <Spinner className="mr-2" />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
