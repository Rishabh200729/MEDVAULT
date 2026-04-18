import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Upload, FileText, CheckCircle, AlertTriangle, Loader } from 'lucide-react';
import { getToken, getUser, isLoggedIn, uploadFile } from '../lib/api';

interface UploadResult {
  message: string;
  record_id: number;
  ai_summary: string;
  alert_level: string;
  alert_reason: string;
}

export default function LabInterface() {
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState('');
  const [title, setTitle] = useState('');
  const [recordType, setRecordType] = useState('lab_report');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    const user = getUser();
    if (user?.role !== 'lab' && user?.role !== 'doctor') { navigate('/patient'); return; }
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !patientId.trim() || !title.trim()) {
      setError('Please fill all fields and select a file.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const data = await uploadFile(
        `/lab/upload/${patientId.trim()}`,
        file,
        getToken()!,
        { title, record_type: recordType }
      );
      setResult(data);
      setFile(null);
      setTitle('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FlaskConical size={32} /> Lab Upload Portal
          </span>
        </h1>
        <p className="page-subtitle">Upload diagnostic reports directly to a patient's medical vault</p>
      </div>

      <div className="grid-2">
        {/* Upload Form */}
        <div className="glass-card animate-in" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={20} color="#14b8a6" /> Upload Report
          </h2>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#f87171', fontSize: '0.9rem' }}>{error}</div>
          )}

          <form onSubmit={handleUpload}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label">Patient Medical ID</label>
              <input
                className="input-field"
                placeholder="Enter patient's Universal Medical ID"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label">Report Title</label>
              <input
                className="input-field"
                placeholder="e.g. Complete Blood Count (CBC)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label">Report Type</label>
              <select className="input-field" value={recordType} onChange={(e) => setRecordType(e.target.value)}>
                <option value="lab_report">Lab Report</option>
                <option value="prescription">Prescription</option>
                <option value="discharge_summary">Discharge Summary</option>
                <option value="imaging">Imaging (X-Ray, MRI)</option>
                <option value="vaccination">Vaccination Record</option>
              </select>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--color-primary-light)' : 'var(--color-border)'}`,
                borderRadius: '1rem', padding: '2.5rem', textAlign: 'center', cursor: 'pointer',
                marginBottom: '1.5rem', transition: 'all 0.2s ease',
                background: dragOver ? 'rgba(20,184,166,0.05)' : 'transparent',
              }}
            >
              <FileText size={32} color="var(--color-text-secondary)" style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
              {file ? (
                <div>
                  <p style={{ fontWeight: 600 }}>{file.name}</p>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                    {(file.size / 1024).toFixed(1)} KB · Click to change
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ fontWeight: 600, marginBottom: '0.3rem' }}>Drop your report here</p>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                    Supports PDF, JPG, PNG, TXT
                  </p>
                </div>
              )}
              <input
                id="file-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.txt,.bmp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? (
                <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing & Analyzing...</>
              ) : (
                <><Upload size={16} /> Upload & Auto-Analyze</>
              )}
            </button>
          </form>
        </div>

        {/* Result Panel */}
        <div>
          {result ? (
            <div className="glass-card animate-in" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <CheckCircle size={24} color="#34d399" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Upload Successful!</h2>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <span className="label">Record ID</span>
                <p style={{ fontWeight: 600, color: 'var(--color-primary-light)' }}>#{result.record_id}</p>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <span className="label">Alert Level</span>
                <div style={{ marginTop: '0.3rem' }}>
                  <span className={`badge ${result.alert_level === 'red' ? 'badge-red' : result.alert_level === 'amber' ? 'badge-amber' : 'badge-normal'}`}>
                    {result.alert_level === 'red' && <AlertTriangle size={12} />}
                    {result.alert_level.toUpperCase()}
                  </span>
                </div>
              </div>

              {result.alert_reason && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.25rem',
                  fontSize: '0.9rem', color: '#fca5a5',
                }}>
                  <strong>⚠️ Clinical Alert:</strong> {result.alert_reason}
                </div>
              )}

              <div>
                <span className="label">AI-Generated Summary</span>
                <div style={{
                  background: 'rgba(15,23,42,0.8)', borderRadius: '0.75rem', padding: '1.25rem',
                  marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: 1.8,
                  color: 'var(--color-text-secondary)', whiteSpace: 'pre-line',
                }}>
                  {result.ai_summary}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <FlaskConical size={48} color="var(--color-text-secondary)" style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', marginBottom: '0.5rem' }}>
                AI Analysis Preview
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                Upload a report and our AI engine will automatically:<br />
                • Extract text via OCR<br />
                • Parse lab values<br />
                • Flag critical markers (glucose, troponin, TSH...)<br />
                • Generate clinical bullet points
              </p>
            </div>
          )}

          {/* How It Works */}
          <div className="glass-card" style={{ padding: '1.5rem', marginTop: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>How The Pipeline Works</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--color-primary-light)', fontWeight: 700, minWidth: '1.5rem' }}>01</span>
                <span>Report uploaded → saved securely to patient's vault</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--color-primary-light)', fontWeight: 700, minWidth: '1.5rem' }}>02</span>
                <span>OCR engine extracts all text (Tesseract — free & open-source)</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--color-primary-light)', fontWeight: 700, minWidth: '1.5rem' }}>03</span>
                <span>AI parses lab values & checks against Indian reference ranges</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <span style={{ color: 'var(--color-primary-light)', fontWeight: 700, minWidth: '1.5rem' }}>04</span>
                <span>Critical markers trigger 🔴 RED alerts on the Doctor Dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
