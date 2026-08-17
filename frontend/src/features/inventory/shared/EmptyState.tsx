import type { FC } from "react";

interface EmptyStateProps {
  icon: FC<{ size?: number; className?: string }>;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="px-6 py-10 text-center">
      <Icon size={26} className="mx-auto text-[#16865b]" />
      <p className="mt-3 text-sm font-extrabold text-[#24466f]">{title}</p>
      <p className="mt-1 text-xs text-[#8093ab]">{description}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 rounded-xl bg-[#155eef] px-4 py-2.5 text-xs font-extrabold text-white"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}