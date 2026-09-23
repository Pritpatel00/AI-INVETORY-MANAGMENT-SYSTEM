import { type FC } from "react";

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  icon: FC<{ size?: number; strokeWidth?: number }>;
  tone?: "blue" | "green" | "amber" | "violet";
  onClick?: () => void;
  selected?: boolean;
}

const toneText: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  blue: "text-[#155eef]",
  green: "text-[#067647]",
  amber: "text-[#b54708]",
  violet: "text-[#5925dc]",
};

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "blue",
  onClick,
  selected = false,
}: MetricCardProps) {
  const content = (
    <>
      <div className="flex w-full items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#667085]">{label}</p>
        <span className={toneText[tone]} aria-hidden="true">
          <Icon size={17} strokeWidth={2} />
        </span>
      </div>
      <p className="mt-3 text-[26px] font-bold leading-none tracking-[-0.02em] text-[#101828] tabular-nums">{value}</p>
      <p className="mt-2 text-[12px] font-medium leading-5 text-[#475467]">{detail}</p>
      {onClick && (
        <span className={`mt-4 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] ${toneText[tone]}`}>
          View details
          <span aria-hidden="true">→</span>
        </span>
      )}
    </>
  );

  const cardClass = `metric-card-3d metric-tone-${tone} flex w-full flex-col items-start rounded-[12px] bg-white p-5 text-left ${
    selected ? "border-[#155eef] ring-2 ring-[#d1e0ff]" : ""
  }`;

  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={selected} className={cardClass}>
      {content}
    </button>
  ) : (
    <article className={cardClass}>{content}</article>
  );
}
