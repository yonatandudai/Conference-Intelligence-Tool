import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, MapPin, TrendingUp, Users } from 'lucide-react';
import api from '../api';
import type { Conference } from '../types';
import toast from 'react-hot-toast';

const TIER_COLORS = {
  'Tier 1': 'bg-green-100 text-green-800',
  'Tier 2': 'bg-yellow-100 text-yellow-800',
  'Tier 3': 'bg-gray-100 text-gray-600',
};

const TIER_RANK = { 'Tier 1': 1, 'Tier 2': 2, 'Tier 3': 3 };

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function attendingStatus(conf: { attending: boolean; date: string }) {
  if (!conf.attending) return 'none';
  return new Date(conf.date) < TODAY ? 'attended' : 'going';
}

const SCORE_COLOR = (score: number) => {
  if (score >= 75) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-gray-500';
};

type SortCol = 'score' | 'date' | 'attendees' | 'tier';

function SortIcon({ col, active, dir }: { col: SortCol; active: SortCol; dir: 'asc' | 'desc' }) {
  if (col !== active) return <ChevronDown className="w-3 h-3 opacity-25 ml-0.5" />;
  return dir === 'desc'
    ? <ChevronDown className="w-3 h-3 ml-0.5" />
    : <ChevronUp className="w-3 h-3 ml-0.5" />;
}

export default function Conferences() {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [filterVertical, setFilterVertical] = useState('');
  const [filterAttending, setFilterAttending] = useState(false);
  const [sortCol, setSortCol] = useState<SortCol>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchConferences = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filterRegion) params.region = filterRegion;
      if (filterTier) params.tier = filterTier;
      if (filterVertical) params.vertical = filterVertical;
      if (filterAttending) params.attending = 'true';
      const res = await api.get('/conferences', { params });
      setConferences(res.data);
    } catch {
      toast.error('Failed to load conferences');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConferences(); }, [search, filterRegion, filterTier, filterVertical, filterAttending]);

  const displayed = useMemo(() => {
    return [...conferences].sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'score') cmp = a.icpScore - b.icpScore;
      else if (sortCol === 'date') cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortCol === 'attendees') cmp = a.estimatedAttendees - b.estimatedAttendees;
      else if (sortCol === 'tier') cmp = TIER_RANK[a.tier] - TIER_RANK[b.tier];
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [conferences, sortCol, sortDir]);

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  const toggleAttending = async (conf: Conference) => {
    try {
      await api.patch(`/conferences/${conf._id}`, { attending: !conf.attending });
      setConferences((prev) =>
        prev.map((c) => (c._id === conf._id ? { ...c, attending: !c.attending } : c))
      );
    } catch {
      toast.error('Failed to update');
    }
  };

  const thClass = (col?: SortCol) =>
    `px-4 py-3 text-xs text-gray-500 uppercase tracking-wide select-none${col ? ' cursor-pointer hover:bg-gray-100 transition-colors' : ''}`;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Conferences</h1>
        <p className="text-sm text-gray-500 mt-1">{conferences.length} events</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search conferences..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <select
          value={filterRegion}
          onChange={(e) => setFilterRegion(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="">All Regions</option>
          <option>North America</option>
          <option>Europe</option>
          <option>Asia Pacific</option>
          <option>Latin America</option>
          <option>Middle East & Africa</option>
        </select>
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="">All Tiers</option>
          <option>Tier 1</option>
          <option>Tier 2</option>
        </select>
        <select
          value={filterVertical}
          onChange={(e) => setFilterVertical(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="">All Verticals</option>
          <option value="fintech">Fintech</option>
          <option value="payments">Payments</option>
          <option value="travel">Travel</option>
          <option value="saas">SaaS</option>
        </select>
        <button
          onClick={() => setFilterAttending((v) => !v)}
          className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
            filterAttending
              ? 'bg-amber-500 border-amber-500 text-white'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          My Conferences
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className={`${thClass('score')} text-center w-16`} onClick={() => handleSort('score')}>
                  <span className="inline-flex items-center justify-center">
                    Score <SortIcon col="score" active={sortCol} dir={sortDir} />
                  </span>
                </th>
                <th className={`${thClass()} text-left`}>Name</th>
                <th className={`${thClass('date')} text-left`} onClick={() => handleSort('date')}>
                  <span className="inline-flex items-center">
                    Date <SortIcon col="date" active={sortCol} dir={sortDir} />
                  </span>
                </th>
                <th className={`${thClass()} text-left`}>Location</th>
                <th className={`${thClass('attendees')} text-right`} onClick={() => handleSort('attendees')}>
                  <span className="inline-flex items-center justify-end">
                    Attendees <SortIcon col="attendees" active={sortCol} dir={sortDir} />
                  </span>
                </th>
                <th className={`${thClass()} text-left`}>Verticals</th>
                <th className={`${thClass('tier')} text-center`} onClick={() => handleSort('tier')}>
                  <span className="inline-flex items-center justify-center">
                    Tier <SortIcon col="tier" active={sortCol} dir={sortDir} />
                  </span>
                </th>
                <th className={`${thClass()} text-center`}>Attending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayed.map((conf) => (
                <>
                  <tr
                    key={conf._id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(expandedId === conf._id ? null : conf._id)}
                  >
                    <td className="px-4 py-3 text-center">
                      <span className={`text-base font-bold ${SCORE_COLOR(conf.icpScore)}`}>{conf.icpScore}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-56">
                      {conf.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(conf.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />{conf.city}, {conf.country}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-right whitespace-nowrap">
                      <span className="flex items-center justify-end gap-1">
                        <Users className="w-3 h-3" />{conf.estimatedAttendees.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                        {conf.vertical[0]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[conf.tier]}`}>
                        {conf.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {attendingStatus(conf) === 'attended' ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleAttending(conf); }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 transition-colors cursor-pointer"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Attended
                        </button>
                      ) : attendingStatus(conf) === 'going' ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleAttending(conf); }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Going
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleAttending(conf); }}
                          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-600 transition-colors cursor-pointer"
                        >
                          Mark
                        </button>
                      )}
                    </td>
                  </tr>

                  {expandedId === conf._id && (
                    <tr key={`${conf._id}-detail`} className="bg-gray-50">
                      <td colSpan={8} className="px-6 py-4 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-600">{conf.description}</p>
                            {conf.website && (
                              <a href={conf.website} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-2 text-xs text-amber-600 hover:underline">
                                <ExternalLink className="w-3 h-3" /> {conf.website}
                              </a>
                            )}
                            {conf.assignedRep && (
                              <p className="text-xs text-gray-500 mt-2">Assigned to: <strong>{conf.assignedRep}</strong></p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" /> ICP Score Breakdown
                            </p>
                            {Object.entries(conf.icpScoreBreakdown).map(([key, val]) => (
                              <div key={key} className="flex justify-between text-xs text-gray-600 mb-1">
                                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                                <span className="font-medium">{val}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
