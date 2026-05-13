import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { addProperty, updateProperty, deleteProperty, getExpiryStatus } from '../lib/db';
import { Building2, Plus, Pencil, Trash2, MapPin, X, AlertTriangle } from 'lucide-react';

const PROPERTY_TYPES = ['House','Flat / Apartment','HMO','Commercial','Student Let','Holiday Let','Other'];

function PropertyModal({ property, onClose }) {
  const { user } = useAuth();
  const [form, setForm] = useState(property || { name:'', address:'', city:'', postcode:'', type:'House', bedrooms:'', notes:'' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.address) return;
    setError('');
    setSaving(true);
    try {
      if (property?.id) {
        await updateProperty(property.id, form);
      } else {
        await addProperty(user.uid, form);
      }
      onClose();
    } catch (err) {
      console.error('Save property error:', err);
      setError(err.message || 'Save failed. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !saving && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{property ? 'Edit Property' : 'Add New Property'}</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose} disabled={saving}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Property Name *</label>
            <input className="form-input" placeholder="e.g. The Old Rectory" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Street Address *</label>
            <input className="form-input" placeholder="123 Main Street" value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City / Town</label>
              <input className="form-input" placeholder="Manchester" value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Postcode</label>
              <input className="form-input" placeholder="M1 1AA" value={form.postcode} onChange={e => set('postcode', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Property Type</label>
              <select className="form-input" value={form.type} onChange={e => set('type', e.target.value)}>
                {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Bedrooms</label>
              <input className="form-input" type="number" min="0" max="20" placeholder="3" value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={3} placeholder="Any additional notes…" value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize:'vertical' }} />
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name || !form.address}>
              {saving ? <span className="spinner" /> : null}
              {saving ? 'Saving…' : (property ? 'Save Changes' : 'Add Property')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  const { properties, documents } = useData();
  const [modal, setModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deleteProperty(id);
    } catch (err) {
      console.error('Delete error:', err);
    }
    setDeleteConfirm(null);
    setDeleting(false);
  };

  const getDocStats = (propId) => {
    const propDocs = documents.filter(d => d.propertyId === propId);
    return {
      total:    propDocs.length,
      expired:  propDocs.filter(d => getExpiryStatus(d.expiryDate, d.reminderDays).status === 'expired').length,
      expiring: propDocs.filter(d => getExpiryStatus(d.expiryDate, d.reminderDays).status === 'expiring').length,
    };
  };

  return (
    <div className="animate-fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Properties</h1>
          <p className="page-subtitle">{properties.length} propert{properties.length !== 1 ? 'ies' : 'y'} in your portfolio</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}><Plus size={15} /> Add Property</button>
      </div>

      <div className="page-body">
        {properties.length === 0 ? (
          <div className="empty-state">
            <Building2 size={48} />
            <h3>No Properties Yet</h3>
            <p>Add your first property to start tracking certificates and insurance.</p>
            <button className="btn btn-primary" onClick={() => setModal('add')}><Plus size={15} /> Add Your First Property</button>
          </div>
        ) : (
          <div className="property-grid">
            {properties.map(prop => {
              const stats = getDocStats(prop.id);
              return (
                <div key={prop.id} className="property-card">
                  <div className="property-card-header">
                    <div style={{ display:'flex', gap:'12px', flex:1, minWidth:0 }}>
                      <div className="property-icon"><Building2 size={20} /></div>
                      <div style={{ minWidth:0, flex:1 }}>
                        <div className="property-name">{prop.name}</div>
                        <div className="property-address">
                          <MapPin size={11} style={{ display:'inline', marginRight:'3px', verticalAlign:'middle' }} />
                          {[prop.address, prop.city, prop.postcode].filter(Boolean).join(', ')}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:'4px' }}>
                      <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setModal(prop)}><Pencil size={14} /></button>
                      <button className="btn btn-icon btn-sm" onClick={() => setDeleteConfirm(prop)}
                        style={{ background:'none', color:'var(--ink-faint)' }}
                        onMouseEnter={e => e.currentTarget.style.color='var(--red)'}
                        onMouseLeave={e => e.currentTarget.style.color='var(--ink-faint)'}
                      ><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="property-card-body">
                    <div style={{ display:'flex', gap:'16px', marginBottom:'12px' }}>
                      <span style={{ fontSize:'12px', color:'var(--ink-faint)' }}>🏠 {prop.type}</span>
                      {prop.bedrooms && <span style={{ fontSize:'12px', color:'var(--ink-faint)' }}>🛏 {prop.bedrooms} bed</span>}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                      <span className="property-doc-count">{stats.total} certificate{stats.total !== 1 ? 's' : ''}</span>
                      {stats.expired  > 0 && <span className="badge badge-expired">{stats.expired} expired</span>}
                      {stats.expiring > 0 && <span className="badge badge-expiring">{stats.expiring} expiring</span>}
                      {stats.expired === 0 && stats.expiring === 0 && stats.total > 0 && <span className="badge badge-valid">All valid</span>}
                    </div>
                    {prop.notes && <p style={{ fontSize:'12px', color:'var(--ink-faint)', marginTop:'10px', fontStyle:'italic' }}>{prop.notes}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && (
        <PropertyModal
          property={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth:'380px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ fontSize:'18px' }}>Delete Property?</h2>
              <button className="btn btn-icon btn-ghost" onClick={() => setDeleteConfirm(null)} disabled={deleting}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warn">
                <AlertTriangle size={16} style={{ flexShrink:0 }} />
                <span>This will also delete all certificates linked to <strong>{deleteConfirm.name}</strong>. This cannot be undone.</span>
              </div>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)} disabled={deleting}>
                  {deleting ? <span className="spinner" /> : <Trash2 size={14} />}
                  {deleting ? 'Deleting…' : 'Delete Property'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
