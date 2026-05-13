import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Home, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login, register, resetPassword } = useAuth();
  const [mode, setMode] = useState('login'); // login | register | reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        await register(email, password);
      } else {
        await resetPassword(email);
        setSuccess('Password reset email sent — check your inbox.');
      }
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' ? 'Invalid email or password.'
        : err.code === 'auth/email-already-in-use' ? 'Email already registered.'
        : err.code === 'auth/weak-password' ? 'Password must be at least 6 characters.'
        : err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      {/* Background texture */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `radial-gradient(circle at 20% 80%, rgba(200,80,42,0.06) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(200,80,42,0.04) 0%, transparent 40%)`,
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px' }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px',
            background: 'var(--accent)', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(200,80,42,0.3)',
          }}>
            <Home size={28} color="white" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '30px', color: 'var(--ink)', letterSpacing: '-0.5px' }}>
            PropGuard
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--ink-faint)', marginTop: '6px' }}>
            Property Insurance & Certificate Manager
          </p>
        </div>

        {/* Card */}
        <div className="card animate-fade-up">
          <div className="card-header" style={{ borderBottom: 'none', paddingBottom: '8px' }}>
            <h2 className="card-title" style={{ fontSize: '17px' }}>
              {mode === 'login' ? 'Sign in to your account'
               : mode === 'register' ? 'Create an account'
               : 'Reset your password'}
            </h2>
          </div>
          <div className="card-body">
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="alert alert-success" style={{ marginBottom: '16px' }}>
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email address</label>
                <input
                  type="email" required className="form-input"
                  placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>

              {mode !== 'reset' && (
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password" required className="form-input"
                    placeholder={mode === 'register' ? 'Minimum 6 characters' : '••••••••'}
                    value={password} onChange={e => setPassword(e.target.value)}
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '8px' }}>
                {loading ? <span className="spinner" /> : null}
                {mode === 'login' ? 'Sign In'
                 : mode === 'register' ? 'Create Account'
                 : 'Send Reset Email'}
              </button>
            </form>

            <div className="divider" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              {mode !== 'login' && (
                <button className="btn btn-ghost btn-sm" onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>
                  Back to Sign In
                </button>
              )}
              {mode === 'login' && (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setMode('register'); setError(''); }}>
                    Don't have an account? <strong>Register</strong>
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setMode('reset'); setError(''); }}>
                    Forgot password?
                  </button>
                </>
              )}
              {mode === 'register' && (
                <button className="btn btn-ghost btn-sm" onClick={() => { setMode('login'); setError(''); }}>
                  Already have an account? <strong>Sign in</strong>
                </button>
              )}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--ink-faint)' }}>
          Secure access — only you can see your properties
        </p>
      </div>
    </div>
  );
}
