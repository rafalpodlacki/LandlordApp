import { useData } from '../hooks/useData';
import { getExpiryStatus } from '../lib/db';
import { Building2, FileText, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardPage({ setPage }) {
  const { properties, documents, loading } = useData();

  const expired  = documents.filter(d => getExpiryStatus(d.expiryDate, d.reminderDays).status === 'expired');
  const expiring = documents.filter(d => getExpiryStatus(d.expiryDate, d.reminderDays).status === 'expiring');
  const valid    = documents.filter(d => getExpiryStatus(d.expiryDate, d.reminderDays).status === 'valid');

  const urgentDocs = [...expired, ...expiring]
    .sort((a, b) => (a.expiryDate?.toMillis?.() ?? 0) - (b.expiryDate?.toMillis?.() ?? 0))
    .slice(0, 8);

  const propMap = Object.fromEntries(properties.map(p => [p.id, p]));

  return (
    <div className="animate-fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{format(new Date(), 'EEEE, d MMMM yyyy')} · Overview of your portfolio</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setPage('properties')}><Building2 size={15} /> Properties</button>
          <button className="btn btn-primary"   onClick={() => setPage('documents')}><Plus size={15} /> Add Certificate</button>
        </div>
      </div>

      <div className="page-body">
        <div className="stats-grid">
          <div className="stat-card accent">
            <div className="stat-label">Total Properties</div>
            <div className="stat-value">{loading ? '…' : properties.length}</div>
            <div className="stat-sub">in your portfolio</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">Valid Certificates</div>
            <div className="stat-value">{loading ? '…' : valid.length}</div>
            <div className="stat-sub">up to date</div>
          </div>
          <div className="stat-card amber">
            <div className="stat-label">Expiring Soon</div>
            <div className="stat-value">{loading ? '…' : expiring.length}</div>
            <div className="stat-sub">within 30 days</div>
          </div>
          <div className="stat-card red">
            <div className="stat-label">Expired</div>
            <div className="stat-value">{loading ? '…' : expired.length}</div>
            <div className="stat-sub">require immediate action</div>
          </div>
        </div>

        {!loading && (expired.length > 0 || expiring.length > 0) && (
          <div className="alert alert-warn" style={{ marginBottom: '24px' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Action Required:</strong>{' '}
              {expired.length > 0 && `${expired.length} certificate${expired.length > 1 ? 's have' : ' has'} expired. `}
              {expiring.length > 0 && `${expiring.length} certificate${expiring.length > 1 ? 's are' : ' is'} expiring within 30 days.`}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card" style={{ gridColumn: urgentDocs.length > 0 ? '1' : '1 / -1' }}>
            <div className="card-header">
              <span className="card-title">{urgentDocs.length > 0 ? '⚠️ Needs Attention' : '✅ All Certificates'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage('documents')}>View All</button>
            </div>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" /></div>
            ) : urgentDocs.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--green)' }}>
                <CheckCircle2 size={40} style={{ opacity: 0.5, marginBottom: '12px' }} />
                <p style={{ fontWeight: '500' }}>All {documents.length} certificates are valid!</p>
                <p style={{ fontSize: '13px', color: 'var(--ink-faint)', marginTop: '4px' }}>No action required right now.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Document</th><th>Property</th><th>Status</th></tr></thead>
                  <tbody>
                    {urgentDocs.map(doc => {
                      const { status, label } = getExpiryStatus(doc.expiryDate, doc.reminderDays);
                      return (
                        <tr key={doc.id}>
                          <td>
                            <div style={{ fontWeight: '500', fontSize: '13.5px' }}>{doc.name}</div>
                            <div style={{ fontSize: '11.5px', color: 'var(--ink-faint)' }}>{doc.type}</div>
                          </td>
                          <td style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>{propMap[doc.propertyId]?.name || '—'}</td>
                          <td><span className={`badge badge-${status}`}>{label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loading && urgentDocs.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Properties</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage('properties')}>Manage</button>
              </div>
              {properties.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--ink-faint)', fontSize: '13px' }}>No properties yet.</p>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={() => setPage('properties')}>
                    <Plus size={14} /> Add Property
                  </button>
                </div>
              ) : (
                <div style={{ padding: '8px 0' }}>
                  {properties.slice(0, 6).map(prop => {
                    const propDocs    = documents.filter(d => d.propertyId === prop.id);
                    const propExpired  = propDocs.filter(d => getExpiryStatus(d.expiryDate, d.reminderDays).status === 'expired').length;
                    const propExpiring = propDocs.filter(d => getExpiryStatus(d.expiryDate, d.reminderDays).status === 'expiring').length;
                    return (
                      <div key={prop.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 20px', borderBottom: '1px solid var(--border)' }}>
                        <div className="property-icon" style={{ width: '34px', height: '34px', borderRadius: '8px' }}><Building2 size={16} /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '500', fontSize: '13.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prop.name}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--ink-faint)' }}>{propDocs.length} certificate{propDocs.length !== 1 ? 's' : ''}</div>
                        </div>
                        {propExpired  > 0 && <span className="badge badge-expired">{propExpired} expired</span>}
                        {propExpired === 0 && propExpiring > 0 && <span className="badge badge-expiring">{propExpiring} expiring</span>}
                        {propExpired === 0 && propExpiring === 0 && propDocs.length > 0 && <span className="badge badge-valid">OK</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
