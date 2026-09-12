import { Package, type LucideIcon } from 'lucide-react';
import { CementIcon, BlocksIcon, RebarIcon, RoofingIcon, FittingsIcon } from '@/components/icons/material-icons';
import type { ComponentType, SVGProps } from 'react';

type CategoryIcon = LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;

const ICONS: Record<string, CategoryIcon> = {
  Cement: CementIcon,
  Blocks: BlocksIcon,
  Rebar: RebarIcon,
  Roofing: RoofingIcon,
  Fittings: FittingsIcon,
};

export function getCategoryIcon(category: string): CategoryIcon {
  return ICONS[category] ?? Package;
}
