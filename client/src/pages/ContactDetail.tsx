import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Building, Mail, Phone, Calendar, ExternalLink } from 'lucide-react';
import api from '../api';
import type { Contact } from '../types';
import toast from 'react-hot-toast';

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    api.get(`/contacts/${id}`)
      .then((r) => setContact(r.data))
      .catch(() => toast.error('Contact not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const generateSummary = async () => {
    try {
      setSummarizing(true);
      const res = await api.post(`/ai/relationship-summary/${id}`);
      setContact((c) => c ? { ...c, relationshipSummary: res.data.summary, relationshipSummaryGeneratedAt: new Date().toISOString() } : c);
      toast.success('Summary generated');
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(axErr.response?.data?.error ?? axErr.message ?? 'Failed to generate summary');
    } finally {
      setSummarizing(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;
  if (!contact) return <div className="p-6 text-gray-500">Contact not found.</div>;

  return (
    <div className="p-6 max-w-3xl">
      <Link
        to={contact.encounters.length >= 2 ? '/leads?tab=contacts' : '/leads'}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        {contact.encounters.length >= 2 ? 'Back to contacts' : 'Back to leads'}
      </Link>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xl font-bold shrink-0">
              {contact.firstName[0]}{contact.lastName[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{contact.firstName} {contact.lastName}</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                <Building className="w-3 h-3" />
                {contact.currentJobTitle} · {contact.currentCompany}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs text-gray-400 hover:text-amber-600">
                    <Mail className="w-3 h-3" />{contact.email}
                  </a>
                )}
                {contact.phone && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Phone className="w-3 h-3" />{contact.phone}
                  </span>
                )}
                {contact.linkedin && (
                  <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-400 hover:text-amber-600">
                    <ExternalLink className="w-3 h-3" />LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>
          <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full shrink-0">
            {contact.encounters.length} encounter{contact.encounters.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* AI Relationship Arc — only for repeat contacts */}
      {contact.encounters.length >= 2 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Relationship Arc
            </h2>
            <button
              onClick={generateSummary}
              disabled={summarizing}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {summarizing ? 'Analyzing...' : contact.relationshipSummary ? 'Refresh' : 'Generate with AI'}
            </button>
          </div>

          {contact.relationshipSummary ? (
            <div>
              <p className="text-sm text-gray-700 leading-relaxed">{contact.relationshipSummary}</p>
              {contact.relationshipSummaryGeneratedAt && (
                <p className="text-xs text-gray-400 mt-2">
                  Generated {new Date(contact.relationshipSummaryGeneratedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <p className="text-sm text-amber-800 font-medium mb-1">
                Met {contact.encounters.length} times — is this relationship going anywhere?
              </p>
              <p className="text-xs text-amber-700">
                Generate an arc to see the intent trajectory across encounters and get a concrete next-move recommendation.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Encounter timeline */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Conference History</h2>
        {contact.encounters.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No encounters recorded.</p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100" />
            <div className="space-y-5">
              {[...contact.encounters]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((enc, i) => (
                  <div key={i} className="flex gap-4 pl-10 relative">
                    <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow-sm" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-gray-900">{enc.conferenceName}</span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(enc.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{enc.jobTitle} · {enc.company}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {enc.intent && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            enc.intent === 'hot'  ? 'bg-red-100 text-red-700' :
                            enc.intent === 'warm' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-blue-100 text-blue-700'
                          }`}>
                            {enc.intent === 'hot' ? '🔥 Hot' : enc.intent === 'warm' ? '◎ Warm' : '❄ Cold'}
                          </span>
                        )}
                        {enc.tags?.map((tag) => (
                          <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                      {enc.notes && (
                        <p className="text-sm text-gray-600 mt-1.5 bg-gray-50 rounded-lg px-3 py-2">{enc.notes}</p>
                      )}
                      {enc.repName && (
                        <p className="text-xs text-gray-400 mt-1">Rep: {enc.repName}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
