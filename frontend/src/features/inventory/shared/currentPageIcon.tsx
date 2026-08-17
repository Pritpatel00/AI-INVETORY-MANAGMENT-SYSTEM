import { LayoutDashboard, Mic, ClipboardCheck, Boxes, FileClock, Settings, ArrowRightLeft, Truck, PackageCheck, Warehouse, UsersRound, Activity, type LucideIcon } from "lucide-react";
import type { Role } from "../types";

export function currentPageIcon(role: Role, page: string): LucideIcon {
  const pageIcons: Record<string, LucideIcon> =
    role === "worker"
      ? {
          Overview: LayoutDashboard,
          "Voice entry": Mic,
          "Task queue": ClipboardCheck,
          "Active items": Boxes,
          "My history": FileClock,
          Settings,
        }
      : role === "manager"
        ? {
            Overview: LayoutDashboard,
            Transactions: ArrowRightLeft,
            "Purchase Items": Truck,
            "Task planning": ClipboardCheck,
            Catalog: PackageCheck,
            Locations: Warehouse,
          }
        : {
            Overview: LayoutDashboard,
            Items: Boxes,
            "Audit transactions": FileClock,
            "User access": UsersRound,
            "System health": Activity,
          };
  return pageIcons[page] ?? LayoutDashboard;
}

import React from "react";

export function HeaderPageIcon({ role, page }: { role: Role; page: string }) {
  return React.createElement(currentPageIcon(role, page), { size: 20, strokeWidth: 2.1, "aria-hidden": true });
}
