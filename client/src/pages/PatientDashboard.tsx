import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Droplets, AlertTriangle, Pill, Phone, QrCode, Mic, Volume2, Shield, ClipboardList, MessageCircle } from 'lucide-react';
import { api, getToken, getUser, isLoggedIn } from '../lib/api';
import VoiceChatRAG from '../components/VoiceChatRAG';

interface Profile {
  medical_id: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string;
  blood_group: string;
  allergies: string;
  chronic_conditions: string;
  current_medications: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

interface AuditEntry {
  accessed_by: string;
  access_type: string;
  data_accessed: string;
  timestamp: string;
}

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [voiceLang, setVoiceLang] = useState('hi');
  const [voiceText, setVoiceText] = useState('');
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    loadProfile();
    loadAuditLog();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api<Profile>('/patient/profile', { token: getToken()! });
      setProfile(data);
      setEditForm({
        blood_group: data.blood_group || '',
        allergies: data.allergies || '',
        chronic_conditions: data.chronic_conditions || '',
        current_medications: data.current_medications || '',
        emergency_contact_name: data.emergency_contact_name || '',
        emergency_contact_phone: data.emergency_contact_phone || '',
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    }
  };

  const loadAuditLog = async () => {
    try {
      const data = await api<AuditEntry[]>('/patient/audit-log', { token: getToken()! });
      setAuditLogs(data);
    } catch { /* ignore */ }
  };

  const handleSave = async () => {
    try {
      await api('/patient/profile', { method: 'PUT', token: getToken()!, body: editForm });
      setEditing(false);
      loadProfile();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleVoice = async () => {
    try {
      const data = await api<{ voice_summary: string }>('/voice/summary', {
        method: 'POST', token: getToken()!, body: { language: voiceLang }
      });
      setVoiceText(data.voice_summary);

      // Use browser Speech Synthesis (100% free)
      if ('speechSynthesis' in window) {
        setVoicePlaying(true);
        const utterance = new SpeechSynthesisUtterance(data.voice_summary);
        utterance.lang = voiceLang === 'hi' ? 'hi-IN' : voiceLang === 'ta' ? 'ta-IN' : 'en-IN';
        utterance.rate = 0.9;
        utterance.onend = () => setVoicePlaying(false);
        speechSynthesis.speak(utterance);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Voice AI failed');
    }
  };

  if (!profile) return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
      <div style={{ color: 'var(--color-text-secondary)' }}>Loading your vault...</div>
    </div>
  );

  const emergencyUrl = `${window.location.origin}/emergency/${profile.medical_id}`;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Patient Dashboard</h1>
        <p className="page-subtitle">Welcome back, {profile.full_name}</p>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#f87171', fontSize: '0.9rem' }}>{error}</div>
      )}

      {/* Stats Row */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-card stat-card animate-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Droplets size={18} color="#14b8a6" />
            <span className="stat-label">Blood Group</span>
          </div>
          <div className="stat-value">{profile.blood_group || '—'}</div>
        </div>
        <div className="glass-card stat-card animate-in animate-in-delay-1">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={18} color="#f59e0b" />
            <span className="stat-label">Allergies</span>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{profile.allergies || 'None listed'}</div>
        </div>
        <div className="glass-card stat-card animate-in animate-in-delay-2">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Heart size={18} color="#f87171" />
            <span className="stat-label">Conditions</span>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{profile.chronic_conditions || 'None listed'}</div>
        </div>
        <div className="glass-card stat-card animate-in animate-in-delay-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Pill size={18} color="#60a5fa" />
            <span className="stat-label">Medications</span>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{profile.current_medications || 'None listed'}</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Emergency QR */}
        <div className="glass-card animate-in" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <QrCode size={20} color="#f87171" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Emergency QR Code</h2>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Print this QR code and keep it in your wallet. Emergency responders can scan it for instant access to your life-critical data.
          </p>
          <button className="btn-danger" onClick={() => setShowQR(!showQR)}>
            <QrCode size={16} /> {showQR ? 'Hide' : 'Show'} QR Code
          </button>
          {showQR && (
            <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
              <div className="qr-container">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(emergencyUrl)}`}
                  alt="Emergency QR Code"
                  style={{ width: 200, height: 200 }}
                />
              </div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                Medical ID: <code style={{ color: 'var(--color-primary-light)' }}>{profile.medical_id.slice(0, 16)}...</code>
              </p>
            </div>
          )}
        </div>

        {/* Voice AI */}
        <div className="glass-card animate-in animate-in-delay-1" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Mic size={20} color="#60a5fa" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Voice Health Summary</h2>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Hear your health status in your preferred language. Designed for elderly and visually impaired users.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <select className="input-field" style={{ width: 'auto' }} value={voiceLang} onChange={(e) => setVoiceLang(e.target.value)}>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="en">English</option>
              <option value="ta">தமிழ் (Tamil)</option>
            </select>
            <button className="btn-primary" onClick={handleVoice} disabled={voicePlaying}>
              <Volume2 size={16} /> {voicePlaying ? 'Speaking...' : 'Play Summary'}
            </button>
          </div>
          {voiceText && (
            <div style={{ background: 'rgba(15,23,42,0.8)', borderRadius: '0.75rem', padding: '1rem', fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
              {voiceText}
            </div>
          )}
        </div>
      </div>

      {/* RAG Voice Chat */}
      <div style={{ marginTop: '1.5rem' }}>
        <div className="page-header" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageCircle size={22} color="#14b8a6" /> AI Health Chat
          </h2>
          <p className="page-subtitle">Speech-to-speech RAG assistant — ask anything about your medical records</p>
        </div>
        <VoiceChatRAG />
      </div>

      {/* Edit Profile */}
      <div className="glass-card animate-in" style={{ padding: '2rem', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={20} color="#14b8a6" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Medical Profile</h2>
          </div>
          <button className={editing ? 'btn-primary' : 'btn-outline'} onClick={editing ? handleSave : () => setEditing(true)} style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
            {editing ? 'Save Changes' : 'Edit Profile'}
          </button>
        </div>
        <div className="grid-2">
          {[
            { key: 'blood_group', label: 'Blood Group', ph: 'e.g. B+, O-, AB+' },
            { key: 'allergies', label: 'Allergies', ph: 'e.g. Penicillin, Sulfa drugs' },
            { key: 'chronic_conditions', label: 'Chronic Conditions', ph: 'e.g. Diabetes, Hypertension' },
            { key: 'current_medications', label: 'Current Medications', ph: 'e.g. Metformin 500mg' },
            { key: 'emergency_contact_name', label: 'Emergency Contact Name', ph: "e.g. Priya Kumar" },
            { key: 'emergency_contact_phone', label: 'Emergency Contact Phone', ph: '+91XXXXXXXXXX' },
          ].map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <input
                className="input-field"
                value={editForm[f.key] || ''}
                onChange={(e) => setEditForm({ ...editForm, [f.key]: e.target.value })}
                placeholder={f.ph}
                disabled={!editing}
                style={!editing ? { opacity: 0.7 } : {}}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Audit Trail */}
      <div className="glass-card animate-in" style={{ padding: '2rem', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <ClipboardList size={20} color="#f59e0b" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Access Audit Trail</h2>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Every time someone views your data, it is logged here. You have full transparency.
        </p>
        {auditLogs.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>No access logs yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Accessed By</th>
                  <th>Type</th>
                  <th>Details</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{log.accessed_by}</td>
                    <td>
                      <span className={`badge ${log.access_type === 'emergency_qr_scan' ? 'badge-red' : 'badge-normal'}`}>
                        {log.access_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{log.data_accessed}</td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
