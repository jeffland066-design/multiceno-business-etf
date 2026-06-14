import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Briefcase, KeyRound, Mail, ArrowRight } from 'lucide-react';
import { googleSignIn, initAuth } from '../lib/auth';
import { sendEmail } from '../lib/gmail';

interface LoginProps {
  onLogin: () => void;
}

const BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1590283603385-17ffb2a7af1f?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032&auto=format&fit=crop'
];

export default function Login({ onLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'credentials' | 'otp_email'>('credentials');
  const [email, setEmail] = useState('ceo@multiceno.inc');
  const [password, setPassword] = useState('password123');
  
  const [emailOtp, setEmailOtp] = useState('');
  const [generatedEmailOtp, setGeneratedEmailOtp] = useState('');
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    initAuth(
      (user, token) => {
        onLogin();
      },
      () => {
        // Needs Auth
      }
    );
  }, [onLogin]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedEmailOtp(code);
        
        const emailBody = `
          <h2>MULTICENO Security</h2>
          <p>Your secure Email verification code is:</p>
          <h1 style="letter-spacing: 0.5em; color: #4f46e5;">${code}</h1>
          <p>This is your first security layer. Do not share this code.</p>
        `;
        
        await sendEmail(email, 'MULTICENO Login - Email Verification', emailBody);
        
        alert(`Verification email dispatched securely to ${email}.`);
        setStep('otp_email');
      }
    } catch (err) {
      console.error('Auth or email failed:', err);
      alert("Google Verification failed or was cancelled.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailOtp !== generatedEmailOtp) {
        alert("Invalid email verification code. Access Denied.");
        return;
    }
    
    // Email verified
    onLogin();
  };

  return (
    <div className="min-h-screen relative text-slate-200 flex items-center justify-center p-4 overflow-hidden">
      {/* Background image & overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-[2000ms] ease-in-out" 
        style={{ backgroundImage: `url("${BACKGROUND_IMAGES[bgIndex]}")` }}
      />
      <div className="absolute inset-0 z-0 bg-[#0f172a]/80 backdrop-blur-[2px]" />

      {/* Quote Overlay */}
      <div className="absolute inset-x-0 bottom-4 z-10 p-8 flex flex-col items-center justify-center pointer-events-none opacity-80 mt-auto">
        <p className="max-w-3xl text-center text-slate-300 italic text-sm md:text-base leading-relaxed drop-shadow-lg">
          "Success in business can be made achievable when hardwork, proper planning, trust and honesty are been put in place God leading the way become successful in due time."
        </p>
        <p className="mt-4 text-xs font-semibold text-indigo-400 tracking-widest uppercase pb-4 drop-shadow-md">
          &mdash; Kelvin Nii Martey Markwei
        </p>
      </div>

      {/* Background decoration */}
      <div className="absolute z-0 top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute z-0 bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[150px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-6 border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.2)]">
            <Briefcase size={32} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">MULTICENO</h1>
          <p className="text-slate-400 mt-2 text-sm">Group of Companies Command Center</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="w-full space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Corporate Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white placeholder-slate-600 text-sm"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Security Key</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <KeyRound size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white placeholder-slate-600 text-sm"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center mt-4"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Authenticate Credentials'}
              </button>
            </form>
          )}

          {step === 'otp_email' && (
            <form onSubmit={handleEmailOtpSubmit} className="w-full space-y-6 text-center">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 mb-2 border border-indigo-500/20">
                  <Mail size={20} />
                </div>
                <h3 className="text-white font-medium">Layer 1: Email Verification</h3>
                <p className="text-slate-400 text-xs mt-1">Enter the unique code sent to your email.</p>
              </div>
              <input
                type="text"
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="w-full text-center tracking-[0.5em] text-2xl py-3 bg-slate-950/50 border border-slate-800 rounded-xl outline-none focus:border-indigo-500 transition-all text-white font-mono"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all mt-4"
              >
                <span>Verify Code & Connect Workspace</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}
        </div>
        
        <p className="text-center text-xs text-slate-600 mt-8 mb-16 md:mb-0">
          Secure terminal for authorized personnel only.<br/>
          &copy; {new Date().getFullYear()} MULTICENO Group
        </p>
      </motion.div>
    </div>
  );
}
