import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { addDocument, updateDocument, deleteDocument, getExpiryStatus } from '../lib/db';
import { FileText, Plus, Pencil, Trash2, X, Search, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const DOC_TYPES = [
  'Buildings Insurance','Contents Insurance','Landlord Insurance',
  'Gas Safety Certificate','Electrical Safety Certificate (EICR)',
  'Energy Performance Certificate (EPC)','Fire Safety Certificate',
  'PAT Testing Certificate','Legionella Risk Assessment',
  'HMO Licence','Planning Permission','Boiler Service Record','Other',
];

function DocModal({ doc, properties, onClose }) {
  const { user } = useAuth();
  const [form, setForm] = useState(doc ? {
    ...doc,
    expiryDate: doc.expiryDate?.toDate ? format(doc.expiryDate.toDate(), 'yyyy-MM-dd') : doc.expiryDate || '',
    issueDate:  doc.issueDate?.toDate  ? format(doc.issueDate.toDate(),  'yyyy-MM-dd') : doc.issueDate  || '',
  } : {
    name:'', type:'Buildings Insurance', propertyId: properties[0]?.id || '',
    issueDate:'', expiryDate:'', provider:'', policyNumber:'', reminderDays:30, notes:'',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.expiryDate || !form.propertyId) return;
    setError('');
    setSaving(true);
    try {
      if (doc?.id) {
        await updateDocument(doc.id, form);
      } else {
        await addDocument(user.uid, form);
      }
      onClose();
    } catch (err) {
      console.error('Save document error:', err);
      setError(err.message || 'Save failed. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !saving && onClose()}>
      <div className="modal" style={{ maxWidth:'580px' }}>
        <div className="modal-header">
          <h2 className="modal-title">{doc ? 'Edit Certificate' : 'Add Certificate / Insurance'}</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose} disabled={saving}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {error && (
            <div className="alert alert-error" style={{ marginBottom:'16px' }}>
              <AlertTriangle size={15} style={{ flexShrink:0 }} />
              <span>{error}</span>
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Document Name *</label>
              <input className="form-input" placeholder="e.g. Annual Buildings Insurance" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Document Type *</label>
              <select className="form-input" value={form.type} onChange={e => set('type', e.target.value)}>
                {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Property *</label>
            <select className="form-input" value={form.propertyId} onChange={e => set('propertyId', e.target.value)}>
              <option value="">— Select a property —</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Issue Date</label>
              <input type="date" className="form-input" value={form.issueDate} onChange={e => set('issueDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Expiry Date *</label>
              <input type="date" className="form-input" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Provider / Insurer</label>
              <input className="form-input" placeholder="e.g. Aviva" value={form.provider} onChange={e => set('provider', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Policy / Reference No.</label>
              <input className="form-input" placeholder="POL-12345" value={form.policyNumber} onChange={e => set('policyNumber', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Remind me (days before expiry)</label>
            <select className="form-input" value={form.reminderDays} onChange={e => set('reminderDays', parseInt(e.target.value))}>
              {[7,14,30,60,90].map(d => <option key={d} value={d}>{d} days before</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={2} placeholder="Any additional details…" value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize:'vertical' }} />
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name || !form.expiryDate || !form.propertyId}>
              {saving ? <span className="spinner" /> : null}
              {saving ? 'Saving…' : (doc ? 'Save Changes' : 'Add Certificate')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const { properties, documents } = useData();
  const [modal, setModal]               = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProp,   setFilterProp]   = useState('all');

  const propMap = Object.fromEntries(properties.map(p => [p.id, p]));

  const filtered = documents.filter(d => {
    const { status } = getExpiryStatus(d.expiryDate, d.reminderDays);
    const q = search.toLowerCase();
    return (
      (!search || d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q) || (d.provider||'').toLowerCase().includes(q)) &&
      (filterStatus === 'all' || status === filterStatus) &&
      (filterProp   === 'all' || d.propertyId === filterProp)
    );
  });

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deleteDocument(id);
    } catch (err) {
      console.error('Delete error:', err);
    }
    setDeleteConfirm(null);
    setDeleting(false);
  };

  return (
    <div className="animate-fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Certificates & Insurance</h1>
          <p className="page-subtitle">{documents.length} document{documents.length !== 1 ? 's' : ''} tracked across all properties</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')} disabled={properties.length === 0}>
          <Plus size={15} /> Add Certificate
        </button>
      </div>

      <div className="page-body">
        {properties.length === 0 && (
          <div className="alert alert-warn" style={{ marginBottom:'20px' }}>⚠️ Add a property first before adding certificates.</div>
        )}

        <div style={{ display:'flex', gap:'12px', marginBottom:'20px', flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth:'200px' }}>
            <Search size={15} style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', color:'var(--ink-faint)' }} />
            <input className="form-input" placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:'34px', margin:0 }} />
          </div>
          <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width:'auto', minWidth:'150px' }}>
            <option value="all">All Statuses</option>
            <option value="valid">Valid</option>
            <option value="expiring">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
          <select className="form-input" value={filterProp} onChange={e => setFilterProp(e.target.value)} style={{ width:'auto', minWidth:'160px' }}>
            <option value="all">All Properties</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>{documents.length === 0 ? 'No Certificates Yet' : 'No Results'}</h3>
            <p>{documents.length === 0 ? 'Add your first certificate or insurance document.' : 'Try adjusting your search or filters.'}</p>
            {documents.length === 0 && properties.length > 0 && (
              <button className="btn btn-primary" onClick={() => setModal('add')}><Plus size={15} /> Add Certificate</button>
            )}
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Document</th><th>Property</th><th>Provider</th><th>Expiry Date</th><th>Status</th><th style={{ width:'80px' }}></th></tr>
                </thead>
                <tbody>
                  {filtered.map(doc => {
                    const { status, label } = getExpiryStatus(doc.expiryDate, doc.reminderDays);
                    const expDate = doc.expiryDate?.toDate ? doc.expiryDate.toDate() : new Date(doc.expiryDate);
                    const prop = propMap[doc.propertyId];
                    return (
                      <tr key={doc.id}>
                        <td>
                          <div style={{ fontWeight:'500' }}>{doc.name}</div>
                          <div style={{ fontSize:'11.5px', color:'var(--ink-faint)' }}>{doc.type}</div>
                          {doc.policyNumber && <div style={{ fontSize:'11px', color:'var(--ink-faint)' }}>#{doc.policyNumber}</div>}
                        </td>
                        <td style={{ color:'var(--ink-soft)', fontSize:'13px' }}>
                          {prop?.name || '—'}
                          {prop?.address && <div style={{ fontSize:'11.5px', color:'var(--ink-faint)' }}>{prop.address}</div>}
                        </td>
                        <td style={{ color:'var(--ink-soft)', fontSize:'13px' }}>{doc.provider || '—'}</td>
                        <td style={{ fontSize:'13.5px', fontWeight:'500' }}>{format(expDate, 'd MMM yyyy')}</td>
                        <td><span className={`badge badge-${status}`}>{label}</span></td>
                        <td>
                          <div style={{ display:'flex', gap:'4px' }}>
                            <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setModal(doc)}><Pencil size={13} /></button>
                            <button className="btn btn-icon btn-sm" onClick={() => setDeleteConfirm(doc)}
                              style={{ background:'none', color:'var(--ink-faint)' }}
                              onMouseEnter={e => e.currentTarget.style.color='var(--red)'}
                              onMouseLeave={e => e.currentTarget.style.color='var(--ink-faint)'}
                            ><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <DocModal
          doc={modal === 'add' ? null : modal}
          properties={properties}
          onClose={() => setModal(null)}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth:'380px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ fontSize:'18px' }}>Delete Certificate?</h2>
              <button className="btn btn-icon btn-ghost" onClick={() => setDeleteConfirm(null)} disabled={deleting}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom:'20px', color:'var(--ink-soft)' }}>
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.
              </p>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)} disabled={deleting}>
                  {deleting ? <span className="spinner" /> : <Trash2 size={14} />}
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
