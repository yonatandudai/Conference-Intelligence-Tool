import { NavLink, Outlet } from 'react-router-dom';
import {
  CalendarDays,
  MapPin,
  Zap,
  Settings,
  LayoutDashboard,
  Wheat,
  Inbox,
} from 'lucide-react';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/conferences', label: 'Conferences', icon: CalendarDays },
  { to: '/planner', label: 'Planner', icon: MapPin },
  { to: '/field', label: 'Field Capture', icon: Zap },
  { to: '/leads', label: 'Leads', icon: Inbox },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-14 flex items-center gap-2 px-4 border-b border-gray-200">
          <Wheat className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-gray-900 text-sm tracking-tight">Grain Conferences</span>
        </div>
        <nav className="flex-1 py-3 space-y-0.5 px-2">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-amber-50 text-amber-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-gray-200">
          <p className="text-xs text-gray-400">Grain FX · Conference Intel</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
