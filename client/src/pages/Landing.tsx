import { Link } from 'react-router-dom';
import { Shield, Zap, Stethoscope, FlaskConical, QrCode, Mic, Lock, Activity } from 'lucide-react';

export default function Landing() {
  const features = [
    {
      icon: <QrCode size={24} />,
      iconClass: 'feature-icon-red',
      title: 'Golden Hour QR',
      desc: 'Emergency responders scan a QR code to instantly access life-critical data — blood group, allergies, and emergency contacts. No login required.',
    },
    {
      icon: <Stethoscope size={24} />,
      iconClass: 'feature-icon-teal',
      title: 'Doctor Dashboard',
      desc: 'Clinicians search patients by Universal Medical ID for a complete clinical view with AI-flagged alerts on abnormal lab values.',
    },
    {
      icon: <FlaskConical size={24} />,
      iconClass: 'feature-icon-amber',
      title: 'Lab Direct Upload',
      desc: 'Diagnostic centers upload reports directly to a patient\'s vault. AI auto-summarizes PDFs into actionable clinical bullet points.',
    },
    {
      icon: <Mic size={24} />,
      iconClass: 'feature-icon-blue',
      title: 'Multilingual Voice AI',
      desc: 'Elderly and illiterate users hear their health status in Hindi, Tamil, or English. No medical jargon — just "avoid sugar" or "take BP medicine on time".',
    },
  ];

  const techStack = [
    { icon: <Lock size={18} />, label: 'Aadhaar SHA-256 Hashing' },
    { icon: <Shield size={18} />, label: 'Role-Based Access Control' },
    { icon: <Activity size={18} />, label: 'Break-Glass Audit Trail' },
    { icon: <Zap size={18} />, label: '100% Free & Open Source' },
  ];

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-content animate-in">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: '999px', padding: '0.4rem 1.2rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--color-primary-light)' }}>
            <Shield size={16} /> Built for India's Healthcare System
          </div>
          <h1 className="hero-title">
            Your Medical Identity,<br />
            Secured & Always Accessible
          </h1>
          <p className="hero-desc">
            MedVault AI creates a Universal Medical ID linked to your Aadhaar that gives emergency responders
            instant access to life-saving data during the <strong style={{ color: 'var(--color-accent)' }}>Golden Hour</strong> — while keeping you in full control of your health records.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register">
              <button className="btn-primary" style={{ fontSize: '1.05rem', padding: '1rem 2.5rem' }}>
                <Shield size={20} /> Create Your Vault
              </button>
            </Link>
            <Link to="/login">
              <button className="btn-outline" style={{ fontSize: '1.05rem', padding: '1rem 2.5rem' }}>
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="page-container" style={{ paddingTop: '0' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Four Interfaces. One Ecosystem.
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem', fontSize: '1.05rem' }}>
            Each user sees only what they need — enforced by Role-Based Access Control.
          </p>
        </div>

        <div className="grid-2">
          {features.map((f, i) => (
            <div key={i} className={`glass-card animate-in animate-in-delay-${i + 1}`} style={{ padding: '2rem' }}>
              <div className={`feature-icon ${f.iconClass}`}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {f.title}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Bar */}
      <section className="page-container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          {techStack.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--color-primary-light)' }}>{t.icon}</span>
              {t.label}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
        <p>MedVault AI · India's Medical Identity Ecosystem · 100% Free & Open Source</p>
        <p style={{ marginTop: '0.3rem', opacity: 0.6 }}>This is a hackathon project. Not for clinical use.</p>
      </footer>
    </>
  );
}
