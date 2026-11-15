import type { FormEvent } from "react";
import { startTransition } from "react";

/**
 * Submits a form to a server action without React clearing the fields afterwards.
 * React 19 resets a form after its action finishes, which wipes what the person typed when
 * the server sends back a validation error. Use as: <form onSubmit={keepForm(action)}>.
 */
export function keepForm(action: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => action(formData));
  };
}
