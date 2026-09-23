import type { FC } from "react";

interface EmptyStateProps {
  icon: FC<{ size?: number; className?: string }>;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="ui-empty">
      <span className="ui-empty-icon">
        <Icon size={20} className="text-[#475467]" />
      </span>
      <p className="ui-empty-title">{title}</p>
      <p className="ui-empty-description">{description}</p>
      {action && (
        <button type="button" onClick={action.onClick} className="ui-btn ui-btn-primary mt-4">
          {action.label}
        </button>
      )}
    </div>
  );
}
