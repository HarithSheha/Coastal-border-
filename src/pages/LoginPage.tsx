import { useState } from 'react';
import { api } from '../lib/api';

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  role: string;
}

interface Props {
  onLogin: (user: AuthUser) => void;
}

function CoastalBadgeSVG() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <path id="topArc" d="M 9,100 A 91,91 0 0,1 191,100" />
        <path id="botArc" d="M 9,100 A 91,91 0 0,0 191,100" />
      </defs>

      {/* Background */}
      <circle cx="100" cy="100" r="99" fill="#1a2744" />
      {/* Outer gold ring */}
      <circle cx="100" cy="100" r="97" fill="none" stroke="#c9a227" strokeWidth="5" />
      {/* Rope-style dashed ring */}
      <circle cx="100" cy="100" r="91" fill="none" stroke="#c9a227" strokeWidth="1.2" strokeDasharray="4 2.5" />
      {/* Inner thin ring */}
      <circle cx="100" cy="100" r="86" fill="none" stroke="#c9a227" strokeWidth="0.7" />

      {/* Top arc text */}
      <text fontSize="11" fill="#c9a227" fontWeight="bold" fontFamily="Georgia,serif" letterSpacing="3" textAnchor="middle">
        <textPath href="#topArc" startOffset="50%">COASTAL BORDER SECURITY</textPath>
      </text>

      {/* Bottom arc text */}
      <text fontSize="8" fill="#c9a227" fontFamily="Georgia,serif" letterSpacing="1.6" textAnchor="middle">
        <textPath href="#botArc" startOffset="50%">GUARDING THE MARITIME SHORELINE</textPath>
      </text>

      {/* Anchors */}
      <text x="26" y="116" fontSize="15" fill="#c9a227" textAnchor="middle">⚓</text>
      <text x="174" y="116" fontSize="15" fill="#c9a227" textAnchor="middle">⚓</text>

      {/* Shield */}
      <path d="M100,32 L147,50 L147,92 Q147,124 100,143 Q53,124 53,92 L53,50 Z"
        fill="#0d1f3c" stroke="#c9a227" strokeWidth="2.5" />

      {/* Compass */}
      <circle cx="100" cy="49" r="12" fill="#ddd8bc" stroke="#c9a227" strokeWidth="1.8" />
      <line x1="100" y1="39" x2="100" y2="59" stroke="#b8960c" strokeWidth="1" />
      <line x1="90" y1="49" x2="110" y2="49" stroke="#b8960c" strokeWidth="1" />
      <polygon points="100,39 97.5,47 100,46 102.5,47" fill="#c9a227" />
      <polygon points="100,59 97.5,51 100,52 102.5,51" fill="#6b7280" />
      <polygon points="90,49 98,46.5 97,49 98,51.5" fill="#6b7280" />
      <polygon points="110,49 102,46.5 103,49 102,51.5" fill="#c9a227" />
      <circle cx="100" cy="49" r="2.5" fill="#c9a227" />
      <text x="100" y="41" textAnchor="middle" fontSize="5" fill="#1a2744" fontWeight="bold" fontFamily="sans-serif">N</text>
      <text x="100" y="60" textAnchor="middle" fontSize="5" fill="#1a2744" fontFamily="sans-serif">S</text>
      <text x="113" y="51" textAnchor="middle" fontSize="5" fill="#1a2744" fontFamily="sans-serif">E</text>
      <text x="88" y="51" textAnchor="middle" fontSize="5" fill="#1a2744" fontFamily="sans-serif">W</text>

      {/* Coastline silhouette */}
      <path d="M74,63 L81,65 L80,74 L86,72 L88,81 L85,89 L81,91"
        stroke="#475569" strokeWidth="1.5" fill="#475569" fillOpacity="0.35" />

      {/* Lighthouse */}
      <rect x="119" y="64" width="11" height="25" fill="#f1f5f9" rx="1.5" />
      <path d="M117,64 L132,64 L125.5,53 Z" fill="#f59e0b" />
      <circle cx="125.5" cy="57" r="3.5" fill="#fef08a" opacity="0.9" />
      <rect x="117" y="79" width="15" height="4" fill="#cbd5e1" rx="1" />
      <rect x="119" y="83" width="11" height="7" fill="#94a3b8" rx="1" />

      {/* Waves */}
      <path d="M60,100 Q67,95 74,100 Q81,105 88,100 Q95,95 102,100 Q109,105 116,100 Q123,95 130,100 Q137,105 140,100"
        stroke="#38bdf8" strokeWidth="2" fill="none" />
      <path d="M62,108 Q70,103 77,108 Q85,113 92,108 Q100,103 107,108 Q115,113 122,108 Q128,105 132,108"
        stroke="#0ea5e9" strokeWidth="1.4" fill="none" opacity="0.65" />

      {/* Ship */}
      <path d="M78,118 L122,118 L118,126 L82,126 Z" fill="#1e3a8a" />
      <rect x="89" y="112" width="22" height="7" fill="#1d4ed8" rx="1" />
      <rect x="97" y="106" width="4" height="8" fill="#93c5fd" />
      <line x1="99" y1="106" x2="109" y2="111" stroke="#93c5fd" strokeWidth="1" />

      {/* Olive branches */}
      <path d="M82,134 Q77,130 72,133" stroke="#4ade80" strokeWidth="1.3" fill="none" />
      <circle cx="71" cy="133" r="2.5" fill="#16a34a" opacity="0.75" />
      <path d="M80,137 Q74,133 69,136" stroke="#4ade80" strokeWidth="1.3" fill="none" />
      <circle cx="68" cy="136" r="2.5" fill="#16a34a" opacity="0.75" />
      <path d="M80,140 Q73,138 69,142" stroke="#4ade80" strokeWidth="1.3" fill="none" />
      <circle cx="68" cy="142" r="2.5" fill="#16a34a" opacity="0.75" />
      <path d="M118,134 Q123,130 128,133" stroke="#4ade80" strokeWidth="1.3" fill="none" />
      <circle cx="129" cy="133" r="2.5" fill="#16a34a" opacity="0.75" />
      <path d="M120,137 Q126,133 131,136" stroke="#4ade80" strokeWidth="1.3" fill="none" />
      <circle cx="132" cy="136" r="2.5" fill="#16a34a" opacity="0.75" />
      <path d="M120,140 Q127,138 131,142" stroke="#4ade80" strokeWidth="1.3" fill="none" />
      <circle cx="132" cy="142" r="2.5" fill="#16a34a" opacity="0.75" />

      {/* CBS label */}
      <text x="100" y="167" textAnchor="middle" fontSize="9" fill="#c9a227" fontFamily="Georgia,serif" fontWeight="bold">
        ✦ CBS ✦
      </text>
    </svg>
  );
}

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.auth.login(username.trim(), password);
      localStorage.setItem('cbs_token', data.token);
      localStorage.setItem('cbs_user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err: any) {
      if (err.message === 'API error 401') {
        setError('Incorrect username or password.');
      } else {
        setError('Cannot reach the server. Make sure the Laravel backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)' }}>

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(#c9a227 1px,transparent 1px),linear-gradient(90deg,#c9a227 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: 'linear-gradient(180deg,#1e3a5f 0%,#152744 100%)', border: '1px solid rgba(201,162,39,0.4)' }}>

          {/* Gold top accent bar */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#c9a227,#f0d060,#c9a227)' }} />

          <div className="px-8 py-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-7">
              <div className="w-48 h-48 mb-5 rounded-full flex items-center justify-center"
                style={{ background: 'white', padding: '6px', boxShadow: '0 0 0 3px #c9a227, 0 8px 32px rgba(0,0,0,0.5)' }}>
                <img
                  src="/logo.png"
                  alt="Coastal Border Security"
                  className="w-full h-full object-contain rounded-full"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'; }}
                />
                <div style={{ display: 'none' }} className="w-full h-full">
                  <CoastalBadgeSVG />
                </div>
              </div>

              <h1 className="text-xl font-bold tracking-widest text-center" style={{ color: '#c9a227', fontFamily: 'Georgia,serif', letterSpacing: '0.15em' }}>
                COASTAL BORDER SECURITY
              </h1>
              <p className="text-xs tracking-widest mt-1 text-center" style={{ color: '#8ba0c0', letterSpacing: '0.2em' }}>
                COMMAND ACCESS PORTAL
              </p>

              {/* Divider */}
              <div className="flex items-center gap-3 mt-4 w-full">
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,transparent,#c9a22760)' }} />
                <span style={{ color: '#c9a227', fontSize: '10px' }}>⚓</span>
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,#c9a22760,transparent)' }} />
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase" style={{ color: '#8ba0c0' }}>
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4" style={{ color: '#c9a227' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    autoComplete="username"
                    placeholder="Enter your username"
                    className="w-full pl-10 pr-4 py-3 rounded-lg text-sm outline-none transition-all"
                    style={{
                      background: '#0d1f3c',
                      border: '1px solid rgba(201,162,39,0.3)',
                      color: '#e2e8f0',
                      caretColor: '#c9a227',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,162,39,0.8)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.1)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(201,162,39,0.3)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 tracking-widest uppercase" style={{ color: '#8ba0c0' }}>
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4" style={{ color: '#c9a227' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-12 py-3 rounded-lg text-sm outline-none transition-all"
                    style={{
                      background: '#0d1f3c',
                      border: '1px solid rgba(201,162,39,0.3)',
                      color: '#e2e8f0',
                      caretColor: '#c9a227',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,162,39,0.8)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.1)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(201,162,39,0.3)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  {/* Eye toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute inset-y-0 right-3 flex items-center px-1 transition-colors"
                    style={{ color: showPw ? '#c9a227' : '#4a6080' }}
                    tabIndex={-1}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
                  style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5' }}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-bold text-sm tracking-widest uppercase transition-all mt-2 disabled:opacity-60"
                style={{
                  background: loading ? '#8a6e1a' : 'linear-gradient(135deg,#c9a227,#f0d060,#c9a227)',
                  color: '#0d1f3c',
                  letterSpacing: '0.15em',
                  boxShadow: loading ? 'none' : '0 4px 15px rgba(201,162,39,0.35)',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-amber-900 border-t-transparent rounded-full animate-spin" />
                    Authenticating…
                  </span>
                ) : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-3 text-center text-xs tracking-widest"
            style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(201,162,39,0.15)', color: '#4a6080', letterSpacing: '0.18em' }}>
            🔒 AUTHORIZED PERSONNEL ONLY
          </div>
        </div>

        {/* Bottom version text */}
        <p className="text-center mt-4 text-xs" style={{ color: '#2a3d5a' }}>
          Coastal Border Security v1.0 — Secure Access
        </p>
      </div>
    </div>
  );
}
