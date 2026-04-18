import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, Droplets, Heart, Pill, Phone, Shield, Loader } from 'lucide-react';

interface EmergencyData {
  status: string;
  patient_name: string;
  blood_group: string;
  allergies: string;
  chronic_conditions: string;
  current_medications: string;
  emergency_contact: {
    name: string;
    phone: string;
  };
  disclaimer: string;
}

export default function EmergencyView() {
  const { medicalId } = useParams();
  const [data, setData] = useState<EmergencyData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!medicalId) return;
    fetch(`/api/emergency/${medicalId}`)
      .then(r => {
        if (!r.ok) throw new Error('Medical ID not found');
        return r.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [medicalId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a0000' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader size={48} className="animate-spin" color="#ef4444" style={{ marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '1.2rem', color: '#fca5a5' }}>Loading Emergency Data...</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a0000', padding: '2rem' }}>
        <div className="emergency-card" style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
          <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Patient Not Found</h1>
          <p style={{ color: '#fca5a5' }}>{error || 'Invalid Medical ID'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1a0000' }}>
      {/* Emergency Banner */}
      <div className="emergency-banner">
        🚨 EMERGENCY ACCESS — LIFE-CRITICAL DATA ONLY 🚨
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '1.5rem' }}>
        {/* Patient Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', paddingTop: '1rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '4rem', height: '4rem', borderRadius: '50%',
            background: 'rgba(239,68,68,0.2)', border: '2px solid rgba(239,68,68,0.4)',
            marginBottom: '1rem',
          }}>
            <Shield size={28} color="#f87171" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white' }}>{data.patient_name}</h1>
          <p style={{ color: '#fca5a5', fontSize: '0.9rem', marginTop: '0.3rem' }}>Emergency Medical Profile</p>
        </div>

        {/* Blood Group - HUGE and prominent */}
        <div className="emergency-card" style={{ textAlign: 'center', marginBottom: '1rem', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Droplets size={28} color="#f87171" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fca5a5' }}>Blood Group</span>
          </div>
          <div style={{ fontSize: '4rem', fontWeight: 900, color: 'white', letterSpacing: '0.05em' }}>
            {data.blood_group || 'UNKNOWN'}
          </div>
        </div>

        {/* Critical Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
          {/* Allergies */}
          <div className="emergency-card">
            <div className="emergency-field">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} color="#fbbf24" />
                <span className="emergency-field-label" style={{ marginBottom: 0 }}>Known Allergies</span>
              </div>
              <div className="emergency-field-value" style={{ marginTop: '0.5rem' }}>
                {data.allergies ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {data.allergies.split(',').map((a, i) => (
                      <span key={i} style={{
                        background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)',
                        borderRadius: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '1rem', fontWeight: 700,
                      }}>
                        ⚠️ {a.trim()}
                      </span>
                    ))}
                  </div>
                ) : 'No known allergies'}
              </div>
            </div>
          </div>

          {/* Chronic Conditions */}
          <div className="emergency-card">
            <div className="emergency-field">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Heart size={18} color="#f87171" />
                <span className="emergency-field-label" style={{ marginBottom: 0 }}>Chronic Conditions</span>
              </div>
              <div className="emergency-field-value" style={{ marginTop: '0.5rem' }}>
                {data.chronic_conditions || 'None reported'}
              </div>
            </div>
          </div>

          {/* Current Medications */}
          <div className="emergency-card">
            <div className="emergency-field">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Pill size={18} color="#60a5fa" />
                <span className="emergency-field-label" style={{ marginBottom: 0 }}>Current Medications</span>
              </div>
              <div className="emergency-field-value" style={{ marginTop: '0.5rem' }}>
                {data.current_medications || 'None reported'}
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact - CTA */}
        {data.emergency_contact?.phone && (
          <a
            href={`tel:${data.emergency_contact.phone}`}
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <div style={{
              background: 'linear-gradient(135deg, #15803d, #22c55e)',
              borderRadius: '1rem', padding: '1.5rem', textAlign: 'center',
              marginBottom: '1rem', cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                <Phone size={24} color="white" />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'white' }}>
                    Emergency Contact — {data.emergency_contact.name}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginTop: '0.2rem' }}>
                    📞 TAP TO CALL: {data.emergency_contact.phone}
                  </div>
                </div>
              </div>
            </div>
          </a>
        )}

        {/* Disclaimer */}
        <div style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem',
          padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#9ca3af',
        }}>
          <Shield size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.3rem' }} />
          {data.disclaimer}
        </div>
      </div>
    </div>
  );
}
