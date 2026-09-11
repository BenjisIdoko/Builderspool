import { Layers, Grid3x3, GitCommitHorizontal, Home, Wrench, Package, type LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  Cement: Layers,
  Blocks: Grid3x3,
  Rebar: GitCommitHorizontal,
  Roofing: Home,
  Fittings: Wrench,
};

export function getCategoryIcon(category: string): LucideIcon {
  return ICONS[category] ?? Package;
}
