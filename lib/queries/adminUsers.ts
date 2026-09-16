import { prisma } from '../prisma';
import { Prisma, Role } from '@prisma/client';

const PAGE_SIZE = 15;

// Admin-only user directory — every real buyer, seller, and admin account.
// Sellers carry their SellerProfile (trust score, regions served); buyers
// carry a real order count instead, since that's the equivalent "how
// active is this account" signal on that side.
export async function getUsersForAdmin({
  role,
  query,
  page = 1,
}: {
  role?: Role;
  query?: string;
  page?: number;
}) {
  const where: Prisma.UserWhereInput = {
    role: role || undefined,
    OR: query
      ? [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { businessName: { contains: query, mode: 'insensitive' } },
        ]
      : undefined,
  };

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { sellerProfile: true, _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: rows,
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export type AdminUser = Awaited<ReturnType<typeof getUsersForAdmin>>['users'][number];

export async function getUserRoleCounts() {
  const [total, buyers, sellers, admins] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: Role.BUYER } }),
    prisma.user.count({ where: { role: Role.SELLER } }),
    prisma.user.count({ where: { role: Role.ADMIN } }),
  ]);
  return { total, buyers, sellers, admins };
}
