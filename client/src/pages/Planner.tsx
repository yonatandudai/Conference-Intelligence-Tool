import { useEffect, useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import api from '../api';
import type { Conference } from '../types';
import toast from 'react-hot-toast';

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function confStatus(c: Conference) {
  if (!c.attending) return 'none';
  return new Date(c.date) < TODAY ? 'attended' : 'going';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East & Africa'];
const QUARTER_LABELS = ['Q1 (Jan–Mar)', 'Q2 (Apr–Jun)', 'Q3 (Jul–Sep)', 'Q4 (Oct–Dec)'];

const TIER_DOT: Record<string, string> = {
  'Tier 1': 'bg-green-500',
  'Tier 2': 'bg-yellow-400',
  'Tier 3': 'bg-gray-300',
};

const CELL_BG: Record<string, string> = {
  'Tier 1': 'bg-green-50 border-green-200 hover:bg-green-100',
  'Tier 2': 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
  'Tier 3': 'bg-gray-50 border-gray-100 hover:bg-gray-100',
};

const TIER_BADGE: Record<string, string> = {
  'Tier 1': 'bg-green-100 text-green-700',
  'Tier 2': 'bg-yellow-100 text-yellow-700',
  'Tier 3': 'bg-gray-100 text-gray-500',
};

function groupByMonth(conferences: Conference[]) {
  const groups: Record<number, Conference[]> = {};
  for (let i = 0; i < 12; i++) groups[i] = [];
  conferences.forEach((c) => {
    groups[new Date(c.date).getMonth()].push(c);
  });
  return groups;
}

function groupByRegion(conferences: Conference[]) {
  return conferences.reduce<Record<string, Conference[]>>((acc, c) => {
    (acc[c.region] = acc[c.region] || []).push(c);
    return acc;
  }, {});
}

// Conferences within 30 days and same region are considered a "cluster opportunity"
function findClusters(conferences: Conference[]) {
  const clusters: Array<Conference[]> = [];
  const sorted = [...conferences].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let i = 0;
  while (i < sorted.length) {
    const group = [sorted[i]];
    let j = i + 1;
    while (j < sorted.length) {
      const daysDiff = (new Date(sorted[j].date).getTime() - new Date(sorted[i].date).getTime()) / 86400000;
      if (daysDiff <= 30 && sorted[j].region === sorted[i].region) {
        group.push(sorted[j]);
        j++;
      } else break;
    }
    if (group.length >= 2) clusters.push(group);
    i = j === i + 1 ? i + 1 : j;
  }
  return clusters;
}

function getBestTier(confs: Conference[]): 'Tier 1' | 'Tier 2' | 'Tier 3' | null {
  if (!confs.length) return null;
  if (confs.some((c) => c.tier === 'Tier 1')) return 'Tier 1';
  if (confs.some((c) => c.tier === 'Tier 2')) return 'Tier 2';
  return 'Tier 3';
}

export default function Planner() {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [view, setView] = useState<'timeline' | 'region' | 'matrix'>('timeline');
  const [selectedCell, setSelectedCell] = useState<{ region: string; month: number } | null>(null);

  useEffect(() => {
    api.get('/conferences', { params: { sort: 'date' } })
      .then((r) => {
        const data: Conference[] = r.data;
        setConferences(data);
        // If the current year has no conferences, switch to the year with the most data
        const currentYear = new Date().getFullYear();
        const hasCurrentYear = data.some((c) => new Date(c.date).getFullYear() === currentYear);
        if (!hasCurrentYear && data.length > 0) {
          const yearCounts = data.reduce<Record<number, number>>((acc, c) => {
            const y = new Date(c.date).getFullYear();
            acc[y] = (acc[y] || 0) + 1;
            return acc;
          }, {});
          const bestYear = +Object.entries(yearCounts).sort(([, a], [, b]) => b - a)[0][0];
          setYear(bestYear);
        }
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const yearConfs = conferences.filter((c) => new Date(c.date).getFullYear() === year);
  const attending = yearConfs.filter((c) => c.attending);
  const going = yearConfs.filter((c) => confStatus(c) === 'going');
  const attended = yearConfs.filter((c) => confStatus(c) === 'attended');
  const monthGroups = groupByMonth(yearConfs);
  const regionGroups = groupByRegion(yearConfs);
  const clusters = findClusters(yearConfs);

  // Coverage gap signals
  const emptyMonths = Object.entries(monthGroups)
    .filter(([, confs]) => confs.length === 0)
    .map(([m]) => MONTHS[+m]);

  // Months that have Tier 1 events but none are attended
  const missedTier1Months = Object.entries(monthGroups)
    .filter(([, confs]) => confs.some((c) => c.tier === 'Tier 1') && !confs.some((c) => c.tier === 'Tier 1' && c.attending))
    .map(([m]) => MONTHS[+m]);

  // Quarters with zero attending events
  const emptyAttendingQuarters = [0, 1, 2, 3]
    .filter((q) => [q * 3, q * 3 + 1, q * 3 + 2].every((m) => monthGroups[m].filter((c) => c.attending).length === 0))
    .map((q) => QUARTER_LABELS[q]);

  const hasGaps = emptyMonths.length > 0 || missedTier1Months.length > 0 || emptyAttendingQuarters.length > 0;

  // Matrix helpers
  const cellConfs = (region: string, month: number) =>
    yearConfs.filter((c) => c.region === region && new Date(c.date).getMonth() === month);

  const selectedConfs = selectedCell
    ? cellConfs(selectedCell.region, selectedCell.month).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    : [];

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planner</h1>
          <p className="text-sm text-gray-500 mt-1">
            {going.length > 0 && <span className="text-amber-600 font-medium">{going.length} going</span>}
            {going.length > 0 && attended.length > 0 && <span> · </span>}
            {attended.length > 0 && <span className="text-green-600 font-medium">{attended.length} attended</span>}
            {(going.length > 0 || attended.length > 0) && <span> · </span>}
            {yearConfs.length} total in {year}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden text-sm">
            {(['timeline', 'region', 'matrix'] as const).map((v) => (
              <button
                key={v}
                onClick={() => { setView(v); setSelectedCell(null); }}
                className={`px-3 py-2 capitalize ${view === v ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {v}
              </button>
            ))}
          </div>
          <select
            value={year}
            onChange={(e) => { setYear(+e.target.value); setSelectedCell(null); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            {[2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Cluster opportunities */}
      {clusters.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
            <MapPin className="w-4 h-4" /> Trip Clustering Opportunities
          </p>
          <div className="space-y-1.5">
            {clusters.map((group, i) => (
              <div key={i} className="text-sm text-amber-700">
                <strong>{group[0].region}:</strong>{' '}
                {group
                  .map((c) => `${c.name} (${new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`)
                  .join(' + ')}
                {' '}— combine into one trip
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coverage gaps */}
      {hasGaps && (
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-gray-400" /> Coverage Gaps
          </p>
          {emptyMonths.length > 0 && (
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-600">No events: </span>
              {emptyMonths.join(', ')}
            </p>
          )}
          {missedTier1Months.length > 0 && (
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-600">Tier 1 events not attended: </span>
              {missedTier1Months.join(', ')}
            </p>
          )}
          {emptyAttendingQuarters.length > 0 && (
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-600">No attendance planned: </span>
              {emptyAttendingQuarters.join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Views */}
      {view === 'timeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MONTHS.map((month, i) => {
            const confs = monthGroups[i];
            return (
              <div key={month} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 text-sm">{month} {year}</h3>
                  <span className="text-xs text-gray-400">{confs.length} events</span>
                </div>
                {confs.length === 0 ? (
                  <p className="text-xs text-gray-300 italic">No events</p>
                ) : (
                  <div className="space-y-2">
                    {confs.map((c) => (
                      <div key={c._id} className="flex items-start gap-2">
                        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${TIER_DOT[c.tier]}`} />
                        <div>
                          <p className="text-xs font-medium text-gray-800 leading-tight">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.city} · {new Date(c.date).getDate()}</p>
                        </div>
                        {confStatus(c) === 'going' && <span className="ml-auto text-xs text-amber-600 font-medium shrink-0">Going</span>}
                        {confStatus(c) === 'attended' && <span className="ml-auto text-xs text-green-600 font-medium shrink-0">Attended</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === 'region' && (
        <div className="space-y-4">
          {Object.entries(regionGroups)
            .sort(([, a], [, b]) => b.length - a.length)
            .map(([region, confs]) => (
              <div key={region} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">{region}</h3>
                  <span className="text-sm text-gray-400">{confs.length} events</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {confs
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((c) => (
                      <div key={c._id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                        <span className={`w-2 h-2 rounded-full ${TIER_DOT[c.tier]}`} />
                        <span className="text-xs text-gray-700">{c.name}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        {confStatus(c) === 'going' && <span className="text-xs text-amber-600 font-medium">Going</span>}
                    {confStatus(c) === 'attended' && <span className="text-xs text-green-600 font-medium">Attended</span>}
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {view === 'matrix' && (
        <div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
            <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '140px' }} />
                {MONTHS.map((m) => <col key={m} />)}
              </colgroup>
              <thead>
                <tr>
                  <th className="px-3 py-3 bg-gray-50 border-b border-r border-gray-200 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Region
                  </th>
                  {MONTHS.map((m) => (
                    <th key={m} className="px-1 py-3 bg-gray-50 border-b border-r border-gray-200 last:border-r-0 text-center text-xs font-semibold text-gray-500">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REGIONS.map((region) => (
                  <tr key={region} className="border-b border-gray-200 last:border-b-0">
                    <td className="px-3 py-2 border-r border-gray-200 align-middle">
                      <span className="text-xs font-medium text-gray-700 leading-tight">{region}</span>
                    </td>
                    {MONTHS.map((_, mi) => {
                      const confs = cellConfs(region, mi);
                      const bestTier = getBestTier(confs);
                      const hasGoing = confs.some((c) => confStatus(c) === 'going');
                      const hasAttended = confs.some((c) => confStatus(c) === 'attended');
                      const isSelected = selectedCell?.region === region && selectedCell?.month === mi;

                      return (
                        <td
                          key={mi}
                          onClick={() => {
                            if (!confs.length) return;
                            setSelectedCell(isSelected ? null : { region, month: mi });
                          }}
                          className={[
                            'border-r border-gray-200 last:border-r-0 p-1.5 align-top',
                            'transition-colors',
                            confs.length ? 'cursor-pointer' : '',
                            bestTier ? CELL_BG[bestTier] : 'bg-white',
                            isSelected ? 'ring-2 ring-inset ring-amber-400' : '',
                          ].join(' ')}
                          style={{ minHeight: '56px', height: '56px' }}
                        >
                          {confs.length > 0 && (
                            <div className="flex flex-col h-full gap-0.5">
                              <div className="flex items-start justify-between">
                                <span className="text-xs font-bold text-gray-700 leading-none">{confs.length}</span>
                                <span className="flex gap-0.5">
                                  {hasGoing && <span className="text-[10px] leading-none text-amber-500 font-bold">Go</span>}
                                  {hasAttended && <span className="text-[10px] leading-none text-green-600 font-bold">✓</span>}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-0.5 mt-auto">
                                {confs.slice(0, 6).map((c) => (
                                  <span key={c._id} className={`w-1.5 h-1.5 rounded-full ${TIER_DOT[c.tier]}`} />
                                ))}
                                {confs.length > 6 && (
                                  <span className="text-[9px] text-gray-400 leading-none">+{confs.length - 6}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Selected cell detail */}
          {selectedCell && selectedConfs.length > 0 && (
            <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700">
                  {selectedCell.region} — {MONTHS[selectedCell.month]} {year}
                </p>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  close ×
                </button>
              </div>
              <div className="space-y-2">
                {selectedConfs.map((c) => (
                  <div key={c._id} className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${TIER_DOT[c.tier]}`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-800">{c.name}</span>
                      <span className="text-xs text-gray-400 ml-2">
                        {c.city} · {new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_BADGE[c.tier]}`}>
                      {c.tier}
                    </span>
                    <span className="text-xs text-gray-400 w-8 text-right">{c.icpScore}</span>
                    {confStatus(c) === 'going' && (
                      <span className="text-xs text-amber-600 font-semibold whitespace-nowrap">Going</span>
                    )}
                    {confStatus(c) === 'attended' && (
                      <span className="text-xs text-green-600 font-semibold whitespace-nowrap">Attended ✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
            <span>Cell color = best tier present</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Tier 1</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Tier 2</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300" /> Tier 3</span>
            <span className="text-amber-500 font-medium">Go = going</span>
            <span className="text-green-600 font-medium">✓ = attended</span>
            <span>Click any cell to see events</span>
          </div>
        </div>
      )}

      {/* Legend for timeline/region views */}
      {view !== 'matrix' && (
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> Tier 1</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Tier 2</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-300" /> Tier 3</span>
          <span className="text-amber-600 font-medium">Going</span>
          <span className="text-green-600 font-medium">Attended</span>
        </div>
      )}
    </div>
  );
}
