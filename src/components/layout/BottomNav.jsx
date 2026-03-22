import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Plus, Calendar, Plane, User } from 'lucide-react';
import './BottomNav.css';

const tabs = [
  { path: '/', icon: Home, label: 'בית' },
  { path: '/closet', icon: ShoppingBag, label: 'הארון שלי' },
  { path: '/closet/add', icon: Plus, label: 'הוספה', isCenter: true },
  { path: '/calendar', icon: Calendar, label: 'יומן' },
  { path: '/packing', icon: Plane, label: 'אריזה' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;

        if (tab.isCenter) {
          return (
            <button
              key={tab.path}
              className="nav-center-btn"
              onClick={() => navigate(tab.path)}
              aria-label={tab.label}
            >
              <Icon size={28} strokeWidth={2.5} />
            </button>
          );
        }

        return (
          <button
            key={tab.path}
            className={`nav-tab ${isActive ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <Icon size={22} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
