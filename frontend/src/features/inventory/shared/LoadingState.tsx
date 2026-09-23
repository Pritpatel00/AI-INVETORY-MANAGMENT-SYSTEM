import { ShieldCheck } from "lucide-react";

export function LoadingState({ title, description }: { title?: string; description?: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f5f7] px-5 text-[#101828]" role="status" aria-live="polite">
      <div className="rounded-[12px] border border-[#e4e7ec] bg-white px-8 py-7 text-center shadow-[0_1px_3px_rgba(16,24,40,0.08)]">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-[10px] border border-[#e4e7ec] bg-[#f9fafb] text-[#155eef]">
          <ShieldCheck size={21} aria-hidden="true" />
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="ui-spinner ui-spinner-dark" aria-hidden="true" />
          <p className="text-[14px] font-bold text-[#101828]">{title ?? "Checking secure session…"}</p>
        </div>
        <p className="mt-1 text-[12px] text-[#667085]">
          {description ?? "Connecting to Inventory Management identity services"}
        </p>
      </div>
    </main>
  );
}
