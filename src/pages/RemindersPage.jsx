import { useState } from 'react';
import { useData } from '../hooks/useData';
import { getExpiryStatus } from '../lib/db';
import { Bell, CheckCircle2, AlertTriangle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  expired:  { label:'Expired',       icon:XCircle,       color:'var(--red)',   bg:'var(--red-light)',   border:'rgba(185,28,28,0.2)' },
  expiring: { label:'Expiring Soon', icon:AlertTriangle, color:'var(--amber)', bg:'var(--amber-light)', border:'rgba(181,131,10,0.2)' },
  valid:    { label:'Valid',         icon:CheckCircle2,  color:'var(--green)', bg:'var(--green-light)', border:'rgba(45,106,79,0.2)' },
};

function ReminderCard({ doc, property }) {
  const { status, label } = getExpiryStatus(doc.expiryDate, doc.reminderDays);
  const cfg  = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  const expDate = doc.expiryDate?.toDate ? doc.expiryDate.toDate() : new Date(doc.expiryDate);
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ background:'var(--paper-card)', border:`1px solid ${cfg.border}`, borderLeft:`4px solid ${cfg.color}`, borderRadius:'var(--radius)', padding:'18px 20px', boxShadow:'var(--shadow-sm)' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:'14px' }}>
        <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', color:cfg.color, flexShrink:0 }}>
          <Icon size={19} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px' }}>
            <div>
              <div style={{ fontWeight:'600', fontSize:'14.5px' }}>{doc.name}</div>
              <div style={{ fontSize:'12px', color:'var(--ink-faint)', marginTop:'2px' }}>{doc.type} · {property?.name || 'Unknown'}</div>
            </div>
            <span className={`badge badge-${status}`} style={{ flexShrink:0 }}>{label}</span>
          </div>
          <div style={{ marginTop:'12px', display:'flex', gap:'24px', flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--ink-faint)', fontWeight:'500', marginBottom:'2px' }}>Expiry Date</div>
              <div style={{ fontSize:'14px', fontWeight:'600', color: status === 'expired' ? 'var(--red)' : 'var(--ink)' }}>{format(expDate, 'd MMMM yyyy')}</div>
            </div>
            {doc.provider && (
              <div>
                <div style={{ fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--ink-faint)', fontWeight:'500', marginBottom:'2px' }}>Provider</div>
                <div style={{ fontSize:'14px' }}>{doc.provider}</div>
              </div>
            )}
            {doc.policyNumber && (
              <div>
                <div style={{ fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--ink-faint)', fontWeight:'500', marginBottom:'2px' }}>Policy No.</div>
                <div style={{ fontSize:'14px', fontFamily:'monospace' }}>{doc.policyNumber}</div>
              </div>
            )}
          </div>
          {doc.notes && (
            <div style={{ marginTop:'10px' }}>
              <button style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', color:'var(--ink-faint)' }} onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronUp size={13}/> : <ChevronDown size={13}/>} {expanded ? 'Hide' : 'Show'} notes
              </button>
              {expanded && <p style={{ fontSize:'13px', color:'var(--ink-soft)', marginTop:'6px', padding:'10px', background:'var(--paper-warm)', borderRadius:'var(--radius-sm)' }}>{doc.notes}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RemindersPage() {
  const { properties, documents } = useData();
  const [activeTab, setActiveTab] = useState('urgent');

  const propMap = Object.fromEntries(properties.map(p => [p.id, p]));
  const byStatus = (s) => documents.filter(d => getExpiryStatus(d.expiryDate, d.reminderDays).status === s);

  const expired  = byStatus('expired');
  const expiring = byStatus('expiring');
  const valid    = byStatus('valid');
  const urgent   = [...expired, ...expiring];

  const renderList = (list) => list.length === 0 ? (
    <div className="empty-state">
      <CheckCircle2 size={48} />
      <h3>Nothing here</h3>
      <p>No documents match this filter.</p>
    </div>
  ) : (
    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
      {list.map(doc => <ReminderCard key={doc.id} doc={doc} property={propMap[doc.propertyId]} />)}
    </div>
  );

  return (
    <div className="animate-fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reminders</h1>
          <p className="page-subtitle">{urgent.length > 0 ? `${urgent.length} document${urgent.length > 1 ? 's' : ''} need attention` : 'All certificates are up to date'}</p>
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          {expired.length  > 0 && <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 16px', borderRadius:'var(--radius-sm)', background:'var(--red-light)', color:'var(--red)', border:'1px solid rgba(185,28,28,0.2)', fontSize:'13.5px', fontWeight:'500' }}><XCircle size={16}/> {expired.length} Expired</div>}
          {expiring.length > 0 && <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 16px', borderRadius:'var(--radius-sm)', background:'var(--amber-light)', color:'var(--amber)', border:'1px solid rgba(181,131,10,0.2)', fontSize:'13.5px', fontWeight:'500' }}><Clock size={16}/> {expiring.length} Expiring</div>}
        </div>
      </div>

      <div className="page-body">
        <div style={{ background:'var(--paper-warm)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'14px 18px', fontSize:'13px', color:'var(--ink-soft)', display:'flex', gap:'12px', alignItems:'flex-start', marginBottom:'24px' }}>
          <Bell size={16} style={{ flexShrink:0, marginTop:'2px', color:'var(--accent)' }} />
          <div>Alerts appear here and on your dashboard based on each certificate's reminder threshold. For email reminders, set up a Firebase Cloud Function — see the README.</div>
        </div>

        <div className="tabs">
          {[
            { id:'urgent',   label:`Urgent${urgent.length   > 0 ? ` (${urgent.length})`   : ''}` },
            { id:'expired',  label:`Expired${expired.length  > 0 ? ` (${expired.length})`  : ''}` },
            { id:'expiring', label:`Expiring${expiring.length > 0 ? ` (${expiring.length})` : ''}` },
            { id:'valid',    label:`Valid (${valid.length})` },
          ].map(t => (
            <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {activeTab === 'urgent'   && renderList(urgent)}
        {activeTab === 'expired'  && renderList(expired)}
        {activeTab === 'expiring' && renderList(expiring)}
        {activeTab === 'valid'    && renderList(valid)}
      </div>
    </div>
  );
}
