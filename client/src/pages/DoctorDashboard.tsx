import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Stethoscope, AlertTriangle, User, Droplets, Heart, Pill, FileText } from 'lucide-react';
import { api, getToken, getUser, isLoggedIn } from '../lib/api';

interface PatientData {
  medical_id: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  allergies: string;
  chronic_conditions: string;
  current_medications: string;
}

interface RecordData {
  id: number;
  title: string;
  record_type: string | null;
  ai_summary: string | null;
  alert_level: string;
  alert_reason: string | null;
  report_date: string | null;
}

interface SearchResult {
  patient: PatientData;
  records: RecordData[];
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [searchId, setSearchId] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    const user = getUser();
    if (user?.role !== 'doctor') { navigate('/patient'); return; }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const data = await api<SearchResult>(`/doctor/search/${searchId.trim()}`, { token: getToken()! });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const criticalRecords = result?.records.filter(r => r.alert_level === 'red' || r.alert_level === 'amber') || [];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Stethoscope size={32} /> Doctor Dashboard
          </span>
        </h1>
        <p className="page-subtitle">Search patients by Universal Medical ID for clinical review</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="glass-card animate-in" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <label className="label">Patient Medical ID</label>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            className="input-field"
            placeholder="Enter patient's Universal Medical ID (SHA-256 hash)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            <Search size={16} /> {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
          Demo ID: The patient's hashed Aadhaar. Login as demo patient first to see their Medical ID.
        </p>
      </form>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#f87171' }}>{error}</div>
      )}

      {result && (
        <>
          {/* Critical Alerts */}
          {criticalRecords.length > 0 && (
            <div className="animate-in" style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem',
            }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 700 }}>
                <AlertTriangle size={20} /> Critical Alerts ({criticalRecords.length})
              </h3>
              {criticalRecords.map((r, i) => (
                <div key={i} style={{ padding: '0.5rem 0', borderBottom: i < criticalRecords.length - 1 ? '1px solid rgba(239,68,68,0.15)' : 'none' }}>
                  <span style={{ fontWeight: 600 }}>{r.title}</span>
                  {r.alert_reason && <span style={{ color: '#fca5a5', fontSize: '0.85rem', marginLeft: '0.75rem' }}>{r.alert_reason}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Patient Info */}
          <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
            <div className="glass-card animate-in" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={20} color="#14b8a6" /> Patient Profile
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <span className="label">Full Name</span>
                  <p style={{ fontWeight: 600, fontSize: '1.05rem' }}>{result.patient.full_name}</p>
                </div>
                <div>
                  <span className="label">Date of Birth</span>
                  <p>{result.patient.date_of_birth || '—'}</p>
                </div>
                <div>
                  <span className="label">Gender</span>
                  <p>{result.patient.gender || '—'}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                  <Droplets size={16} color="#14b8a6" style={{ marginTop: '1.4rem' }} />
                  <div>
                    <span className="label">Blood Group</span>
                    <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-primary-light)' }}>
                      {result.patient.blood_group || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card animate-in animate-in-delay-1" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Heart size={20} color="#f87171" /> Clinical Summary
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <AlertTriangle size={12} color="#f59e0b" /> Allergies
                  </span>
                  <p style={{ color: '#fbbf24', fontWeight: 600 }}>{result.patient.allergies || 'None reported'}</p>
                </div>
                <div>
                  <span className="label">Chronic Conditions</span>
                  <p>{result.patient.chronic_conditions || 'None reported'}</p>
                </div>
                <div>
                  <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Pill size={12} color="#60a5fa" /> Current Medications
                  </span>
                  <p>{result.patient.current_medications || 'None reported'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Records */}
          <div className="glass-card animate-in animate-in-delay-2" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} color="#14b8a6" /> Medical Records ({result.records.length})
            </h2>
            {result.records.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)' }}>No records available for this patient.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {result.records.map((r) => (
                  <div key={r.id} style={{
                    background: 'rgba(15,23,42,0.5)', borderRadius: '0.75rem', padding: '1.25rem',
                    border: r.alert_level === 'red' ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontWeight: 700 }}>{r.title}</h4>
                      <span className={`badge ${r.alert_level === 'red' ? 'badge-red' : r.alert_level === 'amber' ? 'badge-amber' : 'badge-normal'}`}>
                        {r.alert_level}
                      </span>
                    </div>
                    {r.ai_summary && (
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                        {r.ai_summary}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
