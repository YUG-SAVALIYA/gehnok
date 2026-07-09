import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Product } from '../types';
import { useShopifyProducts } from '../hooks/useShopifyProducts';
import { Compass, Send, X, Eye } from 'lucide-react';

interface ConciergeProps {
  isOpen: boolean;
  onClose: () => void;
  onExamineProduct: (product: Product) => void;
}

export default function Concierge({ isOpen, onClose, onExamineProduct }: ConciergeProps) {
  const { products: LUXURY_PRODUCTS } = useShopifyProducts();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'concierge',
      text: "Welcome to the GEHNOK private chambers. I am your Digital Concierge. Tell me of the milestone you seek to commemorate, your metal preference, or the specific glow you wish to evoke, and I shall guide your search.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userMsgText = inputMessage.trim();
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'client',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/concierge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMsgText
        })
      });

      const data = await response.json();

      const conciergeMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'concierge',
        text: data.response || "Forgive me, the quiet of the chambers was interrupted. Let us resume our dialogue shortly.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendedProducts: data.recommendedProductIds || []
      };

      setMessages(prev => [...prev, conciergeMsg]);
    } catch (error) {
      console.error('Error during concierge fetching:', error);
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'concierge',
        text: "My deepest apologies. A momentary silence has fallen over our servers. Let us continue our consultation in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const getRecommendedProductsData = (ids: string[]): Product[] => {
    return LUXURY_PRODUCTS.filter(product => ids.includes(product.id));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-500">
      
      {/* Background close click */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg h-full bg-[#F9F7F2] text-[#381932] flex flex-col border-l border-[#381932] shadow-2xl transition-transform duration-500 transform translate-x-0 font-sans">
        
        {/* Panel Header */}
        <div className="p-6 border-b border-[#381932] flex items-center justify-between bg-[#EAE8E3]/40">
          <div className="flex items-center space-x-3">
            <Compass className="text-[#381932] animate-pulse-slow" size={20} />
            <div>
              <h2 className="text-sm font-sans uppercase tracking-widest text-[#381932] font-bold">
                Private Concierge
              </h2>
              <span className="text-[7px] tracking-widest font-mono uppercase text-[#8A7F7A]">
                Chamber is Secure & Sealed
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8A7F7A] hover:text-[#381932] transition-colors cursor-pointer"
            title="Close consultation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300">
          {messages.map((msg) => {
            const isClient = msg.sender === 'client';
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${isClient ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                {/* Meta details */}
                <span className="text-[7px] font-mono tracking-[0.15em] text-[#8A7F7A] uppercase mb-1">
                  {isClient ? 'Client User' : 'Private Concierge'} • {msg.timestamp}
                </span>

                {/* Message Body */}
                <div
                  className={`p-4 rounded-none text-xs leading-relaxed ${
                    isClient
                      ? 'bg-[#381932] text-white border border-[#381932]'
                      : 'bg-[#EAE8E3]/30 border border-[#381932] text-[#381932]'
                  }`}
                >
                  <p className="whitespace-pre-line font-serif italic text-sm">{msg.text}</p>
                </div>

                {/* Recommended Products Attachment */}
                {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                  <div className="mt-4 w-full grid grid-cols-1 gap-3">
                    <span className="text-[8px] tracking-widest font-sans uppercase font-bold text-[#381932] block pl-1">
                      Suggested Creations for Examination:
                    </span>
                    {getRecommendedProductsData(msg.recommendedProducts).map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          onExamineProduct(prod);
                          onClose();
                        }}
                        className="bg-white border border-[#381932] p-3 rounded-none flex items-center justify-between cursor-pointer hover:bg-[#EAE8E3]/40 transition-colors group"
                      >
                        <div className="space-y-1 pr-4">
                          <h4 className="text-xs font-serif font-bold text-[#381932]">
                            {prod.name}
                          </h4>
                          <p className="text-[9px] text-[#381932]/70 font-mono">
                            {prod.purity} {prod.metal} • {new Intl.NumberFormat('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                              maximumFractionDigits: 0
                            }).format(prod.price)}
                          </p>
                        </div>
                        <button className="p-1.5 rounded-none bg-[#381932] text-white group-hover:bg-[#381932] group-hover:opacity-85 transition-colors shrink-0 cursor-pointer">
                          <Eye size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex flex-col items-start mr-auto max-w-[85%]">
              <span className="text-[7px] font-mono tracking-[0.15em] text-[#8A7F7A] uppercase mb-1">
                Private Concierge • reflecting...
              </span>
              <div className="bg-[#EAE8E3]/30 border border-[#381932] p-3 rounded-none flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-[#381932] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-[#381932] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-[#381932] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSend} className="p-4 bg-[#EAE8E3]/40 border-t border-[#381932]">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Inquire of an anniversary, bespoke metal, or gemstone..."
              className="w-full bg-white text-xs text-[#381932] placeholder-[#8A7F7A] border border-[#381932] focus:outline-none py-3.5 pl-4 pr-12 rounded-none"
              disabled={isTyping}
            />
            <button
              type="submit"
              className="absolute right-2 p-2 text-[#381932] hover:opacity-75 disabled:opacity-30 transition-colors cursor-pointer"
              disabled={!inputMessage.trim() || isTyping}
              title="Transmit consultation inquiry"
            >
              <Send size={14} />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
