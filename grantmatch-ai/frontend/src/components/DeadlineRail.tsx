type DeadlineRailProps = {
  deadline: string;
};

function daysUntil(deadline: string) {
  const now = new Date();
  const due = new Date(deadline);
  const diff = due.getTime() - now.getTime();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
}

export default function DeadlineRail({ deadline }: DeadlineRailProps) {
  const daysLeft = daysUntil(deadline);
  const urgency = daysLeft <= 14 ? "High" : daysLeft <= 30 ? "Medium" : "Low";
  const tone = daysLeft <= 14 ? "bg-[#6a1f12]" : daysLeft <= 30 ? "bg-[#b45a37]" : "bg-moss";

  return (
    <div className="rounded-[24px] border border-[#d9d1c3] bg-sand/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-moss/75">Deadline tracker</p>
          <h3 className="mt-2 text-xl font-semibold text-ink">{daysLeft} days remaining</h3>
        </div>
        <span className={`${tone} rounded-full px-3 py-2 text-sm font-semibold text-white`}>{urgency} urgency</span>
      </div>
      <p className="mt-4 text-sm leading-6 text-ink/80">Target deadline: {deadline}. The dashboard should flag this opportunity early enough to plan data collection, board approval, and final submission review.</p>
    </div>
  );
}
