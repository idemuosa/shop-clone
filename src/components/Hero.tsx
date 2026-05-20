import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Zap, ShoppingBag, Gift, Clock } from "lucide-react";
import { useCurrency } from "@/lib/CurrencyContext";

export default function Hero() {
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 22, seconds: 54 });
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else {
          if (minutes > 0) {
            minutes--;
            seconds = 59;
          } else {
            if (hours > 0) {
              hours--;
              minutes = 59;
              seconds = 59;
            }
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full bg-white overflow-hidden border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col md:flex-row items-center gap-8">
        {/* Text Content */}
        <div className="flex-1 z-10 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border-2 border-green-100"
            >
              <Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              Vivo Flash Sales
            </motion.div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <div className="flex gap-1">
                {[timeLeft.hours, timeLeft.minutes, timeLeft.seconds].map((unit, i) => (
                  <div key={i} className="flex items-center">
                    <div className="bg-black text-white px-2 py-1 rounded text-xs font-black min-w-[30px] text-center">
                      {unit.toString().padStart(2, '0')}
                    </div>
                    {i < 2 && <span className="text-black font-black mx-0.5">:</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl font-black text-black leading-tight mb-6 uppercase italic tracking-tighter"
          >
            UP TO <span className="text-purple-600">90% OFF</span> <br />
            ON ALL <span className="underline decoration-yellow-400 decoration-8 underline-offset-4">TRENDING</span> ITEMS
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-500 max-w-lg mb-8 text-lg font-medium"
          >
            Don't miss out on the biggest deals of the season. High-quality products at unbeatable prices. Shop the latest gadgets, fashion, and home essentials.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center md:justify-start gap-4"
          >
            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-7 rounded-2xl text-lg font-black shadow-xl shadow-purple-100 transition-all hover:scale-105 active:scale-95 uppercase tracking-tighter">
              <ShoppingBag className="mr-2 h-5 w-5" /> Shop Deals Now
            </Button>
            <Button variant="outline" className="border-2 border-gray-100 px-10 py-7 rounded-2xl text-lg font-black transition-all hover:bg-gray-50 uppercase tracking-tighter">
              <Gift className="mr-2 h-5 w-5 text-purple-600" /> Claim Coupon
            </Button>
          </motion.div>

          {/* Trust Badges */}
          <div className="mt-10 flex flex-wrap justify-center md:justify-start gap-6 opacity-60">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Verified Sellers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Easy Returns</span>
            </div>
          </div>
        </div>

        {/* Image Content */}
        <div className="flex-1 relative w-full max-w-lg md:max-w-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 bg-green-50 rounded-[40px] p-4 md:p-8"
          >
            <img 
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop" 
              alt="Fashion Trends" 
              className="w-full h-auto rounded-[32px] object-cover shadow-2xl"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=2070&auto=format&fit=crop';
              }}
            />
            
            {/* Floating Offer Tag */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-6 -right-6 bg-yellow-400 text-black p-6 rounded-full font-black text-center shadow-xl border-4 border-white rotate-12"
            >
              <div className="text-sm leading-none">ONLY</div>
              <div className="text-3xl leading-none">{formatPrice(1.99)}</div>
            </motion.div>
          </motion.div>
          
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-50 -z-10"></div>
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-yellow-100 rounded-full blur-3xl opacity-50 -z-10"></div>
        </div>
      </div>
    </section>
  );
}
