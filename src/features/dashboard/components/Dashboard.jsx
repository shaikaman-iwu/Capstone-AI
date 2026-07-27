import {
  Clock, TrendingDown, CheckCircle2, AlertCircle, Users, BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, Cell,
} from "recharts";
import { BASELINE_MIN } from "../../../shared/constants";
import { T } from "../../../shared/theme/tokens";
import Pill from "../../../shared/components/ui/Pill";

function aggregateByProvider(visits) {
  const map = new Map();
  visits.forEach((v) => {
    if (!map.has(v.provider)) {
      map.set(v.provider, { provider: v.provider, specialty: v.specialty, count: 0, totalMin: 0, minor: 0 });
    }
    const row = map.get(v.provider);
    row.count += 1;
    row.totalMin += v.docMinutes;
    if (v.minorEditOnly) row.minor += 1;
  });
  return Array.from(map.values())
    .map((r) => ({ ...r, avgMin: r.totalMin / r.count, pctMinor: (r.minor / r.count) * 100 }))
    .sort((a, b) => b.avgMin - a.avgMin);
}

export default function Dashboard({ visits, backlogCount, mode, providerName }) {
  const scoped = mode === "practice" ? visits : visits.filter((v) => v.provider === providerName);
  const signed = scoped.filter((v) => v.signed);
  const sessionCount = scoped.filter((v) => v.signed && !v.seed).length;

  const avg = signed.length ? signed.reduce((a, v) => a + v.docMinutes, 0) / signed.length : 0;
  const pctMinor = signed.length ? (signed.filter((v) => v.minorEditOnly).length / signed.length) * 100 : 0;
  const savedPerVisit = Math.max(BASELINE_MIN - avg, 0);
  const visitsPerWeekAssumption = mode === "practice" ? 420 : 90;
  const weeklyProjection = savedPerVisit * visitsPerWeekAssumption;

  const sorted = [...signed].sort((a, b) => (a.date > b.date ? 1 : -1));
  const chartData = sorted.map((v) => ({
    name: v.patientName,
    minutes: Number(v.docMinutes.toFixed(1)),
    seed: !!v.seed,
  }));

  const providerRows = mode === "practice" ? aggregateByProvider(signed) : [];

  const stats = [
    { label: "Avg. documentation time", value: signed.length ? `${avg.toFixed(1)} min` : "—", icon: Clock, sub: `vs ${BASELINE_MIN} min baseline` },
    { label: "Est. weekly time saved", value: `${Math.round(weeklyProjection)} min`, icon: TrendingDown, sub: `at ~${visitsPerWeekAssumption} visits/week` },
    { label: "Notes needing minor edits only", value: `${Math.round(pctMinor)}%`, icon: CheckCircle2, sub: "target ≥ 96%" },
    { label: "Notes awaiting signature", value: backlogCount, icon: AlertCircle, sub: "current backlog" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h2 style={{ fontFamily: "Source Serif 4", color: T.ink }} className="text-2xl font-semibold mb-1">
        {mode === "practice" ? "Practice dashboard" : "My dashboard"}
      </h2>
      <p style={{ color: T.muted, fontFamily: "Inter" }} className="text-sm mb-5">
        {mode === "practice"
          ? `${providerRows.length} providers · ${signed.length} notes over the last 2 weeks`
          : `${signed.length} notes over the last 2 weeks`}
        {sessionCount > 0 && (
          <span style={{ color: T.teal }}> · {sessionCount} signed this session</span>
        )}
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="rounded-lg border p-4" style={{ backgroundColor: T.raised, borderColor: T.line }}>
            <s.icon size={16} style={{ color: T.teal }} />
            <div style={{ fontFamily: "IBM Plex Mono", color: T.ink }} className="text-2xl font-semibold mt-2">
              {s.value}
            </div>
            <div style={{ fontFamily: "Inter", color: T.inkSoft }} className="text-xs mt-1">{s.label}</div>
            <div style={{ fontFamily: "Inter", color: T.muted }} className="text-[11px]">{s.sub}</div>
          </div>
        ))}
      </div>

      {mode === "practice" && providerRows.length > 0 && (
        <div className="rounded-lg border p-4 mb-6" style={{ backgroundColor: T.raised, borderColor: T.line }}>
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} style={{ color: T.ink }} />
            <h3 style={{ fontFamily: "Source Serif 4", color: T.ink }} className="font-semibold">
              By provider
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ fontFamily: "Inter" }}>
              <thead>
                <tr style={{ color: T.muted }} className="text-left text-xs">
                  <th className="pb-2 font-medium">Provider</th>
                  <th className="pb-2 font-medium">Specialty</th>
                  <th className="pb-2 font-medium">Notes</th>
                  <th className="pb-2 font-medium">Avg. time</th>
                  <th className="pb-2 font-medium">Minor edits only</th>
                </tr>
              </thead>
              <tbody>
                {providerRows.map((r, i) => {
                  const timeFlag = r.avgMin > BASELINE_MIN * 0.75;
                  const qualityFlag = r.pctMinor < 90;
                  return (
                    <tr key={i} className="border-t" style={{ borderColor: T.line }}>
                      <td className="py-2" style={{ color: T.ink, fontWeight: 500 }}>{r.provider}</td>
                      <td className="py-2" style={{ color: T.muted }}>{r.specialty}</td>
                      <td className="py-2" style={{ color: T.inkSoft, fontFamily: "IBM Plex Mono" }}>{r.count}</td>
                      <td className="py-2">
                        <span style={{ color: timeFlag ? T.brick : T.inkSoft, fontFamily: "IBM Plex Mono", fontWeight: timeFlag ? 600 : 400 }}>
                          {r.avgMin.toFixed(1)} min
                        </span>
                      </td>
                      <td className="py-2">
                        <Pill tone={qualityFlag ? "brick" : "teal"}>{Math.round(r.pctMinor)}%</Pill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ color: T.muted, fontFamily: "Inter" }} className="text-[11px] mt-3">
            Flagged in red: average time above 75% of baseline, or minor-edit rate below 90% — both worth a documentation check-in.
          </p>
        </div>
      )}

      <div className="rounded-lg border p-4" style={{ backgroundColor: T.raised, borderColor: T.line }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} style={{ color: T.ink }} />
            <h3 style={{ fontFamily: "Source Serif 4", color: T.ink }} className="font-semibold">
              Documentation time per visit
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[11px]" style={{ fontFamily: "Inter", color: T.muted }}>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: T.line }} /> Prior history</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: T.teal }} /> This session</span>
          </div>
        </div>
        {chartData.length === 0 ? (
          <p style={{ color: T.muted, fontFamily: "Inter" }} className="text-sm py-10 text-center">
            Sign a note to see it charted here against the {BASELINE_MIN}-minute baseline.
          </p>
        ) : (
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 30 }}>
                <CartesianGrid stroke={T.line} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fontFamily: "Inter", fill: T.muted }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  height={50}
                />
                <YAxis tick={{ fontSize: 11, fontFamily: "Inter", fill: T.muted }} />
                <Tooltip
                  contentStyle={{ fontFamily: "Inter", fontSize: 12, borderColor: T.line }}
                  formatter={(v, _name, item) => [`${v} min`, item.payload.seed ? "Prior visit" : "This session"]}
                />
                <ReferenceLine y={BASELINE_MIN} stroke={T.brick} strokeDasharray="4 4" label={{ value: "Baseline", fontSize: 11, fill: T.brick, fontFamily: "Inter" }} />
                <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.seed ? T.line : T.teal} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
