import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/discount-codes', label: 'Discount Codes' },
  { to: '/admin/contributions', label: 'Contributions' },
];

export default function AdminNav() {
  return (
    <div className="border-b border-ink/10">
      <nav className="flex gap-8 overflow-x-auto">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `placard whitespace-nowrap border-b-2 pb-3 text-[11px] transition-colors ${
                isActive ? 'border-brass-deep text-ink' : 'border-transparent text-warmgray hover:text-ink'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
