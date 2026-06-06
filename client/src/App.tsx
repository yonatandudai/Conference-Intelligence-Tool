import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Conferences from './pages/Conferences';
import Planner from './pages/Planner';
import FieldCapture from './pages/FieldCapture';
import Leads from './pages/Leads';
import Contacts from './pages/Contacts';
import ContactDetail from './pages/ContactDetail';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="conferences" element={<Conferences />} />
        <Route path="planner" element={<Planner />} />
        <Route path="field" element={<FieldCapture />} />
        <Route path="leads" element={<Leads />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="contacts/:id" element={<ContactDetail />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
