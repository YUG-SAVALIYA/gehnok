import React from 'react';
import { useShopifyCustomer } from '../hooks/useShopifyCustomer';
import { X, LogOut, Package, Key, Settings } from 'lucide-react';

interface AccountDashboardProps {
  onBack: () => void;
  onLogoutSuccess: () => void;
}

export default function AccountDashboard({ onBack, onLogoutSuccess }: AccountDashboardProps) {
  const { customer, logout, loading } = useShopifyCustomer();

  const handleLogout = async () => {
    await logout();
    onLogoutSuccess();
  };

  if (!customer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F9F7F2] font-sans text-[#381932] selection:bg-[#381932]/10 py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#381932]/20 pb-8 mb-12 relative">
          <div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-2">
              Welcome, {customer.firstName}
            </h1>
            <p className="text-xs font-sans text-[#381932]/60 uppercase tracking-widest">
              Private Dashboard & Registry
            </p>
          </div>
          <button 
            onClick={onBack}
            className="p-2 border border-[#381932]/20 hover:border-[#381932] text-[#381932]/70 hover:text-[#381932] rounded-none transition-colors cursor-pointer"
            aria-label="Return to boutique"
          >
            <X size={20} />
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Profile Card */}
          <div className="md:col-span-1 border border-[#381932]/20 bg-white p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#381932]" />
            <h2 className="text-xs font-sans uppercase tracking-widest font-bold mb-6 text-[#C9A96E]">
              Profile Registry
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#381932]/50 mb-1">Full Name</p>
                <p className="text-sm font-bold">{customer.firstName} {customer.lastName}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#381932]/50 mb-1">Comm Channel</p>
                <p className="text-sm font-bold truncate">{customer.email}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#381932]/50 mb-1">Status</p>
                <p className="text-[10px] uppercase tracking-widest font-bold text-green-700 bg-green-700/10 inline-block px-2 py-1">
                  Verified Member
                </p>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              disabled={loading}
              className="mt-8 w-full py-2.5 border border-[#381932] text-[#381932] text-[10px] uppercase tracking-widest font-bold hover:bg-[#381932] hover:text-white transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <LogOut size={14} />
              <span>{loading ? 'Securing...' : 'Secure Sign Out'}</span>
            </button>
          </div>

          {/* Activity Area */}
          <div className="md:col-span-2 space-y-6">
            
            <div className="border border-[#381932]/20 bg-white p-8">
              <h3 className="font-serif text-xl font-bold mb-6 text-[#381932]">Acquisition History</h3>
              
              {!customer.orders?.edges || customer.orders.edges.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-10">
                  <Package size={32} className="text-[#381932]/20 mb-4" />
                  <p className="text-xs text-[#381932]/60 max-w-xs mx-auto leading-relaxed">
                    Your heirloom registry and past acquisitions will appear here once secured.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {customer.orders.edges.map(({ node: order }) => (
                    <div key={order.id} className="border border-[#381932]/10 p-5 group hover:border-[#381932]/30 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-[#381932]/10 pb-4">
                        <div>
                          <p className="text-sm font-bold text-[#381932]">Order #{order.orderNumber}</p>
                          <p className="text-[10px] text-[#381932]/60 uppercase tracking-widest mt-1">
                            {new Date(order.processedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-1 ${
                            order.financialStatus === 'PAID' ? 'bg-green-700/10 text-green-700' : 'bg-yellow-600/10 text-yellow-700'
                          }`}>
                            {order.financialStatus}
                          </span>
                          <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-1 ${
                            order.fulfillmentStatus === 'FULFILLED' ? 'bg-green-700/10 text-green-700' : 'bg-[#381932]/10 text-[#381932]'
                          }`}>
                            {order.fulfillmentStatus || 'UNFULFILLED'}
                          </span>
                          <p className="text-xs font-mono font-bold text-[#381932] ml-2">
                            {new Intl.NumberFormat('en-IN', {
                              style: 'currency',
                              currency: order.totalPrice.currencyCode,
                              maximumFractionDigits: 0
                            }).format(parseFloat(order.totalPrice.amount))}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {order.lineItems.edges.map(({ node: item }, i) => (
                          <div key={i} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {item.variant?.image ? (
                                <img 
                                  src={item.variant.image.url} 
                                  alt={item.variant.image.altText || item.title}
                                  className="w-10 h-10 object-cover bg-[#F9F7F2]"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-[#F9F7F2] flex items-center justify-center">
                                  <Package size={14} className="text-[#381932]/30" />
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-serif font-bold text-[#381932] line-clamp-1">{item.title}</p>
                                <p className="text-[10px] text-[#381932]/60 font-sans tracking-wide">Qty: {item.quantity}</p>
                              </div>
                            </div>
                            {item.variant && (
                              <p className="text-[10px] font-mono text-[#381932]/80">
                                {new Intl.NumberFormat('en-IN', {
                                  style: 'currency',
                                  currency: item.variant.price.currencyCode,
                                  maximumFractionDigits: 0
                                }).format(parseFloat(item.variant.price.amount))}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="border border-[#381932]/20 bg-[#F9F7F2] p-6 hover:bg-white transition-colors cursor-pointer group">
                <Key size={20} className="text-[#C9A96E] mb-4" />
                <h4 className="text-xs font-sans uppercase tracking-widest font-bold mb-1">Security Settings</h4>
                <p className="text-[10px] text-[#381932]/60">Manage your private keys</p>
              </div>
              <div className="border border-[#381932]/20 bg-[#F9F7F2] p-6 hover:bg-white transition-colors cursor-pointer group">
                <Settings size={20} className="text-[#C9A96E] mb-4" />
                <h4 className="text-xs font-sans uppercase tracking-widest font-bold mb-1">Preferences</h4>
                <p className="text-[10px] text-[#381932]/60">Tailor your boutique experience</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
