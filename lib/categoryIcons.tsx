import { PackageIcon } from '@phosphor-icons/react/ssr';
import type { Icon } from '@phosphor-icons/react';
import { CementIcon, BlocksIcon, RebarIcon, RoofingIcon, FittingsIcon } from '@/components/icons/material-icons';
import type { ComponentType, SVGProps } from 'react';

type CategoryIcon = Icon | ComponentType<SVGProps<SVGSVGElement>>;

const ICONS: Record<string, CategoryIcon> = {
  Cement: CementIcon,
  Blocks: BlocksIcon,
  Rebar: RebarIcon,
  Roofing: RoofingIcon,
  Fittings: FittingsIcon,
};

export function getCategoryIcon(category: string): CategoryIcon {
  return ICONS[category] ?? PackageIcon;
}
