import type { ComponentType } from 'react';
import {
  PackageIcon,
  ClockCountdownIcon,
  TrophyIcon,
  XCircleIcon,
  ReceiptIcon,
  WalletIcon,
  TruckIcon,
  TagIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
} from '@phosphor-icons/react/ssr';
import type { NotificationType } from '@prisma/client';

// Lives outside the client-only bell file on purpose: the server-rendered
// notifications page indexes these maps, and a server component importing a
// plain constant from a 'use client' module only receives a placeholder.
export const BUYER_NOTIFICATION_ICON: Record<NotificationType, ComponentType<{ className?: string }>> = {
  CYCLE_OPENED: PackageIcon,
  CYCLE_CLOSING_SOON: ClockCountdownIcon,
  BID_WON: TrophyIcon,
  BID_LOST: XCircleIcon,
  SHEET_OPENED: PackageIcon,
  SHEET_OFFERED: TrophyIcon,
  DIRECT_ORDER_RECEIVED: PackageIcon,
  ACCEPT_REMINDER: ClockCountdownIcon,
  ORDER_PLACED: ReceiptIcon,
  ORDER_PAID: ReceiptIcon,
  PAYMENT_REMINDER: ClockCountdownIcon,
  CART_REMINDER: ShoppingCartIcon,
  ORDER_UPDATE: PackageIcon,
  SAVINGS_CREDITED: WalletIcon,
  DISPATCH_UPDATE: TruckIcon,
  PRICE_ALERT_REACHED: TagIcon,
  LISTING_LIVE: CheckCircleIcon,
  LISTING_REJECTED: XCircleIcon,
};

export const BUYER_NOTIFICATION_TONE: Record<NotificationType, string> = {
  CYCLE_OPENED: 'bg-pale-blue text-cyan-text',
  CYCLE_CLOSING_SOON: 'bg-warning-soft text-warning-text',
  BID_WON: 'bg-success-soft text-success',
  BID_LOST: 'bg-danger-soft text-danger',
  SHEET_OPENED: 'bg-pale-blue text-cyan-text',
  SHEET_OFFERED: 'bg-success-soft text-success',
  DIRECT_ORDER_RECEIVED: 'bg-pale-blue text-cyan-text',
  ACCEPT_REMINDER: 'bg-warning-soft text-warning-text',
  ORDER_PLACED: 'bg-pale-blue text-cyan-text',
  ORDER_PAID: 'bg-success-soft text-success',
  PAYMENT_REMINDER: 'bg-warning-soft text-warning-text',
  CART_REMINDER: 'bg-warning-soft text-warning-text',
  ORDER_UPDATE: 'bg-pale-blue text-cyan-text',
  SAVINGS_CREDITED: 'bg-success-soft text-success',
  DISPATCH_UPDATE: 'bg-pale-blue text-cyan-text',
  PRICE_ALERT_REACHED: 'bg-success-soft text-success',
  LISTING_LIVE: 'bg-success-soft text-success',
  LISTING_REJECTED: 'bg-danger-soft text-danger',
};
