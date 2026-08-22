'use client';

type ClerkUser = {
  id: string;
  unsafeMetadata: Record<string, unknown>;
  update(input: { unsafeMetadata?: Record<string, unknown> }): Promise<unknown>;
};
type ClerkSession = { id: string; getToken(): Promise<string | null> };
type ClerkBrowser = {
  user: ClerkUser | null;
  session: ClerkSession | null;
  client: {
    signIn: { create(input: { identifier: string; password: string }): Promise<{ status: string; createdSessionId: string | null }> };
    signUp: {
      create(input: { emailAddress: string; password: string; unsafeMetadata?: Record<string, unknown> }): Promise<{ status: string; createdSessionId: string | null; createdUserId: string | null }>;
      prepareEmailAddressVerification(input: { strategy: 'email_code' }): Promise<unknown>;
    };
  };
  setActive(input: { session: string }): Promise<void>;
  signOut(): Promise<void>;
};

function browserClerk(): ClerkBrowser {
  if (typeof window === 'undefined') throw new Error('Clerk client auth is only available in the browser');
  const clerk = (window as typeof window & { Clerk?: ClerkBrowser }).Clerk;
  if (!clerk) throw new Error('Clerk has not finished loading');
  return clerk;
}

export async function signIn(email: string, password: string) {
  const clerk = browserClerk();
  const result = await clerk.client.signIn.create({ identifier: email, password });
  if (result.status !== 'complete' || !result.createdSessionId) {
    throw new Error('Additional verification is required. Continue in the Clerk sign-in flow.');
  }
  await clerk.setActive({ session: result.createdSessionId });
  return result;
}

export async function signUp(email: string, password: string, metadata?: Record<string, unknown>) {
  const clerk = browserClerk();
  const result = await clerk.client.signUp.create({ emailAddress: email, password, unsafeMetadata: metadata });
  if (result.status === 'complete' && result.createdSessionId) {
    await clerk.setActive({ session: result.createdSessionId });
  } else {
    await clerk.client.signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
  }
  return result;
}

export async function signOut() {
  await browserClerk().signOut();
}

export async function resetPassword(email: string) {
  if (typeof window !== 'undefined') window.location.assign(`/login?reset=1&email=${encodeURIComponent(email)}`);
}

export async function updatePassword(_newPassword: string): Promise<never> {
  throw new Error('Password changes are managed by Clerk account security.');
}

export async function getCurrentUser() {
  return browserClerk().user;
}

export async function getCurrentSession() {
  return browserClerk().session;
}

export async function updateUserMetadata(metadata: Record<string, unknown>) {
  const user = browserClerk().user;
  if (!user) throw new Error('Not authenticated');
  return user.update({ unsafeMetadata: { ...user.unsafeMetadata, ...metadata } });
}

export { useAuth } from './hooks/useAuth';
export { useRequireAuth } from './hooks/useRequireAuth';
export { useProfile } from './hooks/useProfile';
export type { Profile } from './hooks/useProfile';
