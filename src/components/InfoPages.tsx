import React, { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  X,
  Zap,
  Headset,
  Clock,
  Star,
  Package,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Flame,
  Tag,
  Store,
  HelpCircle,
  Layers,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ProductSection from './ProductSection';
import { BRANDS } from './BrandPartners';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface InfoPageProps {
  title: string;
  onBack: () => void;
  products?: any[];
  onAddToWishlist?: () => void;
  onProductView?: (product: any) => void;
  onSelectPage?: (page: string) => void;
}

const SIDE_NAVIGATION_ITEMS = [
  { name: "New arrivals", icon: Sparkles, desc: "Latest trending products" },
  { name: "Best sellers", icon: Flame, desc: "Most popular items" },
  { name: "Clearance", icon: Tag, desc: "Massive price drops" },
  { name: "Brands", icon: Store, desc: "Global partner brands" },
  { name: "Help", icon: HelpCircle, desc: "24/7 customer support" },
];

export default function InfoPage({
  title,
  onBack,
  products = [],
  onAddToWishlist,
  onProductView,
  onSelectPage
}: InfoPageProps) {
  const [activePage, setActivePage] = useState<string>(title);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    setActivePage(title);
  }, [title]);

  const handlePageChange = (pageName: string) => {
    setActivePage(pageName);
    if (onSelectPage) {
      onSelectPage(pageName);
    }
  };

  const normalizedTitle = activePage.toLowerCase();

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
      return [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 12);
    }
    if (normalizedTitle === 'best sellers') {
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
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-orange-600 rounded-md p-2 text-white relative overflow-hidden">
              <div className="flex items-center gap-2 relative z-10">
                <div className="bg-white/20 p-1 rounded backdrop-blur-md shrink-0 flex items-center justify-center">
                   <Zap className="h-3.5 w-3.5 text-yellow-300 fill-yellow-300" />
                </div>
                <div>
                  <h2 className="text-xs md:text-sm font-black uppercase italic tracking-tighter leading-none">The Vivi <span className="text-yellow-300">Flash Sale</span></h2>
                  <p className="text-orange-100 text-[8.5px] md:text-[9px] mt-0.5">Price drops up to 90% on electronics, fashion & gadgets. Live for 24 hours.</p>
                </div>
              </div>
              <div className="flex items-center shrink-0 relative z-10">
                <Badge className="bg-yellow-400 text-black text-[8px] font-black uppercase tracking-wider px-2 py-0.5">24H ONLY</Badge>
              </div>
              <Zap className="absolute right-[-10px] bottom-[-10px] h-16 w-16 text-white/10 rotate-12" />
            </div>

            <ProductSection
              title="Live"
              subtitle="Flash Deals"
              products={filteredDisplayProducts}
              onAddToWishlist={onAddToWishlist}
              onProductView={onProductView}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
              {[
                { icon: <Clock className="h-3.5 w-3.5 text-orange-600" />, title: "Limited Time", desc: "Deals expire at midnight daily." },
                { icon: <Zap className="h-3.5 w-3.5 text-orange-600" />, title: "Huge Discounts", desc: "Up to 90% off retail prices." },
                { icon: <Star className="h-3.5 w-3.5 text-orange-600" />, title: "Top Quality", desc: "Highly rated verified products." }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-100 shadow-2xs">
                  <div className="bg-orange-50 p-1.5 rounded flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-[10px] uppercase tracking-tight leading-none">{item.title}</h4>
                    <p className="text-[8.5px] text-gray-500 font-medium mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'help':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white rounded-md p-2 border border-gray-100 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="bg-orange-50 p-1.5 rounded text-orange-600 shrink-0 flex items-center justify-center">
                  <Headset className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs md:text-sm font-black uppercase italic tracking-tighter leading-none">How can we <span className="text-orange-600">help?</span></h2>
                  <p className="text-gray-400 font-bold uppercase text-[7.5px] tracking-widest mt-0.5">Support is available 24/7 for the Vivi community</p>
                </div>
              </div>
              <div className="flex items-center shrink-0">
                <span className="text-[8px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="h-2.5 w-2.5 text-green-600" /> Online
                </span>
              </div>
            </div>

            <div className="space-y-1">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className={`bg-white rounded-md border transition-all overflow-hidden ${expandedFaq === i ? 'border-orange-500 shadow-2xs' : 'border-gray-100 hover:border-orange-200'}`}
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full p-2 flex items-center justify-between text-left group cursor-pointer"
                  >
                    <span className={`text-[11px] font-bold tracking-tight ${expandedFaq === i ? 'text-orange-600' : 'text-gray-700'}`}>{faq.q}</span>
                    <div className={`p-0.5 rounded transition-colors ${expandedFaq === i ? 'bg-orange-600 text-white' : 'bg-gray-50 text-gray-400 group-hover:text-orange-600'}`}>
                      {expandedFaq === i ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
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
                        <div className="px-2 pb-2 text-gray-500 font-medium text-[9.5px] leading-relaxed border-t border-gray-50 pt-1 mt-0.5 mx-2 italic">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between bg-black rounded-md p-2.5 text-white relative overflow-hidden gap-2">
              <div className="flex items-center gap-2 relative z-10">
                <div className="bg-zinc-800 p-1.5 rounded text-orange-500 shrink-0 flex items-center justify-center">
                  <Headset className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-tight italic leading-none">Need direct assistance?</h4>
                  <p className="text-zinc-400 text-[8.5px] font-medium mt-0.5">Contact our expert support team anytime.</p>
                </div>
              </div>
              <div className="flex items-center shrink-0 relative z-10">
                <Button
                  onClick={handleStartChat}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded px-2.5 h-6 transition-all text-[8.5px] uppercase tracking-tighter"
                >
                  Get In Touch
                </Button>
              </div>
              <Headset className="absolute right-[-5px] bottom-[-5px] h-14 w-14 text-white/10" />
            </div>
          </div>
        );

      case 'new arrivals':
      case 'best sellers':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-zinc-900 rounded-md p-2 text-white relative overflow-hidden gap-2">
              <div className="flex items-center gap-2 relative z-10">
                <div className="bg-orange-600 p-1.5 rounded shrink-0 flex items-center justify-center">
                  {normalizedTitle === 'new arrivals' ? <Sparkles className="h-4 w-4 text-white" /> : <Flame className="h-4 w-4 text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="border-orange-500 text-orange-400 font-bold uppercase text-[7px] px-1 py-0">{activePage}</Badge>
                  </div>
                  <h2 className="text-xs md:text-sm font-black uppercase italic tracking-tighter leading-none mt-0.5">
                    Shop the Latest <span className="text-orange-500">Trends</span>
                  </h2>
                  <p className="text-zinc-400 text-[8.5px] md:text-[9px] mt-0.5">
                    Curated selection of {normalizedTitle === 'new arrivals' ? 'the newest products in store' : 'our highest rated top sellers'}.
                  </p>
                </div>
              </div>
              {normalizedTitle === 'new arrivals' && (
                <div className="flex items-center shrink-0 relative z-10">
                  <img
                    src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=300&auto=format&fit=crop"
                    className="w-10 h-10 md:w-12 md:h-12 rounded object-cover shadow-2xs border border-zinc-700"
                    alt={activePage}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=300&auto=format&fit=crop';
                    }}
                  />
                </div>
              )}
            </div>

            {filteredDisplayProducts.length > 0 ? (
               <ProductSection
                title={activePage.split(' ')[0]}
                subtitle={activePage.split(' ')[1] || ""}
                products={filteredDisplayProducts}
                onAddToWishlist={onAddToWishlist}
                onProductView={onProductView}
              />
            ) : (
              <div className="text-center py-4 bg-white rounded-md border border-dashed border-gray-100">
                <Package className="h-5 w-5 text-gray-200 mx-auto mb-1" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[8px]">Live inventory for {activePage} is syncing...</p>
                <Button onClick={onBack} variant="link" className="text-orange-600 font-bold uppercase text-[8px] tracking-widest mt-0.5">Browse All Products</Button>
              </div>
            )}
          </div>
        );

      case 'clearance':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-red-600 rounded-md p-2 md:p-2.5 text-white relative overflow-hidden gap-2">
              <div className="flex items-center gap-2 relative z-10">
                <div className="bg-white/20 p-1.5 rounded shrink-0 flex items-center justify-center">
                  <ShieldAlert className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-xs md:text-sm font-black uppercase italic tracking-tighter leading-none">Clearance <span className="text-red-200">Sale</span></h2>
                  <p className="text-red-100 text-[8.5px] md:text-[9px] mt-0.5">Final stock items with prices slashed up to 80% off!</p>
                </div>
              </div>
              <div className="flex items-center shrink-0 relative z-10">
                <Badge className="bg-white text-red-600 px-2 py-0.5 rounded-full font-black text-[9px] shadow-2xs">UP TO 80% OFF</Badge>
              </div>
              <ShieldAlert className="absolute right-[-10px] top-[-10px] h-16 w-16 text-white/10 -rotate-12" />
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
               <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-100 shadow-2xs">
                  <div className="bg-red-50 p-1.5 rounded shrink-0">
                     <Clock className="h-3.5 w-3.5 text-red-600" />
                  </div>
                  <div>
                     <h4 className="text-[10px] font-black uppercase tracking-tight leading-none">Ending Soon</h4>
                     <p className="text-[8.5px] text-gray-500 font-medium mt-0.5">Items removed daily as stock clears out.</p>
                  </div>
               </div>
               <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-100 shadow-2xs">
                  <div className="bg-red-50 p-1.5 rounded shrink-0">
                     <Package className="h-3.5 w-3.5 text-red-600" />
                  </div>
                  <div>
                     <h4 className="text-[10px] font-black uppercase tracking-tight leading-none">No Restocks</h4>
                     <p className="text-[8.5px] text-gray-500 font-medium mt-0.5">Limited remaining stock available.</p>
                  </div>
               </div>
            </div>
          </div>
        );

      case 'brands':
        return (
          <div className="space-y-2">
             <div className="flex items-center justify-between bg-white rounded-md p-2 border border-gray-100 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="bg-orange-50 p-1.5 rounded text-orange-600 shrink-0 flex items-center justify-center">
                    <Store className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-xs md:text-sm font-black uppercase italic tracking-tighter leading-none">Global <span className="text-orange-600">Partners</span></h2>
                    <p className="text-gray-400 font-bold uppercase text-[7.5px] tracking-widest mt-0.5">Authorized brand retailers & manufacturers</p>
                  </div>
                </div>
                <div className="flex items-center shrink-0">
                  <Badge variant="outline" className="border-orange-200 text-orange-600 text-[8px] font-bold px-2 py-0.5">
                    {BRANDS.length} Brands
                  </Badge>
                </div>
             </div>

             <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5">
                {BRANDS.map((brand, i) => (
                   <div key={i} className="aspect-video bg-white rounded-md border border-gray-100 flex items-center justify-center p-1.5 grayscale hover:grayscale-0 transition-all hover:border-orange-200 group">
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="w-full h-auto object-contain max-h-4 md:max-h-5 group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                   </div>
                ))}
             </div>

             <div className="flex items-center justify-between bg-orange-50 p-2.5 rounded-md border border-orange-100 gap-2">
                <div className="flex items-center gap-2">
                  <div className="bg-orange-600 text-white p-1.5 rounded shrink-0 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-tight leading-none">Sell your brand on <span className="text-orange-600 italic">Vivi</span></h3>
                    <p className="text-[8.5px] text-gray-500 font-medium mt-0.5">Reach millions of worldwide shoppers on our high-velocity platform.</p>
                  </div>
                </div>
                <div className="flex items-center shrink-0">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white font-black rounded px-3 h-6 text-[8.5px] uppercase tracking-tighter">
                    Apply Now
                  </Button>
                </div>
             </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-6 bg-white rounded-md border border-gray-100">
            <h2 className="text-sm font-bold uppercase italic mb-1">{activePage}</h2>
            <p className="text-[9px] text-gray-400 font-medium">This page is currently active.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-2">
      <div className="max-w-5xl mx-auto px-2 sm:px-4 lg:px-6">
        {/* Top Header Row with Flex layout */}
        <div className="flex items-center justify-between mb-2.5 bg-white p-2 rounded-md border border-gray-100 shadow-2xs">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={onBack}
              className="hover:bg-gray-50 rounded-full font-bold uppercase tracking-widest text-[8px] text-gray-500 hover:text-orange-600 flex items-center gap-1 h-6 px-2"
              title="Back to Shop"
            >
              <ChevronLeft className="h-3 w-3" /> Back to Shop
            </Button>
            <span className="text-gray-200">|</span>
            <span className="text-[9.5px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1">
              <Layers className="h-3 w-3 text-orange-600" /> Catalog Pages
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8.5px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 uppercase tracking-tight">
              {activePage}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-full hover:bg-gray-100 h-6 w-6 text-gray-500 hover:text-orange-600"
              title="Close Page"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Main Flex Layout: Side Navigation + Content Area */}
        <div className="flex flex-col md:flex-row gap-2.5 items-start">
          {/* Side Navigation */}
          <aside className="w-full md:w-44 shrink-0 bg-white rounded-md border border-gray-100 p-1.5 shadow-2xs">
            <div className="text-[8.5px] font-black uppercase tracking-widest text-gray-400 px-1.5 py-1 mb-1 border-b border-gray-50 flex items-center gap-1">
              <Layers className="h-3 w-3 text-orange-600" /> Navigation
            </div>
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0 scrollbar-hide">
              {SIDE_NAVIGATION_ITEMS.map((item) => {
                const isActive = activePage.toLowerCase() === item.name.toLowerCase();
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => handlePageChange(item.name)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1.2 rounded text-xs md:text-sm font-bold transition-all whitespace-nowrap text-left w-full cursor-pointer",
                      isActive
                        ? "bg-orange-600 text-white shadow-2xs"
                        : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                    )}
                  >
                    <Icon className={cn("h-3 w-3 shrink-0", isActive ? "text-white" : "text-orange-600")} />
                    <span className="truncate">{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Page Content */}
          <main className="flex-1 w-full min-w-0">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
