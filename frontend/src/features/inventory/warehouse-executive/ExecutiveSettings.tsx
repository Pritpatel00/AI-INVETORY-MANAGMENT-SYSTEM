"use client";

import { UserRound, Mic, Volume2, Wifi, WifiOff, LogOut, PackageCheck, ChevronDown } from "lucide-react";

interface ExecutiveSettingsProps {
  workerName: string;
  isOnline: boolean;
  pendingSyncCount: number;
  syncState: string;
  microphoneStatus: string;
  speakerStatus: string;
  onCheckMicrophone: () => void;
  onTestSpeaker: () => void;
  onSignOut: () => void;
  onBack: () => void;
}

export function ExecutiveSettings({
  workerName, isOnline, pendingSyncCount, syncState,
  microphoneStatus, speakerStatus,
  onCheckMicrophone, onTestSpeaker, onSignOut, onBack,
}: ExecutiveSettingsProps) {
  return (
    <section className="rounded-[24px] border border-[#dce6f3] bg-white shadow-[0_14px_42px_rgba(16,45,82,0.055)]">
      <div className="flex flex-col gap-4 border-b border-[#e6edf6] bg-[#f7faff] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#155eef]">Settings</p>
          <h2 className="mt-1 text-xl font-extrabold text-[#102a56]">Warehouse Executive settings</h2>
          <p className="mt-1 text-xs font-semibold text-[#7b8fa9]">Your profile, device tests and application information.</p>
        </div>
        <button type="button" onClick={onBack} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#c9d8ee] bg-white px-3 text-xs font-extrabold text-[#155eef]">
          <ChevronDown size={15} className="rotate-90" /> Home
        </button>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e8effb] text-[#244a7e]"><UserRound size={20} /></span>
              <div>
                <p className="text-xs font-extrabold text-[#17345f]">{workerName}</p>
                <p className="text-[10px] font-semibold text-[#8295af]">Warehouse Executive</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-4">
            <div className="flex items-center gap-3">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isOnline ? "bg-[#eaf8f1] text-[#16865b]" : "bg-[#fff4df] text-[#b36d0c]"}`}>
                {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
              </span>
              <div>
                <p className="text-xs font-extrabold text-[#17345f]">{isOnline ? "Online" : "Offline"}</p>
                <p className="text-[10px] font-semibold text-[#8295af]">
                  {isOnline
                    ? pendingSyncCount > 0
                      ? `${pendingSyncCount} update${pendingSyncCount === 1 ? "" : "s"} waiting`
                      : syncState === "syncing" ? "Synchronizing…" : "Connected"
                    : `${pendingSyncCount} saved update${pendingSyncCount === 1 ? "" : "s"}`}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f2efff] text-[#6349c1]"><PackageCheck size={20} /></span>
              <div>
                <p className="text-xs font-extrabold text-[#17345f]">Application version</p>
                <p className="text-[10px] font-semibold text-[#8295af]">Nirka Inventory v0.1.0</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#edf4ff] text-[#155eef]"><Mic size={20} /></span>
              <div>
                <p className="text-xs font-extrabold text-[#17345f]">Microphone</p>
                <p className="mt-1 text-[10px] font-semibold leading-4 text-[#7186a3]">{microphoneStatus}</p>
                <button type="button" onClick={onCheckMicrophone} className="mt-3 h-10 rounded-xl bg-[#155eef] px-4 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(21,94,239,0.22)]">
                  Check microphone
                </button>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-[#e2e9f3] bg-[#f9fbfd] p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eaf8f1] text-[#16865b]"><Volume2 size={20} /></span>
              <div>
                <p className="text-xs font-extrabold text-[#17345f]">Speaker</p>
                <p className="mt-1 text-[10px] font-semibold leading-4 text-[#7186a3]">{speakerStatus || "Test spoken guidance on this device."}</p>
                <button type="button" onClick={onTestSpeaker} className="mt-3 h-10 rounded-xl bg-[#16865b] px-4 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(22,134,91,0.22)]">
                  Test speaker
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-[#efb5b5] bg-[#fff6f6] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fce4e4] text-[#b83f3f]"><LogOut size={20} /></span>
              <div>
                <p className="text-xs font-extrabold text-[#17345f]">Sign out</p>
                <p className="text-[10px] font-semibold text-[#7186a3]">End your session and return to the sign-in screen.</p>
              </div>
            </div>
            <button type="button" onClick={onSignOut} className="h-10 rounded-xl bg-[#b83f3f] px-4 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(184,63,63,0.22)]">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}