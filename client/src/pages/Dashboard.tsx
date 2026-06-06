import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Users, Zap, TrendingUp, ArrowRight } from 'lucide-react';
import api from '../api';
import type { Conference, Contact, Lead } from '../types';

export default function Dashboard() {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/conferences'),
      api.get('/contacts'),
      api.get('/leads'),
    ]).then(([c, co, l]) => {
      setConferences(c.data);
      setContacts(co.data);
      setLeads(l.data);
    }).finally(() => setLoading(false));
  }, []);

  const attending = conferences.filter((c) => c.attending);
  const tier1 = conferences.filter((c) => c.tier === 'Tier 1');
  const multiConf = contacts.filter((c) => c.encounters.length >= 2);
  const recentLeads = leads.slice(0, 5);
  const upcoming = conferences
    .filter((c) => new Date(c.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Conference Intelligence</h1>
        <p className="text-sm text-gray-500 mt-1">Grain FX · Sales Coverage Dashboard</p>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Conferences', value: conferences.length, icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Tier 1 Events', value: tier1.length, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Attending', value: attending.length, icon: CalendarDays, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Repeat Contacts', value: multiConf.length, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Upcoming conferences */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">Upcoming Events</h2>
                <Link to="/conferences" className="text-xs text-amber-600 hover:underline flex items-center gap-0.5">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {upcoming.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No upcoming events</p>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((c) => (
                    <div key={c._id} className="flex items-center gap-3">
                      <div className="text-center w-10 shrink-0">
                        <div className="text-xs text-gray-400 leading-none">
                          {new Date(c.date).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                        <div className="text-lg font-bold text-gray-800 leading-tight">
                          {new Date(c.date).getDate()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.city} · Score {c.icpScore}</p>
                      </div>
                      {c.attending && <span className="text-xs text-amber-600 font-medium shrink-0">✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent leads + quick actions */}
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-800">Recent Leads</h2>
                  <Link to="/leads" className="text-xs text-amber-600 hover:underline flex items-center gap-0.5">
                    All leads <ArrowRight className="w-3 h-3" />
                  </Link>

                </div>
                {recentLeads.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No leads yet — use Field Capture at your next event.</p>
                ) : (
                  <div className="space-y-2.5">
                    {recentLeads.map((l) => (
                      <div key={l._id} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-semibold shrink-0">
                          {l.firstName[0]}{l.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{l.firstName} {l.lastName}</p>
                          <p className="text-xs text-gray-400 truncate">{l.company} · {l.conferenceName}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          l.status === 'synced_to_hubspot' ? 'bg-green-100 text-green-700' :
                          l.status === 'matched' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {l.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-800 mb-3">Quick Actions</p>
                <div className="flex flex-col gap-2">
                  <Link to="/field" className="flex items-center gap-2 text-sm text-amber-700 hover:text-amber-800 font-medium">
                    <Zap className="w-4 h-4" /> Capture a lead now
                  </Link>
                  <Link to="/planner" className="flex items-center gap-2 text-sm text-amber-700 hover:text-amber-800 font-medium">
                    <CalendarDays className="w-4 h-4" /> Review coverage plan
                  </Link>
                  <Link to="/contacts" className="flex items-center gap-2 text-sm text-amber-700 hover:text-amber-800 font-medium">
                    <Users className="w-4 h-4" /> Review repeat contacts
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
