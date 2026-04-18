import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { api, saveAuth } from '../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    aadhaar_number: '',
    full_name: '',
    password: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    email: '',
    role: 'patient',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body = { ...form, aadhaar_number: form.aadhaar_number.replace(/\s/g, '') };
      const data = await api<{ token: string; medical_id: string; role: string; name: string }>(
        '/auth/register',
        { method: 'POST', body }
      );
      saveAuth(data.token, { medical_id: data.medical_id, role: data.role, name: data.name });
      navigate('/patient');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 4rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-card animate-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '520px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3.5rem', height: '3.5rem', borderRadius: '1rem', background: 'rgba(20,184,166,0.15)', marginBottom: '1rem' }}>
            <UserPlus size={28} color="#14b8a6" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Create Your Vault</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            Register with your Aadhaar to get a Universal Medical ID
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#f87171', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="label">Full Name</label>
              <input className="input-field" placeholder="e.g. Rajesh Kumar" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} required />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="label">Aadhaar Number</label>
              <input className="input-field" placeholder="XXXX XXXX XXXX" value={form.aadhaar_number} onChange={(e) => update('aadhaar_number', e.target.value)} maxLength={14} required />
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input className="input-field" type="date" value={form.date_of_birth} onChange={(e) => update('date_of_birth', e.target.value)} />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input-field" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input-field" type="tel" placeholder="+91XXXXXXXXXX" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input-field" type="email" placeholder="your@email.com" value={form.email} onChange={(e) => update('email', e.target.value)} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="label">Password</label>
              <input className="input-field" type="password" placeholder="Create a strong password" value={form.password} onChange={(e) => update('password', e.target.value)} required />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="label">Role</label>
              <select className="input-field" value={form.role} onChange={(e) => update('role', e.target.value)}>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="lab">Diagnostic Lab</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }} disabled={loading}>
            {loading ? 'Creating...' : 'Create Medical Vault'}
          </button>
        </form>
      </div>
    </div>
  );
}
