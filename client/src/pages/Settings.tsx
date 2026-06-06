import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Database, Zap, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

export default function Settings() {
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);

  const [hubspotKey, setHubspotKey] = useState('');
  const [hubspotConnected, setHubspotConnected] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  useEffect(() => {
    api.get('/settings').then((r) => {
      setHubspotKey(r.data.hubspotApiKey ?? '');
      setHubspotConnected(r.data.hubspotConnected);
    });
  }, []);

  const saveHubspotKey = async () => {
    try {
      setSavingKey(true);
      const res = await api.put('/settings', { hubspotApiKey: hubspotKey });
      setHubspotConnected(res.data.hubspotConnected);
      toast.success(res.data.hubspotConnected ? 'HubSpot connected' : 'HubSpot key cleared');
    } catch {
      toast.error('Failed to save key');
    } finally {
      setSavingKey(false);
    }
  };

  const seedConferences = async () => {
    try {
      setSeeding(true);
      const res = await api.post('/seed');
      toast.success(res.data.message);
    } catch {
      toast.error('Seed failed');
    } finally {
      setSeeding(false);
    }
  };

  const clearConferences = async () => {
    if (!confirm('Delete ALL conferences? This cannot be undone.')) return;
    try {
      setClearing(true);
      const res = await api.delete('/seed');
      toast.success(res.data.message);
    } catch {
      toast.error('Clear failed');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" /> Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">Configure integrations and manage data</p>
      </div>

      {/* HubSpot */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" /> HubSpot Integration
          </h2>
          {hubspotConnected && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle className="w-3.5 h-3.5" /> Connected
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Paste your HubSpot Private App token to enable lead syncing. Create one in
          HubSpot under <strong>Settings → Integrations → Private Apps</strong> with the
          <code className="bg-gray-100 px-1 rounded text-xs mx-1">crm.objects.contacts.write</code> scope.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={hubspotKey}
              onChange={(e) => setHubspotKey(e.target.value)}
              placeholder="pat-na1-..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={saveHubspotKey}
            disabled={savingKey}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {savingKey ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Server-side keys info */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" /> Server Configuration
        </h2>
        <p className="text-sm text-gray-600 mb-3">
          These keys are configured in <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">server/.env</code> by whoever hosts the app.
        </p>
        <div className="space-y-2 text-sm">
          {[
            { key: 'MONGODB_URI', desc: 'MongoDB Atlas connection string' },
            { key: 'GROQ_API_KEY', desc: 'Groq API key for AI relationship arc (free at console.groq.com)' },
          ].map(({ key, desc }) => (
            <div key={key} className="flex items-start gap-3 bg-gray-50 rounded-lg px-3 py-2">
              <code className="font-mono text-xs text-purple-700 shrink-0 mt-0.5">{key}</code>
              <span className="text-gray-500 text-xs">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Seed data */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-500" /> Conference Data
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Seed the database with 30 pre-scored fintech, payments, travel, and FX conferences.
          This only runs if the database is empty — safe to click multiple times.
        </p>
        <div className="flex gap-3">
          <button
            onClick={seedConferences}
            disabled={seeding}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {seeding ? 'Seeding...' : 'Seed 30 Conferences'}
          </button>
          <button
            onClick={clearConferences}
            disabled={clearing}
            className="px-4 py-2 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-300 text-gray-600 hover:text-red-600 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            {clearing ? 'Clearing...' : 'Clear All Conferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
