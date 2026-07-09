import React, { useState, useEffect } from 'react';
import { Mail, MapPin, Phone, ShieldCheck, Clock, Sparkles, Send } from 'lucide-react';
import { Product } from '../types';

interface ContactUsProps {
  prefilledSubject?: string;
  prefilledProduct?: Product | null;
  products: Product[];
  onBackToProducts: () => void;
}

export default function ContactUs({
  prefilledSubject = '',
  prefilledProduct = null,
  products,
  onBackToProducts
}: ContactUsProps) {
  // Form state
  const [name, setName] = useState('Savaliya Yug');
  const [email, setEmail] = useState('savaliyayug85@gmail.com');
  const [subject, setSubject] = useState('Private Chamber Viewing');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [message, setMessage] = useState('');
  
  // Status state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Handle prefilled props
  useEffect(() => {
    if (prefilledSubject) {
      setSubject(prefilledSubject);
    }
    if (prefilledProduct) {
      setSelectedProductId(prefilledProduct.id);
      setMessage(`I wish to inquire about a private chamber viewing and secure material briefing for the exquisite "${prefilledProduct.name}" (${prefilledProduct.purity} ${prefilledProduct.metal}, valued at ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(prefilledProduct.price)}).`);
    }
  }, [prefilledSubject, prefilledProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setSubmitError('Please complete all required fields of our digital ledger.');
      return;
    }
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject,
          productId: selectedProductId,
          message
        })
      });

      if (!response.ok) {
        throw new Error('Digital transmission failure');
      }

      const data = await response.json();
      setSubmitSuccess(true);
      setMessage('');
      setSelectedProductId('');
    } catch (err) {
      setSubmitError('Our secure transmission channel is temporarily locked. Please consult the floating concierge.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 bg-[#F9F7F2] min-h-[80vh] font-sans text-[#381932]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        
        {/* Header section */}
        <div className="border-b border-[#381932] pb-8 mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="text-[9px] tracking-widest font-sans font-bold uppercase text-[#381932]/60 block mb-1">
              Atelier Correspondence Salon
            </span>
            <h1 className="text-3xl font-serif-luxury text-[#381932] font-bold">
              Contact & Inquiries
            </h1>
          </div>
          <div className="flex items-center space-x-3 bg-[#381932] text-[#F9F7F2] border border-[#381932] px-4 py-2.5 rounded-none">
            <ShieldCheck size={14} className="text-[#F9F7F2]" />
            <span className="text-[10px] tracking-widest font-sans uppercase font-bold">
              GIA Secured Channel
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Inquiry Form */}
          <div className="lg:col-span-7 bg-[#FAF7F2] border border-[#381932] p-8 rounded-none space-y-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#381932]">
                Transmit an Inquiry
              </h2>
              <p className="text-xs text-[#381932]/70 mt-1 leading-relaxed font-serif">
                Fill in the secure ledger below. Your request will be directly dispatched to a senior Gehknok gemologist for silent and absolute private consideration.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] tracking-widest font-sans font-bold text-[#381932]/60 uppercase mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white text-xs text-[#381932] border border-[#381932] focus:outline-none py-2.5 px-3 rounded-none font-bold"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[8px] tracking-widest font-sans font-bold text-[#381932]/60 uppercase mb-1">
                    Secure Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white text-xs text-[#381932] border border-[#381932] focus:outline-none py-2.5 px-3 rounded-none font-mono font-bold"
                    placeholder="client@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] tracking-widest font-sans font-bold text-[#381932]/60 uppercase mb-1">
                    Inquiry Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-white text-xs text-[#381932] border border-[#381932] focus:outline-none py-2.5 px-3 rounded-none font-bold"
                  >
                    <option value="Private Chamber Viewing">Digital Private Viewing</option>
                    <option value="Bespoke Design">Bespoke Design Consultation</option>
                    <option value="Heirloom Restoration">Heirloom Restoration</option>
                    <option value="Material Certification">GIA & Metallurgy Inquiry</option>
                    <option value="General Salon Request">General Salon Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[8px] tracking-widest font-sans font-bold text-[#381932]/60 uppercase mb-1">
                    Associated Specimen (Optional)
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-white text-xs text-[#381932] border border-[#381932] focus:outline-none py-2.5 px-3 rounded-none font-bold"
                  >
                    <option value="">No Specific Specimen</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.purity} {p.metal})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[8px] tracking-widest font-sans font-bold text-[#381932]/60 uppercase mb-1">
                  Message Details
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Describe your bespoke sizing parameters, custom gold alloys preference, or desired timeline..."
                  className="w-full bg-white text-xs text-[#381932] border border-[#381932] focus:outline-none py-3 px-4 rounded-none font-sans font-light leading-relaxed placeholder-[#8A7F7A]"
                  required
                />
              </div>

              {submitError && (
                <p className="text-xs text-red-600 font-mono italic">{submitError}</p>
              )}

              {submitSuccess ? (
                <div className="bg-[#EAE8E3] border border-[#381932] p-4 rounded-none text-xs text-[#381932] space-y-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles size={14} className="text-[#381932] animate-pulse" />
                    <span className="font-bold uppercase tracking-wider text-[10px]">
                      Correspondence Recorded Successfully
                    </span>
                  </div>
                  <p className="text-[11px] text-[#381932]/80 font-serif italic">
                    Your inquiry has been safely written to our private registry. A senior concierge will initiate secure communication within 12 hours.
                  </p>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#381932] text-white text-xs uppercase tracking-widest font-sans font-bold hover:bg-transparent hover:text-[#381932] border border-[#381932] transition-all duration-300 rounded-none flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={12} />
                      <span>Transmit Digital Inquiry</span>
                    </>
                  )}
                </button>
              )}
            </form>
          </div>

          {/* Right Column: Physical & Brand Coordinates */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Atelier details list */}
            <div className="border border-[#381932] p-6 bg-white space-y-6">
              <h3 className="text-xs uppercase tracking-widest font-sans text-[#381932] font-bold border-b border-[#381932] pb-3">
                Maison Address Book
              </h3>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <MapPin className="text-[#381932] shrink-0 mt-0.5" size={16} />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">The Paris Forge</h4>
                    <p className="text-xs text-[#381932]/70 font-light mt-1">
                      Rue de la Paix, 75002 Paris, France<br />
                      <span className="text-[10px] font-mono">By Private Invitation Only</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <MapPin className="text-[#381932] shrink-0 mt-0.5" size={16} />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">The Geneva Vault</h4>
                    <p className="text-xs text-[#381932]/70 font-light mt-1">
                      Rue du Rhône, 1204 Genève, Switzerland<br />
                      <span className="text-[10px] font-mono">Private Vault Access and Safe-Keep</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Phone className="text-[#381932] shrink-0 mt-0.5" size={16} />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">Private Line</h4>
                    <p className="text-xs text-[#381932]/70 font-mono mt-1">
                      +33 1 42 68 53 00 (Paris)<br />
                      +41 22 310 20 40 (Geneva)
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Mail className="text-[#381932] shrink-0 mt-0.5" size={16} />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">Secure Correspondence</h4>
                    <p className="text-xs text-[#381932]/70 font-mono mt-1">
                      atelier@gehnok.com<br />
                      concierge@gehnok.com
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Service commitments */}
            <div className="border border-[#381932] p-6 bg-[#EAE8E3]/40 space-y-4">
              <h3 className="text-xs uppercase tracking-widest font-sans text-[#381932] font-bold">
                Atelier Pledges
              </h3>
              
              <ul className="space-y-3 text-xs font-light text-[#381932]/80 leading-relaxed">
                <li className="flex items-start gap-2">
                  <Clock size={12} className="text-[#381932] shrink-0 mt-0.5" />
                  <span><strong>12-Hour Correspondence Limit:</strong> Every transmission is reviewed by a master gemologist and replied to with direct personalization.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck size={12} className="text-[#381932] shrink-0 mt-0.5" />
                  <span><strong>GIA Registry Verification:</strong> For bespoke orders, diamonds and major precious stones are fully verified and registered inside the official GIA blockchain registry prior to alloy framing.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
