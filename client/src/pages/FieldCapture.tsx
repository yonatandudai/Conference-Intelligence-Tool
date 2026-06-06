import { useEffect, useRef, useState } from 'react';
import { Zap, CheckCircle, ChevronDown, User, Pencil, Plus } from 'lucide-react';
import api from '../api';
import type { Conference } from '../types';
import toast from 'react-hot-toast';

const QUICK_TAGS = ['Demo', 'Pricing', 'Partnership', 'Integration', 'Not a fit'];

const INTENT_OPTIONS = [
  { value: 'hot',  label: '🔥 Hot',  active: 'bg-red-500 text-white border-red-500',    inactive: 'bg-gray-800 text-gray-400 border-gray-700' },
  { value: 'warm', label: '◎ Warm', active: 'bg-amber-500 text-white border-amber-500', inactive: 'bg-gray-800 text-gray-400 border-gray-700' },
  { value: 'cold', label: '❄ Cold',  active: 'bg-blue-600 text-white border-blue-600',   inactive: 'bg-gray-800 text-gray-400 border-gray-700' },
] as const;

type Intent = 'hot' | 'warm' | 'cold';
type Mode = 'rep' | 'lead';
type LeadStep = 'lead' | 'rep';

interface FormData {
  firstName: string; lastName: string; company: string;
  jobTitle: string; email: string; phone: string;
  notes: string; repName: string;
  conferenceId: string; conferenceName: string;
  intent: Intent; tags: string[];
}

function makeEmpty(overrides: Partial<FormData> = {}): FormData {
  return {
    firstName: '', lastName: '', company: '', jobTitle: '',
    email: '', phone: '', notes: '', tags: [], intent: 'warm',
    repName: localStorage.getItem('grain_rep') || '',
    conferenceId: '', conferenceName: '',
    ...overrides,
  };
}

