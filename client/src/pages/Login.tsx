import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { api, saveAuth } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const [aadhaar, setAadhaar] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api<{ token: string; medical_id: string; role: string; name: string }>(
        '/auth/login',
        { method: 'POST', body: { aadhaar_number: aadhaar.replace(/\s/g, ''), password } }
      );
      saveAuth(data.token, { medical_id: data.medical_id, role: data.role, name: data.name });

      // Route based on role
      if (data.role === 'doctor') navigate('/doctor');
      else if (data.role === 'lab') navigate('/lab');
      else navigate('/patient');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 4rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-card animate-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3.5rem', height: '3.5rem', borderRadius: '1rem', background: 'rgba(20,184,166,0.15)', marginBottom: '1rem' }}>
            <Shield size={28} color="#14b8a6" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Sign In to MedVault</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            Enter your Aadhaar number and password
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#f87171', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="label">Aadhaar Number</label>
            <input
              className="input-field"
              type="text"
              placeholder="XXXX XXXX XXXX"
              value={aadhaar}
              onChange={(e) => setAadhaar(e.target.value)}
              maxLength={14}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input-field"
                type={showPw ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              Demo credentials: <code style={{ color: 'var(--color-primary-light)' }}>123456789012</code> / <code style={{ color: 'var(--color-primary-light)' }}>demo123</code>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
