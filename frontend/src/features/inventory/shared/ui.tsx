"use client";

/**
 * Shared UI primitives for the warehouse workspace.
 *
 * Every screen composes these instead of re-inventing borders, radii,
 * focus rings and status colours, so the administrator, manager and
 * warehouse-executive workspaces stay visually identical. All styling
 * lives in app/globals.css (`ui-*` classes) — no new UI framework.
 *
 * Accessibility notes:
 * - Status is never colour-only: `StatusBadge` and `StatusDot` always
 *   pair a tone with a text label or visible glyph.
 * - Focus rings come from the global `:focus-visible` rule.
 * - Dialogs and drawers close on Escape and move focus into the panel when
 *   they open; callers keep the rest of the form logic in the surrounding code.
 */

import { useEffect, useRef } from "react";
import type {
  ButtonHTMLAttributes,
  ComponentType,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type IconComponent = ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "violet";

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: IconComponent;
  children?: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  icon: Icon,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  const sizeClass = size === "sm" ? "ui-btn-sm" : size === "lg" ? "ui-btn-lg" : "";
  return (
    <button
      type="button"
      className={`ui-btn ui-btn-${variant} ${sizeClass} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="ui-spinner" aria-hidden="true" /> : Icon ? <Icon size={16} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

export function Card({
  children,
  className = "",
  as: Element = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return <Element className={`ui-card ${className}`.trim()}>{children}</Element>;
}

export function CardHeader({
  title,
  description,
  eyebrow,
  actions,
  id,
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  id?: string;
}) {
  return (
    <div className="ui-card-header">
      <div className="min-w-0">
        {eyebrow ? <p className="ui-eyebrow">{eyebrow}</p> : null}
        <h2 id={id} className="ui-section-title">
          {title}
        </h2>
        {description ? <p className="ui-section-subtitle">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`ui-card-body ${className}`.trim()}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Page header + breadcrumbs                                           */
/* ------------------------------------------------------------------ */

export interface Crumb {
  label: string;
  onClick?: () => void;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="page-breadcrumbs">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
          {index > 0 ? (
            <span className="breadcrumb-sep" aria-hidden="true">
              /
            </span>
          ) : null}
          {item.onClick && index < items.length - 1 ? (
            <button type="button" onClick={item.onClick} className="rounded px-0.5 hover:text-[#155eef]">
              {item.label}
            </button>
          ) : (
            <span aria-current={index === items.length - 1 ? "page" : undefined}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({
  title,
  description,
  eyebrow,
  breadcrumbs,
  actions,
  titleId = "page-title",
  meta,
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
  titleId?: string;
  meta?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-col gap-3 border-b border-[#e4e7ec] pb-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : eyebrow ? <p className="ui-eyebrow">{eyebrow}</p> : null}
        <h1 id={titleId} className="mt-1 text-[20px] font-bold leading-tight text-[#101828] sm:text-[22px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-[13px] leading-6 text-[#475467]">{description}</p>
        ) : null}
        {meta ? <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Status                                                              */
/* ------------------------------------------------------------------ */

export function Badge({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={`ui-badge ui-badge-${tone} ${className}`.trim()}>{children}</span>;
}

export type StatusTone = "healthy" | "warning" | "critical" | "unknown";

const statusGlyph: Record<StatusTone, string> = {
  healthy: "✓",
  warning: "!",
  critical: "×",
  unknown: "?",
};

export function StatusBadge({ tone, label, className = "" }: { tone: StatusTone; label: ReactNode; className?: string }) {
  const badgeTone: Tone = tone === "healthy" ? "success" : tone === "warning" ? "warning" : tone === "critical" ? "danger" : "neutral";
  return (
    <Badge tone={badgeTone} className={className}>
      <span aria-hidden="true" className="font-bold">
        {statusGlyph[tone]}
      </span>
      {label}
    </Badge>
  );
}

export function StatusDot({ tone, label }: { tone: StatusTone; label?: string }) {
  return (
    <span className={`ui-status ui-status-${tone}`}>
      <span className="ui-status-dot" aria-hidden="true" />
      {label ? <span>{label}</span> : null}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Alerts                                                              */
/* ------------------------------------------------------------------ */

export function Alert({
  tone = "neutral",
  title,
  children,
  icon: Icon,
  role,
  className = "",
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  icon?: IconComponent;
  role?: "alert" | "status";
  className?: string;
}) {
  return (
    <div className={`ui-alert ui-alert-${tone} ${className}`.trim()} role={role}>
      {Icon ? <Icon size={17} className="mt-0.5 shrink-0" aria-hidden="true" /> : null}
      <div className="min-w-0">
        {title ? <p className="ui-alert-title">{title}</p> : null}
        {children ? <div className={title ? "mt-0.5" : undefined}>{children}</div> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fields                                                              */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="ui-field">
      <label className="ui-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="ui-hint text-[#b42318]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="ui-hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({ className = "", invalid = false, ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={`ui-input ${invalid ? "ui-input-error" : ""} ${className}`.trim()} aria-invalid={invalid || undefined} {...rest} />;
}

export function TextArea({ className = "", invalid = false, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea className={`ui-textarea ${invalid ? "ui-input-error" : ""} ${className}`.trim()} aria-invalid={invalid || undefined} {...rest} />;
}

export function Select({ className = "", children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`ui-select ${className}`.trim()} {...rest}>
      {children}
    </select>
  );
}

/* ------------------------------------------------------------------ */
/* Loading + empty states                                              */
/* ------------------------------------------------------------------ */

export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`ui-skeleton block ${className}`.trim()} />;
}

export function SkeletonRows({ rows = 4, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-[10px]" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overlays                                                            */
/* ------------------------------------------------------------------ */

export function Overlay({ onClick }: { onClick?: () => void }) {
  return <div className="ui-overlay" onClick={onClick} aria-hidden="true" />;
}

/** Escape closes an open overlay and focus moves into its panel. */
function useDialogKeyboard(
  open: boolean,
  onClose: () => void,
  panelRef: { current: HTMLElement | null },
) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, panelRef]);
}

export function Drawer({
  open,
  title,
  onClose,
  children,
  footer,
  labelId = "drawer-title",
}: {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  labelId?: string;
}) {
  const panelRef = useRef<HTMLElement>(null);

  useDialogKeyboard(open, onClose, panelRef);

  if (!open) return null;
  return (
    <>
      <Overlay onClick={onClose} />
      <aside ref={panelRef} tabIndex={-1} className="ui-drawer" role="dialog" aria-modal="true" aria-labelledby={labelId}>
        <div className="ui-sheet-head">
          <h2 id={labelId} className="ui-section-title">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="ui-btn ui-btn-ghost ui-btn-sm" aria-label="Close panel">
            Close
          </button>
        </div>
        <div className="ui-sheet-body flex-1 overflow-y-auto">{children}</div>
        {footer ? <div className="ui-sheet-foot">{footer}</div> : null}
      </aside>
    </>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  labelId = "modal-title",
}: {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  labelId?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useDialogKeyboard(open, onClose, panelRef);

  if (!open) return null;
  return (
    <>
      <Overlay onClick={onClose} />
      <div ref={panelRef} tabIndex={-1} className="ui-modal" role="dialog" aria-modal="true" aria-labelledby={labelId}>
        <div className="ui-sheet-head">
          <h2 id={labelId} className="ui-section-title">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="ui-btn ui-btn-ghost ui-btn-sm" aria-label="Close dialog">
            Close
          </button>
        </div>
        <div className="ui-sheet-body">{children}</div>
        {footer ? <div className="ui-sheet-foot">{footer}</div> : null}
      </div>
    </>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? "danger" : "primary"} onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description ? <p className="text-[13px] leading-6 text-[#475467]">{description}</p> : null}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs + toasts                                                       */
/* ------------------------------------------------------------------ */

export function Tabs({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: Array<{ id: string; label: string }>;
  active: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <div className="ui-tabs" role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={active === tab.id}
          className="ui-tab"
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Toast({
  tone = "info",
  title,
  children,
  icon: Icon,
}: {
  tone?: "info" | "success" | "error";
  title?: ReactNode;
  children?: ReactNode;
  icon?: IconComponent;
}) {
  return (
    <div className={`ui-toast ui-toast-${tone}`} role={tone === "error" ? "alert" : "status"}>
      {Icon ? <Icon size={17} className="mt-0.5 shrink-0" aria-hidden="true" /> : null}
      <div className="min-w-0">
        {title ? <p className="font-bold text-[#101828]">{title}</p> : null}
        {children ? <div className="mt-0.5 text-[12px] text-[#475467]">{children}</div> : null}
      </div>
    </div>
  );
}
