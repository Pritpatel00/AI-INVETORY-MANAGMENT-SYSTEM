import { type FC } from "react";
import { AnimatedCounter } from "./AnimationUtils";

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  icon: FC<{ size?: number; strokeWidth?: number }>;
  tone?: "blue" | "green" | "amber" | "violet";
  onClick?: () => void;
  selected?: boolean;
}

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "blue",
  onClick,
  selected = false,
}: MetricCardProps) {
  const tones = {
    blue: "bg-[#edf4ff] text-[#155eef]",
    green: "bg-[#eaf8f1] text-[#16865b]",
    amber: "bg-[#fff5df] text-[#d47b08]",
    violet: "bg-[#f2efff] text-[#7257d6]",
  };

  const validNumber =
    value !== "—" && value !== "" && !isNaN(Number(value.replace(/[^0-9.-]/g, "")));
  const numericValue = validNumber ? Number(value.replace(/[^0-9.-]/g, "")) : null;

  const content = (
    <>
      <span className="metric-card-glow" aria-hidden="true" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#657a99]">{label}</p>
          <p className="mt-2 text-[28px] font-extrabold tracking-[-0.04em] text-[#112c57]">
            {numericValue !== null ? (
              <AnimatedCounter value={numericValue} key={numericValue} />
            ) : (
              value
            )}
          </p>
          <p className="mt-1.5 text-xs font-medium text-[#8b9db7]">{detail}</p>
        </div>
        <div
          className={`metric-icon-orbit grid h-12 w-12 shrink-0 place-items-center rounded-2xl shadow-lg ${tones[tone]}`}
          style={{
            boxShadow: `0 8px 20px rgba(21,94,239,0.12)`,
          }}
        >
          <Icon size={22} strokeWidth={2} />
        </div>
      </div>
      {onClick && (
        <span className="mt-5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#155eef] transition-all group-hover:gap-2.5">
          View details →
        </span>
      )}
      <span className="metric-card-track" aria-hidden="true"><span /></span>
    </>
  );

  const cardClass = `metric-card-3d metric-tone-${tone} w-full rounded-[22px] bg-white/95 p-6 text-left backdrop-blur group ${
    selected ? "border-[#78a5ee] ring-4 ring-[#dce9ff]" : "border-[#e3eaf5]"
  }`;

  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={selected} className={cardClass}>
      {content}
    </button>
  ) : (
    <article className={cardClass}>{content}</article>
  );
}
