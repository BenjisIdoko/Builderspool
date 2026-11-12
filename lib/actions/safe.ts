import { unstable_rethrow } from 'next/navigation';

export type ActionFailure = { error: string };

const GENERIC = 'Something went wrong. Try again, and tell the BuildersPool team if it keeps happening.';

// What the person sees. The message of an error the action raised on purpose
// ("Only a submitted bid can be withdrawn.") is written for people; a database
// or framework error is not, so it is replaced.
function messageOf(err: unknown): string {
  if (!(err instanceof Error)) return GENERIC;
  const internal = err.name.startsWith('Prisma') || err.message.includes('prisma.') || err.message.includes('Invalid `');
  return internal || !err.message ? GENERIC : err.message;
}

// Wraps a server action so a failure comes back as { error } for the form to
// show beside its button, instead of throwing an error page. A redirect or
// not-found raised inside the action still goes through.
export function safeAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
  return async (...args: A): Promise<R | ActionFailure> => {
    try {
      return await fn(...args);
    } catch (err) {
      unstable_rethrow(err);
      return { error: messageOf(err) };
    }
  };
}