const INPUT = 'w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-4 text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500';
const INPUT_LEAD = 'w-full bg-gray-800 border border-gray-600 text-white rounded-xl px-4 py-4 text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function FieldCapture() {
  const [form, setForm] = useState<FormData>(makeEmpty);
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lastCaptured, setLastCaptured] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem('grain_capture_mode') as Mode) || 'rep');
  const [leadStep, setLeadStep] = useState<LeadStep>('lead');
  const [showExtra, setShowExtra] = useState(false);
  const firstNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/conferences', { params: { attending: 'true' } }).then((r) => {
      setConferences(r.data);
      if (r.data.length === 1)
        setForm((f) => ({ ...f, conferenceId: r.data[0]._id, conferenceName: r.data[0].name }));
    });
  }, []);

  const switchMode = (m: Mode) => {
    setMode(m);
    setLeadStep('lead');
    localStorage.setItem('grain_capture_mode', m);
  };

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.value;
      if (field === 'repName') localStorage.setItem('grain_rep', value);
      setForm((f) => ({ ...f, [field]: value }));
    };

  const selectConference = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const conf = conferences.find((c) => c._id === e.target.value);
    setForm((f) => ({ ...f, conferenceId: e.target.value, conferenceName: conf?.name || '' }));
  };

  const toggleTag = (tag: string) =>
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.company || !form.conferenceId) {
      toast.error('Name, company, and conference are required');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/leads', form);
      setLastCaptured(`${form.firstName} ${form.lastName} @ ${form.company}`);
      setSessionCount((n) => n + 1);
      setForm(makeEmpty({ conferenceId: form.conferenceId, conferenceName: form.conferenceName }));
      setShowExtra(false);
      setLeadStep('lead');
      setTimeout(() => firstNameRef.current?.focus(), 50);
    } catch {
      toast.error('Failed to save lead');
    } finally {
      setSubmitting(false);
    }
  };

  const conferenceLocked = conferences.length === 1;
  const conferenceSelector = conferenceLocked ? (
    <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 flex items-center justify-between">
      <span className="text-gray-400 text-xs uppercase tracking-wide">Conference</span>
      <span className="text-white text-sm font-medium">{conferences[0].name}</span>
    </div>
  ) : (
    <div className="relative">
      <select value={form.conferenceId} onChange={selectConference} required
        className={INPUT + ' appearance-none pr-10'}
      >
        <option value="">Select conference *</option>
        {conferences.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );

  const intentAndTags = (
    <>
      <div className="grid grid-cols-3 gap-2">
        {INTENT_OPTIONS.map((opt) => (
          <button key={opt.value} type="button"
            onClick={() => setForm((f) => ({ ...f, intent: opt.value }))}
            className={`py-3 rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${form.intent === opt.value ? opt.active : opt.inactive}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {QUICK_TAGS.map((tag) => (
          <button key={tag} type="button" onClick={() => toggleTag(tag)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${
              form.tags.includes(tag)
                ? 'bg-amber-500 border-amber-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
      <textarea placeholder="Quick notes…" value={form.notes} onChange={set('notes')} rows={2}
        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
      />
    </>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-start py-6 px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">Field Capture</h1>
              <p className="text-gray-400 text-xs mt-0.5">Log a contact quickly</p>
            </div>
          </div>
          {sessionCount > 0 && (
            <div className="text-right">
              <span className="text-2xl font-bold text-amber-500">{sessionCount}</span>
              <p className="text-gray-500 text-xs leading-none mt-0.5">today</p>
            </div>
          )}
        </div>

        {/* Mode toggle */}
        <div className="flex bg-gray-800 rounded-xl p-1 mb-5 border border-gray-700">
          <button type="button" onClick={() => switchMode('rep')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${mode === 'rep' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-gray-300'}`}
          >
            <Pencil className="w-3.5 h-3.5" /> I'll type it
          </button>
          <button type="button" onClick={() => switchMode('lead')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${mode === 'lead' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-gray-300'}`}
          >
            <User className="w-3.5 h-3.5" /> Pass to lead
          </button>
        </div>

        {/* Last captured */}
        {lastCaptured && (
          <div className="mb-4 flex items-center gap-2 bg-green-900/40 border border-green-700 rounded-xl px-4 py-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
            <p className="text-green-300 text-sm">Saved: <strong>{lastCaptured}</strong></p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">

          {mode === 'rep' ? (
            /* ── REP MODE: lean core form, extras behind + ── */
            <>
              {conferenceSelector}

              <div className="grid grid-cols-2 gap-2">
                <input ref={firstNameRef}
                  type="text" placeholder="First name *" value={form.firstName} onChange={set('firstName')} required
                  className={INPUT}
                />
                <input type="text" placeholder="Last name *" value={form.lastName} onChange={set('lastName')} required className={INPUT} />
              </div>

              <input type="text" placeholder="Company *" value={form.company} onChange={set('company')} required className={INPUT} />

              {intentAndTags}

              {/* Extra fields toggle */}
              <button type="button" onClick={() => setShowExtra((v) => !v)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
              >
                <Plus className={`w-4 h-4 transition-transform ${showExtra ? 'rotate-45' : ''}`} />
                {showExtra ? 'Hide' : 'Add'} email, phone, title
              </button>

              {showExtra && (
                <div className="space-y-3">
                  <input type="text" placeholder="Job title" value={form.jobTitle} onChange={set('jobTitle')} className={INPUT} />
                  <input type="email" placeholder="Email" value={form.email} onChange={set('email')} className={INPUT} />
                  <input type="tel" placeholder="Phone" value={form.phone} onChange={set('phone')} className={INPUT} />
                  <input type="text" placeholder="Your name (rep)" value={form.repName} onChange={set('repName')} className={INPUT} />
                </div>
              )}
            </>
          ) : (
            /* ── PASS TO LEAD MODE: two steps ── */
            leadStep === 'lead' ? (
              /* Step 1: lead fills their info */
              <div className="rounded-2xl border border-blue-900/60 bg-blue-950/20 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-blue-900/40 bg-blue-950/30">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-blue-300 text-sm font-semibold">Your details</span>
                </div>
                <div className="p-3 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <input ref={firstNameRef}
                      type="text" placeholder="First name *" value={form.firstName} onChange={set('firstName')} required
                      className={INPUT_LEAD}
                    />
                    <input type="text" placeholder="Last name *" value={form.lastName} onChange={set('lastName')} required className={INPUT_LEAD} />
                  </div>
                  <input type="text" placeholder="Company *" value={form.company} onChange={set('company')} required className={INPUT_LEAD} />
                  <input type="text" placeholder="Job title" value={form.jobTitle} onChange={set('jobTitle')} className={INPUT_LEAD} />
                  <input type="email" placeholder="Email" value={form.email} onChange={set('email')} className={INPUT_LEAD} />
                  <input type="tel" placeholder="Phone" value={form.phone} onChange={set('phone')} className={INPUT_LEAD} />
                  <button type="button"
                    onClick={() => {
                      if (!form.firstName || !form.lastName || !form.company) {
                        toast.error('Please fill in name and company');
                        return;
                      }
                      setLeadStep('rep');
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl text-base transition-colors cursor-pointer mt-1"
                  >
                    Done →
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: rep adds context */
              <>
                {/* Lead summary (read-only) */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{form.firstName} {form.lastName}</p>
                    <p className="text-gray-400 text-xs">{form.company}{form.jobTitle ? ` · ${form.jobTitle}` : ''}</p>
                  </div>
                  <button type="button" onClick={() => setLeadStep('lead')}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                {conferenceSelector}

                <div className="rounded-2xl border border-amber-900/50 bg-amber-950/10 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-900/40 bg-amber-950/20">
                    <Pencil className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-300 text-sm font-semibold">Your context</span>
                  </div>
                  <div className="p-3 space-y-2.5">
                    {intentAndTags}
                    <input type="text" placeholder="Your name (rep)" value={form.repName} onChange={set('repName')} className={INPUT} />
                  </div>
                </div>
              </>
            )
          )}

          {/* Submit — only shown when not on lead step */}
          {(mode === 'rep' || leadStep === 'rep') && (
            <button type="submit" disabled={submitting}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition-colors cursor-pointer"
            >
              {submitting ? 'Saving…' : 'Capture Lead'}
            </button>
          )}

        </form>
      </div>
    </div>
  );
}
