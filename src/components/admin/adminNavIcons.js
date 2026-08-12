/**
 * PRATIKSHYA FASHON — Admin navigation icons.
 *
 * Lucide only, matching the employee portal's approach: navigation config
 * names an icon, this map resolves it, so config files never import React.
 */

import {
  BadgeCheck,
  BarChart3,
  Boxes,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  LayoutGrid,
  Layers,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  ArrowLeftRight,
  Tag,
  Target,
  TrendingUp,
  User,
  Users,
  Warehouse,
} from "lucide-react";

export const ADMIN_NAV_ICONS = {
  layout: LayoutDashboard,
  sparkles: Sparkles,
  grid: LayoutGrid,
  layers: Layers,
  tag: Tag,
  bag: ShoppingBag,
  users: Users,
  undo: RotateCcw,
  boxes: Boxes,
  warehouse: Warehouse,
  swap: ArrowLeftRight,
  badge: BadgeCheck,
  shield: ShieldCheck,
  clock: Clock3,
  target: Target,
  trend: TrendingUp,
  chart: BarChart3,
  list: ClipboardList,
  sliders: SlidersHorizontal,
  user: User,
};

export const adminNavIcon = (name) => ADMIN_NAV_ICONS[name] ?? LayoutDashboard;

export default ADMIN_NAV_ICONS;
