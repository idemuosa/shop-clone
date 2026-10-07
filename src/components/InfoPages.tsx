import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Zap, ShieldCheck, Truck, Headset, Clock, Star, ArrowRight, Package, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
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
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
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
          <div className="space-y-3">
            <div className="bg-orange-600 rounded-lg p-2.5 md:p-3 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="bg-white/20 w-fit p-1 rounded-md mb-1 backdrop-blur-md">
                   <Zap className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                </div>
                <h2 className="text-sm md:text-base font-black uppercase italic tracking-tighter mb-0.5">The Vivi <span className="text-yellow-400">Flash Sale</span></h2>
                <p className="text-orange-100 text-[9px] md:text-[10px] max-w-xl">Every day, we drop prices by up to 90% on top-tier electronics, fashion, and home decor. These deals are live for only 24 hours.</p>
              </div>
              <Zap className="absolute right-[-15px] bottom-[-15px] h-20 w-20 text-white/10 rotate-12" />
            </div>

            <ProductSection
              title="Live"
              subtitle="Flash Deals"
              products={filteredDisplayProducts}
              onAddToWishlist={onAddToWishlist}
              onProductView={onProductView}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {[
                { icon: <Clock className="h-4 w-4" />, title: "Limited Time", desc: "Deals expire every midnight. Act fast or miss out." },
                { icon: <Zap className="h-4 w-4" />, title: "Huge Discounts", desc: "Prices slashed up to 90% off retail value." },
                { icon: <Star className="h-4 w-4" />, title: "Top Quality", desc: "Only highly-rated products make it to flash sales." }
              ].map((item, i) => (
                <div key={i} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                  <div className="bg-orange-50 w-6 h-6 rounded flex items-center justify-center text-orange-600 mb-2">
                    {item.icon}
                  </div>
                  <h4 className="font-bold text-[11px] uppercase tracking-tight mb-0.5">{item.title}</h4>
                  <p className="text-[10px] text-gray-500 font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'help':
        return (
          <div className="max-w-md mx-auto space-y-1">
            <div className="text-center space-y-0.5 mb-1">
              <h2 className="text-[11px] md:text-xs font-black uppercase italic tracking-tighter">How can we <span className="text-orange-600">help?</span></h2>
              <p className="text-gray-400 font-bold uppercase text-[6.5px] tracking-widest">Support is available 24/7 for the Vivi community</p>
            </div>

            <div className="space-y-0.5">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className={`bg-white rounded border transition-all overflow-hidden ${expandedFaq === i ? 'border-orange-500 shadow-2xs' : 'border-gray-100 hover:border-orange-200'}`}
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full p-1.5 flex items-center justify-between text-left group"
                  >
                    <span className={`text-[9px] font-bold tracking-tight ${expandedFaq === i ? 'text-orange-600' : 'text-gray-700'}`}>{faq.q}</span>
                    <div className={`p-0.5 rounded transition-colors ${expandedFaq === i ? 'bg-orange-600 text-white' : 'bg-gray-50 text-gray-400 group-hover:text-orange-600'}`}>
                      {expandedFaq === i ? <ChevronUp className="h-2 w-2" /> : <ChevronDown className="h-2 w-2" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeInOut" }}
                      >
                        <div className="px-1.5 pb-1.5 text-gray-500 font-medium text-[8px] leading-relaxed border-t border-gray-50 pt-0.5 mt-0.5 mx-1.5 italic">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <div className="bg-black rounded-md p-2 text-white flex flex-row items-center justify-between gap-1.5 relative overflow-hidden group mt-1.5">
              <div className="absolute top-0 right-0 p-1.5 opacity-10 group-hover:rotate-12 transition-transform">
                <Headset className="h-8 w-8" />
              </div>
              <div className="flex items-center gap-1.5 relative z-10">
                <div className="bg-zinc-800 p-1 rounded shadow-xs">
                  <Headset className="h-3 w-3 text-orange-500" />
                </div>
                <div>
                  <h4 className="text-[9px] font-black uppercase tracking-tight italic">Need direct assistance?</h4>
                  <p className="text-zinc-400 text-[7px] font-medium">Contact our expert support team now.</p>
                </div>
              </div>
              <Button
                onClick={handleStartChat}
                className="relative z-10 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded px-2 h-5 shadow-2xs transition-all active:scale-95 text-[8px]"
              >
                GET IN TOUCH
              </Button>
            </div>
          </div>
        );
      case 'new arrivals':
      case 'best sellers':
        return (
          <div className="space-y-1.5">
            <div className="bg-zinc-900 rounded-md p-1.5 md:p-2 text-white flex flex-row items-center justify-between gap-1.5 overflow-hidden relative">
              <div className="relative z-10 max-w-[75%]">
                <Badge variant="outline" className="border-orange-500 text-orange-500 mb-0.5 font-bold uppercase tracking-widest px-1 py-0 text-[6.5px]">{title}</Badge>
                <h2 className="text-[11px] md:text-xs font-black uppercase italic tracking-tighter mb-0.5">Shop the Latest <span className="text-orange-600">Trends</span></h2>
                <p className="text-zinc-400 text-[7.5px] md:text-[8px]">Curated selection of {normalizedTitle === 'new arrivals' ? 'the newest products to hit our store' : 'our most popular and high-rated items'} this week.</p>
              </div>
              <div className="relative z-10 w-10 h-10 md:w-12 md:h-12 bg-orange-600 rounded overflow-hidden shadow-2xs rotate-2 shrink-0">
                 <img
                    src={normalizedTitle === 'new arrivals' ? "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop" : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop"}
                    className="w-full h-full object-cover"
                    alt={title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=500&auto=format&fit=crop';
                    }}
                 />
              </div>
              <div className="absolute top-[-20px] left-[-20px] w-20 h-20 bg-orange-600/10 rounded-full blur-xl"></div>
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
              <div className="text-center py-6 bg-white rounded-xl border border-dashed border-gray-100">
                <Package className="h-6 w-6 text-gray-200 mx-auto mb-1" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Live inventory for {title} is syncing...</p>
                <Button onClick={onBack} variant="link" className="text-orange-600 font-bold uppercase text-[8px] tracking-widest mt-1">Browse All Products</Button>
              </div>
            )}
          </div>
        );
      case 'clearance':
        return (
          <div className="space-y-2">
            <div className="bg-red-600 rounded-lg p-2 md:p-2.5 text-white text-center relative overflow-hidden">
               <div className="relative z-10">
                  <h2 className="text-xs md:text-sm font-black uppercase italic tracking-tighter mb-0.5">Clearance <span className="text-red-200">Sale</span></h2>
                  <p className="text-red-100 text-[8px] md:text-[9px] max-w-xs mx-auto">Last chance to grab these items. Everything must go with prices up to 80% off!</p>
                  <div className="mt-1 flex justify-center gap-1">
                     <Badge className="bg-white text-red-600 px-1.5 py-0 rounded-full font-bold text-[8px] shadow-2xs">80% OFF</Badge>
                  </div>
               </div>
               <ShieldAlert className="absolute right-[-10px] top-[-10px] h-16 w-16 text-white/5 -rotate-12" />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
               <div className="bg-white p-2 rounded-md border border-gray-100 shadow-2xs flex items-center gap-2">
                  <div className="bg-red-50 p-1.5 rounded">
                     <Clock className="h-3.5 w-3.5 text-red-600" />
                  </div>
                  <div>
                     <h4 className="text-[11px] font-bold uppercase tracking-tight">Ending Soon</h4>
                     <p className="text-[9px] text-gray-500 font-medium">Clearance items are removed daily as stock runs out.</p>
                  </div>
               </div>
               <div className="bg-white p-2 rounded-md border border-gray-100 shadow-2xs flex items-center gap-2">
                  <div className="bg-red-50 p-1.5 rounded">
                     <Package className="h-3.5 w-3.5 text-red-600" />
                  </div>
                  <div>
                     <h4 className="text-[11px] font-bold uppercase tracking-tight">No Restocks</h4>
                     <p className="text-[9px] text-gray-500 font-medium">Once these items are gone, they are gone forever.</p>
                  </div>
               </div>
            </div>
          </div>
        );
      case 'brands':
        return (
          <div className="space-y-2">
             <div className="text-center space-y-0.5">
                <h2 className="text-xs md:text-sm font-bold uppercase italic tracking-tighter">Our Global <span className="text-orange-600">Partners</span></h2>
                <p className="text-gray-400 font-bold uppercase text-[7px] tracking-widest">Authorized retailers and manufacturers</p>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1.5 md:gap-2">
                {[
                  { name: "Apple", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" },
                  { name: "Samsung", logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg" },
                  { name: "Nike", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg" },
                  { name: "LG", logo: "https://upload.wikimedia.org/wikipedia/commons/b/bf/LG_logo_%282015%29.svg" },
                  { name: "Sony", logo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg" },
                  { name: "Adidas", logo: "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg" },
                ].map((brand, i) => (
                   <div key={i} className="aspect-video bg-white rounded-md border border-gray-100 flex items-center justify-center p-1.5 grayscale hover:grayscale-0 transition-all hover:border-orange-100 hover:shadow-2xs group">
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="w-full h-auto object-contain max-h-4 group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                   </div>
                ))}
             </div>

             <div className="bg-orange-50 p-2.5 rounded-lg text-center border border-orange-100">
                <h3 className="text-xs md:text-sm font-black uppercase tracking-tighter mb-0.5">Sell your brand on <span className="text-orange-600 italic">Vivi</span></h3>
                <p className="text-[9px] text-gray-500 font-medium mb-2 max-w-sm mx-auto">Join thousands of successful brands reaching millions of customers worldwide.</p>
                <Button className="bg-orange-600 text-white font-bold rounded px-3 h-6 shadow-2xs shadow-orange-200 text-[9px] uppercase tracking-tight">
                  Apply to Sell
                </Button>
             </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-6">
            <h2 className="text-lg font-bold uppercase italic mb-1">{title}</h2>
            <p className="text-[10px] text-gray-400 font-medium">This page is under construction.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-3">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-2 hover:bg-white rounded-full font-bold uppercase tracking-widest text-[8px] text-gray-400 hover:text-orange-600 flex items-center gap-1 h-7 px-2.5"
        >
          <ChevronLeft className="h-3 w-3" /> Back to Shop
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
