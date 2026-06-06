import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Repeat, Sparkles } from 'lucide-react';
import api from '../api';
import type { Lead, Contact } from '../types';
import toast from 'react-hot-toast';

const INTENT_STYLE = {
  hot:  { badge: 'bg-red-100 text-red-700',    label: '🔥 Hot' },
  warm: { badge: 'bg-amber-100 text-amber-700', label: '◎ Warm' },
  cold: { badge: 'bg-blue-100 text-blue-700',   label: '❄ Cold' },
};

const STATUS_STYLE: Record<string, string> = {
  new:               'bg-gray-100 text-gray-500',
  matched:           'bg-blue-100 text-blue-700',
  synced_to_hubspot: 'bg-green-100 text-green-700',
};

export default function Leads() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') ?? 'leads') as 'leads' | 'contacts';
  const setTab = (t: 'leads' | 'contacts') =>
    setSearchParams(t === 'leads' ? {} : { tab: t });

  // Leads state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [filterIntent, setFilterIntent] = useState('');
  const [filterConference, setFilterConference] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());

  // Contacts state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [generatingArcId, setGeneratingArcId] = useState<string | null>(null);

  useEffect(() => {
    api.get('/leads')
      .then((r) => setLeads(r.data))
      .catch(() => toast.error('Failed to load leads'))
      .finally(() => setLeadsLoading(false));
  }, []);

  useEffect(() => {
    setContactsLoading(true);
    const params: Record<string, string> = { multiConference: 'true' };
    if (search) params.search = search;
    api.get('/contacts', { params })
      .then((r) => setContacts(r.data))
      .catch(() => toast.error('Failed to load contacts'))
      .finally(() => setContactsLoading(false));
  }, [search]);

  const conferences = [...new Set(leads.map((l) => l.conferenceName))].sort();
  const filteredLeads = leads.filter((l) => {
    if (filterIntent && l.intent !== filterIntent) return false;
    if (filterConference && l.conferenceName !== filterConference) return false;
    return true;
  });

  const hot  = leads.filter((l) => l.intent === 'hot').length;
  const warm = leads.filter((l) => l.intent === 'warm').length;
  const cold = leads.filter((l) => l.intent === 'cold').length;

  const pushToHubSpot = async (lead: Lead) => {
    setSyncingIds((s) => new Set(s).add(lead._id));
    try {
      await api.post(`/hubspot/sync-lead/${lead._id}`);
      setLeads((prev) =>
        prev.map((l) => l._id === lead._id ? { ...l, status: 'synced_to_hubspot' } : l)
      );
      toast.success(`${lead.firstName} ${lead.lastName} pushed to HubSpot`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'HubSpot sync failed';
      toast.error(msg);
    } finally {
      setSyncingIds((s) => { const n = new Set(s); n.delete(lead._id); return n; });
    }
  };

  const generateArc = async (contactId: string) => {
    setGeneratingArcId(contactId);
    try {
      const res = await api.post(`/ai/relationship-summary/${contactId}`);
      setContacts((prev) =>
        prev.map((c) => c._id === contactId ? { ...c, relationshipSummary: res.data.summary } : c)
      );
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(axErr.response?.data?.error ?? axErr.message ?? 'Failed to generate arc');
    } finally {
      setGeneratingArcId(null);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads & Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">
            {leads.length} leads · {contacts.length} repeat contacts
          </p>
        </div>
        {leads.length > 0 && (
          <div className="flex gap-2">
            <span className="px-2.5 py-1.5 bg-red-50 text-red-700 rounded-lg font-medium text-xs">🔥 {hot}</span>
            <span className="px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg font-medium text-xs">◎ {warm}</span>
            <span className="px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-medium text-xs">❄ {cold}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-5">
        {(['leads', 'contacts'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors cursor-pointer ${
              tab === t ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'leads' ? `Leads (${leads.length})` : `Repeat Contacts (${contacts.length})`}
          </button>
        ))}
      </div>

      {/* ── LEADS TAB ── */}
      {tab === 'leads' && (
        <>
          <div className="flex flex-wrap gap-3 mb-5">
            <select value={filterIntent} onChange={(e) => setFilterIntent(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">All intents</option>
              <option value="hot">🔥 Hot</option>
              <option value="warm">◎ Warm</option>
              <option value="cold">❄ Cold</option>
            </select>
            <select value={filterConference} onChange={(e) => setFilterConference(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">All conferences</option>
              {conferences.map((c) => <option key={c}>{c}</option>)}
            </select>
            {(filterIntent || filterConference) && (
              <button onClick={() => { setFilterIntent(''); setFilterConference(''); }}
                className="text-sm text-gray-400 hover:text-gray-600 px-2 cursor-pointer"
              >Clear</button>
            )}
          </div>

          {leadsLoading ? (
            <div className="text-center py-16 text-gray-400">Loading...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              {leads.length === 0 ? 'No leads yet — capture some at your next event.' : 'No leads match the current filters.'}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Person</th>
                    <th className="px-4 py-3 text-left">Conference</th>
                    <th className="px-4 py-3 text-left">Intent</th>
                    <th className="px-4 py-3 text-left">Tags</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Captured</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLeads.map((lead) => (
                    <>
                      <tr key={lead._id}
                        onClick={() => setExpandedId(expandedId === lead._id ? null : lead._id)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-semibold shrink-0">
                              {lead.firstName[0]}{lead.lastName[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{lead.firstName} {lead.lastName}</p>
                              <p className="text-xs text-gray-400">{lead.company}{lead.jobTitle ? ` · ${lead.jobTitle}` : ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-40">
                          <p className="truncate">{lead.conferenceName}</p>
                          {lead.repName && <p className="text-xs text-gray-400">{lead.repName}</p>}
                        </td>
                        <td className="px-4 py-3">
                          {lead.intent
                            ? <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${INTENT_STYLE[lead.intent].badge}`}>{INTENT_STYLE[lead.intent].label}</span>
                            : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {lead.tags?.length > 0
                              ? lead.tags.map((t) => <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>)
                              : <span className="text-xs text-gray-300">—</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[lead.status] ?? STATUS_STYLE.new}`}>
                              {lead.status.replace(/_/g, ' ')}
                            </span>
                            {lead.status === 'matched' && (
                              <span className="text-xs text-blue-500 font-medium flex items-center gap-0.5">
                                <Repeat className="w-3 h-3" /> known
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(lead.capturedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>

                      {expandedId === lead._id && (
                        <tr key={`${lead._id}-detail`}>
                          <td colSpan={6} className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                              {lead.email && (
                                <div>
                                  <p className="text-xs text-gray-400 mb-0.5">Email</p>
                                  <p className="text-gray-700">{lead.email}</p>
                                </div>
                              )}
                              {lead.phone && (
                                <div>
                                  <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                                  <p className="text-gray-700">{lead.phone}</p>
                                </div>
                              )}
                              {lead.repName && (
                                <div>
                                  <p className="text-xs text-gray-400 mb-0.5">Captured by</p>
                                  <p className="text-gray-700">{lead.repName}</p>
                                </div>
                              )}
                              {lead.notes && (
                                <div className="col-span-2 md:col-span-4">
                                  <p className="text-xs text-gray-400 mb-0.5">Notes</p>
                                  <p className="text-gray-700">{lead.notes}</p>
                                </div>
                              )}
                            </div>

                            {/* HubSpot sync */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                              <div className="flex items-center gap-2">
                                {lead.status === 'synced_to_hubspot' ? (
                                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                    Synced to HubSpot
                                  </span>
                                ) : (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); pushToHubSpot(lead); }}
                                    disabled={syncingIds.has(lead._id)}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors cursor-pointer font-medium"
                                  >
                                    {syncingIds.has(lead._id) ? 'Syncing…' : '→ Push to HubSpot'}
                                  </button>
                                )}
                              </div>
                              {lead.contactId && (
                                <Link
                                  to={`/contacts/${lead.contactId}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  View profile →
                                </Link>
                              )}
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
        </>
      )}

      {/* ── CONTACTS TAB ── */}
      {tab === 'contacts' && (
        <>
          <div className="flex gap-3 mb-5 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search by name, company, email..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border border-gray-200 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {contactsLoading ? (
            <div className="text-center py-16 text-gray-400">Loading...</div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              No contacts yet — they're built automatically from captured leads.
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((c) => {
                const isRepeat = c.encounters.length >= 2;
                const needsArc = isRepeat && !c.relationshipSummary;
                const isGenerating = generatingArcId === c._id;

                return (
                  <div key={c._id} className={`bg-white border rounded-xl px-5 py-4 transition-all ${
                    isRepeat ? 'border-amber-200 hover:border-amber-300' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <Link to={`/contacts/${c._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-semibold text-sm shrink-0">
                          {c.firstName[0]}{c.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{c.firstName} {c.lastName}</p>
                          <p className="text-xs text-gray-500">{c.currentJobTitle} · {c.currentCompany}</p>
                        </div>
                      </Link>

                      <div className="flex items-center gap-2 shrink-0">
                        {isRepeat && (
                          <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-full font-medium">
                            <Repeat className="w-3 h-3" /> {c.encounters.length}x
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {c.encounters.length} encounter{c.encounters.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Relationship arc */}
                    {c.relationshipSummary ? (
                      <div className="mt-3 flex items-start gap-2 pl-12">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-gray-600 leading-relaxed">{c.relationshipSummary}</p>
                      </div>
                    ) : needsArc ? (
                      <div className="mt-3 pl-12 flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          Seen at {c.encounters.length} events — no arc yet.
                        </span>
                        <button
                          onClick={() => generateArc(c._id)}
                          disabled={isGenerating}
                          className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          {isGenerating ? 'Analyzing…' : 'Generate arc'}
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
