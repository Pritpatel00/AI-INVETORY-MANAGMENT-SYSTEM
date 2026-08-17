import { ShieldCheck } from "lucide-react";

export function LoadingState({ title, description }: { title?: string; description?: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f3f7fc] px-5 text-[#17345f]">
      <div className="rounded-[24px] border border-[#dfe7f2] bg-white px-8 py-7 text-center shadow-[0_20px_55px_rgba(15,45,85,0.1)]">
        <div className="mx-auto grid h-12 w-12 animate-pulse place-items-center rounded-2xl bg-[#edf4ff] text-[#155eef]">
          <ShieldCheck size={23} />
        </div>
        <p className="mt-4 text-sm font-extrabold text-[#17345f]">{title ?? "Checking secure session\u2026"}</p>
        <p className="mt-1 text-xs text-[#7b8fa9]">{description ?? "Connecting to Inventory Management identity services"}</p>
      </div>
    </main>
  );
}