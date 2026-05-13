import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Building2, FileText, Bell, LogOut, ShieldCheck } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'properties', label: 'Properties', icon: Building2 },
  { id: 'documents', label: 'Certificates', icon: FileText },
  { id: 'reminders', label: 'Reminders', icon: Bell },
];

export default function Sidebar({ page, setPage, alertCount = 0 }) {
  const { user, logout } = useAuth();

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'U';

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={22} color="var(--accent-light)" />
          <div>
            <h1>PropGuard</h1>
            <p>Property Manager</p>
          </div>
        </div>
      </div>

      <div className="sidebar-nav">
        <span className="nav-section-label">Navigation</span>
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${page === id ? 'active' : ''}`}
            onClick={() => setPage(id)}
          >
            <Icon size={17} />
            <span>{label}</span>
            {id === 'reminders' && alertCount > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: page === id ? 'rgba(255,255,255,0.3)' : 'var(--accent)',
                color: 'white',
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 7px',
                borderRadius: '100px',
                minWidth: '20px',
                textAlign: 'center',
              }}>
                {alertCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <span className="user-email">{user?.email}</span>
          <button className="logout-btn" onClick={logout} title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </nav>
  );
}
