import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Zap, ShieldCheck, Truck, Headset, Clock, Star, ArrowRight, Package, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ProductSection from './ProductSection';
import { motion, AnimatePresence } from 'motion/react';

interface InfoPageProps {
  title: string;
  onBack: () => void;
  products?: any[];
  onAddToWishlist?: () => void;
  onProductView?: (product: any) => void;
}

export default function InfoPage({ title, onBack, products = [], onAddToWishlist, onProductView }: InfoPageProps) {
  const normalizedTitle = title.toLowerCase();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "How do I track my order?",
      a: "You can track your order by clicking on the 'Track My Order' button in your order confirmation email, or by visiting the 'Orders' section in your account dashboard. We provide real-time updates as your package moves through our network."
    },
    {
      q: "What is your return policy?",
      a: "We offer a 30-day money-back guarantee. If you're not completely satisfied with your purchase, you can return it within 30 days of delivery for a full refund. Items must be in their original packaging and condition."
    },
    {
      q: "How do I apply a coupon code?",
      a: "During checkout, you'll find a field labeled 'Coupon Code' or 'Promo Code'. Enter your code there and click 'Apply' to see the discount reflected in your total amount."
    },
    {
      q: "Is my payment secure?",
      a: "Yes, absolutely! We use industry-standard SSL encryption and partner with trusted payment processors to ensure your data is always protected. We never store your full credit card information on our servers."
    },
    {
      q: "How do I become a seller on Vivi?",
      a: "We're always looking for great brands! Click the 'Sell on Vivi' link in the footer or visit the 'Brands' page to submit your application. Our team will review your profile and get back to you within 48 hours."
    }
  ];

  const handleStartChat = () => {
    // Look for the AI Assistant button and click it
    const aiButton = document.querySelector('button .lucide-bot')?.parentElement;
    if (aiButton) {
      (aiButton as HTMLButtonElement).click();
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };

  const filteredDisplayProducts = useMemo(() => {
    if (normalizedTitle === 'new arrivals') {
      // Sort by createdAt descending
      return [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 12);
    }
    if (normalizedTitle === 'best sellers') {
      // Sort by sold descending
      return [...products].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 12);
    }
    if (normalizedTitle === 'super sales' || normalizedTitle === 'clearance') {
      return products.filter(p => p.tag === 'Super Sale' || p.tag === 'Clearance' || (p.oldPrice && parseFloat(p.price) < parseFloat(p.oldPrice) * 0.7));
    }
    return [];
  }, [products, normalizedTitle]);

  const renderContent = () => {
    switch (normalizedTitle) {
      case 'super sales':
      case 'flash sales':
        return (
          <div className="space-y-4">
            <div className="bg-purple-600 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="bg-white/20 w-fit p-1.5 rounded-xl mb-3 backdrop-blur-md">
                   <Zap className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter mb-2">The Vivi <span className="text-yellow-400">Super Sale</span></h2>
                <p className="text-purple-100 text-xs md:text-sm max-w-xl">Every day, we drop prices by up to 90% on top-tier items, fashion, and home decor.</p>
              </div>
              <Zap className="absolute right-[-10px] bottom-[-10px] h-32 w-32 text-white/10 rotate-12" />
            </div>

            <ProductSection
              title="Super"
              subtitle="Deals"
              products={filteredDisplayProducts}
              onAddToWishlist={onAddToWishlist}
              onProductView={onProductView}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { icon: <Clock className="h-5 w-5" />, title: "Limited Time", desc: "Deals updated daily. Act fast or miss out." },
                { icon: <Zap className="h-5 w-5" />, title: "Huge Discounts", desc: "Prices slashed up to 90% off retail value." },
                { icon: <Star className="h-5 w-5" />, title: "Top Quality", desc: "Only highly-rated products make it to super sales." }
              ].map((item, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="bg-purple-50 w-9 h-9 rounded-xl flex items-center justify-center text-purple-600 mb-3">
                    {item.icon}
                  </div>
                  <h4 className="font-black uppercase tracking-tight text-xs mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'help':
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter">How can we <span className="text-purple-600">help?</span></h2>
              <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">Support is available 24/7 for the Vivi community</p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className={`bg-white rounded-2xl border transition-all overflow-hidden ${expandedFaq === i ? 'border-purple-500 shadow-sm' : 'border-gray-100 hover:border-purple-200'}`}
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full p-4 flex items-center justify-between text-left group"
                  >
                    <span className={`font-black text-xs md:text-sm tracking-tight ${expandedFaq === i ? 'text-purple-600' : 'text-gray-700'}`}>{faq.q}</span>
                    <div className={`p-1.5 rounded-lg transition-colors ${expandedFaq === i ? 'bg-purple-600 text-white' : 'bg-gray-50 text-gray-400 group-hover:text-purple-600'}`}>
                      {expandedFaq === i ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <div className="px-4 pb-4 text-gray-500 font-medium text-xs leading-relaxed border-t border-gray-50 pt-3 mt-1 italic">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <div className="bg-black rounded-3xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                <Headset className="h-20 w-20" />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="bg-zinc-800 p-3 rounded-2xl shadow-xl">
                  <Bot className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight italic">Need direct assistance?</h4>
                  <p className="text-zinc-400 text-xs font-medium">Chat with our expert AI support team now.</p>
                </div>
              </div>
              <Button
                onClick={handleStartChat}
                className="relative z-10 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl px-6 h-11 shadow-lg shadow-purple-900/40 transition-all active:scale-95 text-xs"
              >
                START LIVE CHAT
              </Button>
            </div>
          </div>
        );
      case 'new arrivals':
      case 'best sellers':
        return (
          <div className="space-y-6">
            <div className="bg-zinc-900 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
              <div className="relative z-10 max-w-md">
                <Badge variant="outline" className="border-purple-500 text-purple-500 mb-3 font-black uppercase tracking-widest px-3 py-0.5 text-[9px]">{title}</Badge>
                <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter mb-2">Shop the Latest <span className="text-purple-600">Trends</span></h2>
                <p className="text-zinc-400 text-xs md:text-sm">Curated selection of {normalizedTitle === 'new arrivals' ? 'the newest products to hit our store' : 'our most popular and high-rated items'} this week.</p>
              </div>
              <div className="relative z-10 w-full md:w-1/4 aspect-square bg-purple-600 rounded-2xl overflow-hidden shadow-xl rotate-2">
                 <img
                    src={normalizedTitle === 'new arrivals' ? "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop" : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop"}
                    className="w-full h-full object-cover"
                    alt={title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=500&auto=format&fit=crop';
                    }}
                 />
              </div>
            </div>

            {filteredDisplayProducts.length > 0 ? (
               <ProductSection
                title={title.split(' ')[0]}
                subtitle={title.split(' ')[1] || ""}
                products={filteredDisplayProducts}
                onAddToWishlist={onAddToWishlist}
                onProductView={onProductView}
              />
            ) : (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-100">
                <Package className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Live inventory for {title} is syncing...</p>
                <Button onClick={onBack} variant="link" className="text-purple-600 font-black uppercase text-[9px] tracking-[0.2em] mt-2">Browse All Products</Button>
              </div>
            )}
          </div>
        );
      case 'clearance':
        return (
          <div className="space-y-6">
            <div className="bg-red-600 rounded-3xl p-6 md:p-8 text-white text-center relative overflow-hidden">
               <div className="relative z-10">
                  <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter mb-2">Clearance <span className="text-red-200">Sale</span></h2>
                  <p className="text-red-100 text-xs md:text-sm max-w-xl mx-auto">Last chance to grab these items. Everything must go with prices up to 80% off!</p>
                  <div className="mt-4 flex justify-center gap-2">
                     <Badge className="bg-white text-red-600 px-4 py-1 rounded-full font-black text-xs shadow-md">80% OFF</Badge>
                  </div>
               </div>
               <ShieldAlert className="absolute right-[-10px] top-[-10px] h-32 w-32 text-white/5 -rotate-12" />
            </div>

            {filteredDisplayProducts.length > 0 && (
              <ProductSection
                title="Clearance"
                subtitle="Items"
                products={filteredDisplayProducts}
                onAddToWishlist={onAddToWishlist}
                onProductView={onProductView}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="bg-red-50 p-3 rounded-xl">
                     <Clock className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                     <h4 className="text-sm font-black uppercase tracking-tight">Ending Soon</h4>
                     <p className="text-xs text-gray-500 font-medium">Clearance items are removed daily as stock runs out.</p>
                  </div>
               </div>
               <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="bg-red-50 p-3 rounded-xl">
                     <Package className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                     <h4 className="text-sm font-black uppercase tracking-tight">No Restocks</h4>
                     <p className="text-xs text-gray-500 font-medium">Once these items are gone, they are gone forever.</p>
                  </div>
               </div>
            </div>
          </div>
        );
      case 'brands':
        return (
          <div className="space-y-6">
             <div className="text-center space-y-2">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Verified <span className="text-purple-600">Sellers</span></h2>
                <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">Independent merchants and creators</p>
             </div>

             <div className="bg-purple-50 p-8 rounded-3xl text-center border border-purple-100">
                <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Sell on <span className="text-purple-600 italic">Vivi</span></h3>
                <p className="text-gray-500 font-medium text-xs mb-4 max-w-md mx-auto">Join thousands of successful merchants reaching customers worldwide through our high-velocity sales platform.</p>
                <Button className="bg-purple-600 text-white font-black rounded-xl px-8 h-11 shadow-md text-xs uppercase tracking-tighter">
                  Apply to Sell
                </Button>
             </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-20">
            <h2 className="text-3xl font-black uppercase italic mb-4">{title}</h2>
            <p className="text-gray-400 font-medium">This page is under construction.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-8 hover:bg-white rounded-full font-black uppercase tracking-widest text-[10px] text-gray-400 hover:text-purple-600 flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Shop
        </Button>
        {renderContent()}
      </div>
    </div>
  );
}

function BadgeCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
