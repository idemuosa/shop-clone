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
      q: "How do I become a seller on Vivo?",
      a: "We're always looking for great brands! Click the 'Sell on Vivo' link in the footer or visit the 'Brands' page to submit your application. Our team will review your profile and get back to you within 48 hours."
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
    if (normalizedTitle === 'flash sales' || normalizedTitle === 'clearance') {
      return products.filter(p => p.tag === 'Flash Sale' || p.tag === 'Clearance' || (p.oldPrice && parseFloat(p.price) < parseFloat(p.oldPrice) * 0.7));
    }
    return [];
  }, [products, normalizedTitle]);

  const renderContent = () => {
    switch (normalizedTitle) {
      case 'flash sales':
        return (
          <div className="space-y-8">
            <div className="bg-purple-600 rounded-[40px] p-12 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="bg-white/20 w-fit p-3 rounded-2xl mb-6 backdrop-blur-md">
                   <Zap className="h-10 w-10 text-yellow-400 fill-yellow-400" />
                </div>
                <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-4">The Vivo <span className="text-yellow-400">Flash Sale</span></h2>
                <p className="text-purple-100 text-lg max-w-xl">Every day, we drop prices by up to 90% on top-tier electronics, fashion, and home decor. These deals are live for only 24 hours.</p>
              </div>
              <Zap className="absolute right-[-20px] bottom-[-20px] h-64 w-64 text-white/10 rotate-12" />
            </div>

            <ProductSection
              title="Live"
              subtitle="Flash Deals"
              products={filteredDisplayProducts}
              onAddToWishlist={onAddToWishlist}
              onProductView={onProductView}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <Clock />, title: "Limited Time", desc: "Deals expire every midnight. Act fast or miss out." },
                { icon: <Zap />, title: "Huge Discounts", desc: "Prices slashed up to 90% off retail value." },
                { icon: <Star />, title: "Top Quality", desc: "Only highly-rated products make it to flash sales." }
              ].map((item, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="bg-purple-50 w-12 h-12 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                    {item.icon}
                  </div>
                  <h4 className="font-black uppercase tracking-tight mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-500 font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'help':
        return (
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter">How can we <span className="text-purple-600">help?</span></h2>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Support is available 24/7 for the Vivo community</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className={`bg-white rounded-3xl border transition-all overflow-hidden ${expandedFaq === i ? 'border-purple-500 shadow-lg shadow-purple-50' : 'border-gray-100 hover:border-purple-200'}`}
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full p-6 flex items-center justify-between text-left group"
                  >
                    <span className={`font-black tracking-tight ${expandedFaq === i ? 'text-purple-600' : 'text-gray-700'}`}>{faq.q}</span>
                    <div className={`p-2 rounded-xl transition-colors ${expandedFaq === i ? 'bg-purple-600 text-white' : 'bg-gray-50 text-gray-400 group-hover:text-purple-600'}`}>
                      {expandedFaq === i ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-6 text-gray-500 font-medium text-sm leading-relaxed border-t border-gray-50 pt-4 mt-2 mx-6 italic">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <div className="bg-black rounded-[40px] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                <Headset className="h-32 w-32" />
              </div>
              <div className="flex items-center gap-6 relative z-10">
                <div className="bg-zinc-800 p-5 rounded-3xl shadow-2xl">
                  <Bot className="h-10 w-10 text-purple-500" />
                </div>
                <div>
                  <h4 className="text-xl font-black uppercase tracking-tight italic">Need direct assistance?</h4>
                  <p className="text-zinc-400 text-sm font-medium">Chat with our expert AI support team now.</p>
                </div>
              </div>
              <Button
                onClick={handleStartChat}
                className="relative z-10 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl px-10 h-16 shadow-xl shadow-purple-900/40 transition-all active:scale-95 text-lg"
              >
                START LIVE CHAT
              </Button>
            </div>
          </div>
        );
      case 'new arrivals':
      case 'best sellers':
        return (
          <div className="space-y-12">
            <div className="bg-zinc-900 rounded-[40px] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
              <div className="relative z-10 max-w-lg">
                <Badge variant="outline" className="border-purple-500 text-purple-500 mb-6 font-black uppercase tracking-widest px-4 py-1">{title}</Badge>
                <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-4">Shop the Latest <span className="text-purple-600">Trends</span></h2>
                <p className="text-zinc-400 text-lg">Curated selection of {normalizedTitle === 'new arrivals' ? 'the newest products to hit our store' : 'our most popular and high-rated items'} this week.</p>
              </div>
              <div className="relative z-10 w-full md:w-1/3 aspect-square bg-purple-600 rounded-3xl overflow-hidden shadow-2xl rotate-3">
                 <img
                    src={normalizedTitle === 'new arrivals' ? "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop" : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop"}
                    className="w-full h-full object-cover"
                    alt={title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=500&auto=format&fit=crop';
                    }}
                 />
              </div>
              <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-purple-600/10 rounded-full blur-3xl"></div>
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
              <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
                <Package className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Live inventory for {title} is syncing...</p>
                <Button onClick={onBack} variant="link" className="text-purple-600 font-black uppercase text-[10px] tracking-[0.2em] mt-4">Browse All Products</Button>
              </div>
            )}
          </div>
        );
      case 'clearance':
        return (
          <div className="space-y-12">
            <div className="bg-red-600 rounded-[40px] p-12 text-white text-center relative overflow-hidden">
               <div className="relative z-10">
                  <h2 className="text-6xl font-black uppercase italic tracking-tighter mb-4">Clearance <span className="text-red-200">Sale</span></h2>
                  <p className="text-red-100 text-xl max-w-2xl mx-auto">Last chance to grab these items. Everything must go with prices up to 80% off!</p>
                  <div className="mt-8 flex justify-center gap-4">
                     <Badge className="bg-white text-red-600 px-6 py-2 rounded-full font-black text-xl shadow-lg animate-bounce">80% OFF</Badge>
                  </div>
               </div>
               <ShieldAlert className="absolute right-[-20px] top-[-20px] h-64 w-64 text-white/5 -rotate-12" />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm flex items-center gap-6">
                  <div className="bg-red-50 p-6 rounded-3xl">
                     <Clock className="h-10 w-10 text-red-600" />
                  </div>
                  <div>
                     <h4 className="text-xl font-black uppercase tracking-tight">Ending Soon</h4>
                     <p className="text-gray-500 font-medium">Clearance items are removed daily as stock runs out.</p>
                  </div>
               </div>
               <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm flex items-center gap-6">
                  <div className="bg-red-50 p-6 rounded-3xl">
                     <Package className="h-10 w-10 text-red-600" />
                  </div>
                  <div>
                     <h4 className="text-xl font-black uppercase tracking-tight">No Restocks</h4>
                     <p className="text-gray-500 font-medium">Once these items are gone, they are gone forever.</p>
                  </div>
               </div>
            </div>
          </div>
        );
      case 'brands':
        return (
          <div className="space-y-12">
             <div className="text-center space-y-4">
                <h2 className="text-5xl font-black uppercase italic tracking-tighter">Our Global <span className="text-purple-600">Partners</span></h2>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Authorized retailers and manufacturers</p>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                {[
                  { name: "Apple", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" },
                  { name: "Samsung", logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg" },
                  { name: "Nike", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg" },
                  { name: "LG", logo: "https://upload.wikimedia.org/wikipedia/commons/b/bf/LG_logo_%282015%29.svg" },
                  { name: "Sony", logo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg" },
                  { name: "Adidas", logo: "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg" },
                ].map((brand, i) => (
                   <div key={i} className="aspect-video bg-white rounded-3xl border-2 border-gray-50 flex items-center justify-center p-8 grayscale hover:grayscale-0 transition-all hover:border-purple-100 hover:shadow-xl hover:shadow-purple-100/20 group">
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="w-full h-auto object-contain max-h-12 group-hover:scale-110 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                   </div>
                ))}
             </div>

             <div className="bg-purple-50 p-12 rounded-[40px] text-center border-2 border-purple-100">
                <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Sell your brand on <span className="text-purple-600 italic">Vivo</span></h3>
                <p className="text-gray-500 font-medium mb-8 max-w-xl mx-auto">Join thousands of successful brands reaching millions of customers worldwide through our high-velocity sales platform.</p>
                <Button className="bg-purple-600 text-white font-black rounded-2xl px-12 h-16 shadow-xl shadow-purple-200 text-lg uppercase tracking-tighter">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
