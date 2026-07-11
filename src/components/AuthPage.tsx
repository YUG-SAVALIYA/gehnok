import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShopifyCustomer } from '../hooks/useShopifyCustomer';
import { X, ArrowRight, Lock, User, Mail, ShieldCheck } from 'lucide-react';

interface AuthPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function AuthPage({ onBack, onSuccess }: AuthPageProps) {
  const { login, register, loading } = useShopifyCustomer();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    if (mode === 'login') {
      const res = await login(email, password);
      if (res.success) {
        onSuccess();
      } else {
        setErrorMsg(res.message);
      }
    } else {
      if (!firstName || !lastName || !email || !password) {
        setErrorMsg("All fields are required for private registration.");
        return;
      }
      const res = await register(firstName, lastName, email, password);
      if (res.success) {
        onSuccess();
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] flex items-center justify-center relative px-4 sm:px-6 py-20 font-sans selection:bg-[#381932]/10">
      
      {/* Abstract Luxury Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-gradient-to-br from-[#EAE8E3]/40 to-transparent rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-[#381932]/5 to-transparent rounded-full blur-3xl opacity-50" />
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white shadow-[0_20px_50px_rgba(56,25,50,0.05)] border border-[#381932]/10 relative z-10 overflow-hidden">
        
        {/* Left Side: Brand Imagery & Ethos */}
        <div className="hidden md:flex flex-col justify-between bg-[#381932] text-white p-12 relative overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1599643478524-fb66f7ca265b?auto=format&fit=crop&q=80" 
              alt="Luxury Texture" 
              className="w-full h-full object-cover opacity-20 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#381932] via-[#381932]/80 to-transparent" />
          </div>
          
          <div className="relative z-10">
            <h2 className="font-serif text-3xl font-bold mb-4">The GEHNOK Vault</h2>
            <p className="text-sm font-sans tracking-wide text-white/70 leading-relaxed max-w-sm">
              Enter our private chambers. Members enjoy exclusive access to limited acquisitions, bespoke concierge services, and our heirloom tracking registry.
            </p>
          </div>
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center space-x-3 text-white/80">
              <ShieldCheck size={18} className="text-[#C9A96E]" />
              <span className="text-xs uppercase tracking-widest font-bold">Encrypted & Secure</span>
            </div>
            <div className="flex items-center space-x-3 text-white/80">
              <Lock size={18} className="text-[#C9A96E]" />
              <span className="text-xs uppercase tracking-widest font-bold">Private Concierge</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Forms */}
        <div className="p-8 sm:p-12 relative bg-[#F9F7F2]">
          {/* Back Button */}
          <button 
            onClick={onBack}
            className="absolute top-6 right-6 p-2 text-[#381932]/50 hover:text-[#381932] transition-colors cursor-pointer"
            aria-label="Return to boutique"
          >
            <X size={20} />
          </button>

          <div className="max-w-sm mx-auto w-full pt-10 pb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="text-center mb-10">
                  <h1 className="text-2xl font-serif font-bold text-[#381932] mb-2">
                    {mode === 'login' ? 'Private Sign In' : 'Establish Registry'}
                  </h1>
                  <p className="text-xs font-sans text-[#381932]/60 uppercase tracking-widest">
                    {mode === 'login' ? 'Access your curated collection' : 'Join the inner circle'}
                  </p>
                </div>

                {errorMsg && (
                  <div className="mb-6 p-4 border border-red-500/20 bg-red-500/5 text-red-700 text-xs text-center font-bold tracking-wide">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {mode === 'signup' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-[#381932]/70">First Name</label>
                        <div className="relative">
                          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#381932]/40" />
                          <input 
                            type="text" 
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full bg-white border border-[#381932]/20 py-2.5 pl-9 pr-4 text-sm text-[#381932] focus:border-[#381932] focus:ring-1 focus:ring-[#381932] outline-none transition-all rounded-none"
                            placeholder="Arthur"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-[#381932]/70">Last Name</label>
                        <input 
                          type="text" 
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full bg-white border border-[#381932]/20 py-2.5 px-4 text-sm text-[#381932] focus:border-[#381932] focus:ring-1 focus:ring-[#381932] outline-none transition-all rounded-none"
                          placeholder="Pendragon"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-[#381932]/70">Email Address</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#381932]/40" />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-[#381932]/20 py-2.5 pl-9 pr-4 text-sm text-[#381932] focus:border-[#381932] focus:ring-1 focus:ring-[#381932] outline-none transition-all rounded-none"
                        placeholder="vip@gehnok.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-[#381932]/70">Security Key</label>
                      {mode === 'login' && (
                        <button type="button" className="text-[9px] uppercase tracking-widest font-bold text-[#C9A96E] hover:text-[#381932] transition-colors cursor-pointer">
                          Forgot Key?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#381932]/40" />
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white border border-[#381932]/20 py-2.5 pl-9 pr-4 text-sm text-[#381932] focus:border-[#381932] focus:ring-1 focus:ring-[#381932] outline-none transition-all rounded-none"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 py-3.5 bg-[#381932] text-white border border-[#381932] text-[11px] uppercase tracking-widest font-bold hover:bg-transparent hover:text-[#381932] transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group"
                  >
                    <span>{loading ? 'Authenticating...' : (mode === 'login' ? 'Enter Vault' : 'Establish Record')}</span>
                    {!loading && <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />}
                  </button>
                </form>

                <div className="mt-8 text-center border-t border-[#381932]/10 pt-6">
                  <p className="text-xs text-[#381932]/60 font-sans">
                    {mode === 'login' ? "Not yet registered?" : "Already possess a registry key?"}
                  </p>
                  <button 
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="mt-2 text-[10px] uppercase tracking-widest font-bold text-[#381932] hover:text-[#C9A96E] transition-colors cursor-pointer border-b border-[#381932]/30 hover:border-[#C9A96E] pb-0.5"
                  >
                    {mode === 'login' ? "Request Membership" : "Sign In to Vault"}
                  </button>
                </div>

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
