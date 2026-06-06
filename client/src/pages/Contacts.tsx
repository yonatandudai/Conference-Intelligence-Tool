import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Repeat } from 'lucide-react';
import api from '../api';
import type { Contact } from '../types';
import toast from 'react-hot-toast';

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const fetch = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { multiConference: 'true' };
      if (search) params.search = search;
      const res = await api.get('/contacts', { params });
      setContacts(res.data);
    } catch {
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [search]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
        <p className="text-sm text-gray-500 mt-1">{contacts.length} contacts tracked</p>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, company, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border border-gray-200 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No contacts yet — capture leads in the field to build your contact list.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map((c) => (
            <Link
              key={c._id}
              to={`/contacts/${c._id}`}
              className="block bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-amber-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-semibold text-sm shrink-0">
                    {c.firstName[0]}{c.lastName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{c.firstName} {c.lastName}</p>
                    <p className="text-xs text-gray-500">{c.currentJobTitle} · {c.currentCompany}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {c.encounters.length >= 2 && (
                    <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-full">
                      <Repeat className="w-3 h-3" />
                      {c.encounters.length}x
                    </span>
                  )}
                  {c.relationshipSummary && (
                    <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-1 rounded-full">
                      AI summary
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {c.encounters.length} encounter{c.encounters.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              {c.relationshipSummary && (
                <p className="mt-2 text-xs text-gray-500 line-clamp-2 pl-12">{c.relationshipSummary}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
