import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { api, getToken, isLoggedIn } from '../lib/api';

interface Record {
  id: number;
  title: string;
  record_type: string | null;
  description: string | null;
  ai_summary: string | null;
  alert_level: string;
  alert_reason: string | null;
  lab_name: string | null;
  report_date: string | null;
  created_at: string | null;
  is_verified: boolean;
}

export default function PatientRecords() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<Record[]>([]);
  const [selected, setSelected] = useState<Record | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const data = await api<Record[]>('/patient/records', { token: getToken()! });
      setRecords(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const alertBadge = (level: string) => {
    if (level === 'red') return <span className="badge badge-red"><AlertTriangle size={12} /> Critical</span>;
    if (level === 'amber') return <span className="badge badge-amber"><AlertTriangle size={12} /> Amber</span>;
    return <span className="badge badge-normal"><CheckCircle size={12} /> Normal</span>;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Medical Records</h1>
        <p className="page-subtitle">All your lab reports, prescriptions, and summaries in one place</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}>Loading records...</div>
      ) : records.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <FileText size={48} color="var(--color-text-secondary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>No Records Yet</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Your medical records will appear here once a lab or doctor uploads them to your vault.
          </p>
        </div>
      ) : (
        <div className="grid-2">
          {/* Records List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {records.map((r) => (
              <div
                key={r.id}
                className="glass-card"
                onClick={() => setSelected(r)}
                style={{
                  padding: '1.25rem', cursor: 'pointer',
                  borderColor: selected?.id === r.id ? 'rgba(20,184,166,0.5)' : undefined,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{r.title}</h3>
                  {alertBadge(r.alert_level)}
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  {r.record_type && <span style={{ textTransform: 'capitalize' }}>{r.record_type.replace(/_/g, ' ')}</span>}
                  {r.lab_name && <span>· {r.lab_name}</span>}
                  {r.created_at && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Clock size={12} /> {new Date(r.created_at).toLocaleDateString('en-IN')}
                    </span>
                  )}
                </div>
                {r.is_verified && (
                  <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#34d399' }}>
                    <CheckCircle size={12} /> Lab Verified
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Detail Panel */}
          <div>
            {selected ? (
              <div className="glass-card animate-in" style={{ padding: '2rem', position: 'sticky', top: '5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{selected.title}</h2>
                  {alertBadge(selected.alert_level)}
                </div>

                {selected.alert_reason && (
                  <div style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem', fontSize: '0.9rem', color: '#fca5a5',
                  }}>
                    <strong>⚠️ Alert:</strong> {selected.alert_reason}
                  </div>
                )}

                {selected.ai_summary && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label className="label" style={{ marginBottom: '0.5rem' }}>AI Summary</label>
                    <div style={{
                      background: 'rgba(15,23,42,0.8)', borderRadius: '0.75rem', padding: '1.25rem',
                      fontSize: '0.9rem', lineHeight: 1.8, color: 'var(--color-text-secondary)', whiteSpace: 'pre-line',
                    }}>
                      {selected.ai_summary}
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                  <div>
                    <span className="label">Type</span>
                    <p style={{ textTransform: 'capitalize' }}>{selected.record_type?.replace(/_/g, ' ') || '—'}</p>
                  </div>
                  <div>
                    <span className="label">Lab</span>
                    <p>{selected.lab_name || '—'}</p>
                  </div>
                  <div>
                    <span className="label">Report Date</span>
                    <p>{selected.report_date ? new Date(selected.report_date).toLocaleDateString('en-IN') : '—'}</p>
                  </div>
                  <div>
                    <span className="label">Verified</span>
                    <p>{selected.is_verified ? '✅ Yes' : '❌ No'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <FileText size={32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                <p>Select a record to view its AI summary and details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
