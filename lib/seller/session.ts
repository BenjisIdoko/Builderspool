import { cache } from 'react';
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSessionUserId } from '@/lib/auth/sessionStore';

// Cookie holds a random session token (never the user id) — see
// lib/auth/sessionStore.ts. Set by signInSeller()/signUpSeller() in
// app/seller/actions.ts after a real password check/hash.
export const SELLER_COOKIE = 'bp_seller_session';
export const SELLER_SESSION = { cookieName: SELLER_COOKIE, role: Role.SELLER };

export interface SellerActor {
  // The signed-in person (an owner, or one of the owner's staff).
  userId: string;
  // The seller account being acted on — the owner's id for both.
  sellerId: string;
  isOwner: boolean;
}

// The seller portal serves two kinds of sign-in: the owner, and staff who work
// for the owner. Both land on the same pages and act on the owner's seller
// account; staff are barred from KYC, bank details, terms and team changes
// (requireSellerOwner). A disabled account or orphaned staff row resolves to
// "not signed in".
export const getSellerActor = cache(async (): Promise<SellerActor | null> => {
  const userId = await getSessionUserId(SELLER_COOKIE, Role.SELLER);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, disabledAt: true, staffMembership: { select: { sellerUserId: true } } },
  });
  if (!user || user.disabledAt) return null;

  if (user.role === Role.SELLER) return { userId: user.id, sellerId: user.id, isOwner: true };
  if (user.role === Role.SELLER_STAFF && user.staffMembership) {
    return { userId: user.id, sellerId: user.staffMembership.sellerUserId, isOwner: false };
  }
  return null;
});

// The seller account id (the owner's), for queries about the seller's data.
export async function getSellerIdFromSession(): Promise<string | null> {
  return (await getSellerActor())?.sellerId ?? null;
}

// Gate for owner-only actions. Staff get a plain message; signed-out callers
// go to the login page.
export async function requireSellerOwner(): Promise<SellerActor> {
  const actor = await getSellerActor();
  if (!actor) redirect('/seller/login');
  if (!actor.isOwner) throw new Error('Only the account owner can do this.');
  return actor;
}
