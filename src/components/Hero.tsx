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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col md:flex-row items-center gap-6">
        {/* Text Content */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="flex-1 z-10 text-center md:text-left"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0 }
            }}
            className="mb-3"
          >
            <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
              <Zap className="h-3.5 w-3.5 fill-purple-600 text-purple-600" />
              Featured Collection
            </span>
          </motion.div>
          
          <motion.h1 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            className="text-xl md:text-3xl font-bold text-zinc-900 leading-tight mb-3 tracking-tight"
          >
            Upgrade Your Style & Tech <br />
            With <span className="text-purple-600">Exclusive Deals</span>
          </motion.h1>
          
          <motion.p 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            className="text-gray-500 max-w-lg mb-6 md:mb-8 text-sm md:text-lg font-medium"
          >
            Don't miss out on the biggest deals of the season. High-quality products at unbeatable prices. Shop the latest gadgets, fashion, and home essentials.
          </motion.p>
          
          <motion.div 
            variants={{
              hidden: { opacity: 0, scale: 0.9 },
              visible: { opacity: 1, scale: 1 }
            }}
            className="flex flex-wrap justify-center md:justify-start gap-3"
          >
            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95">
              <ShoppingBag className="mr-2 h-4 w-4" /> Shop Deals Now
            </Button>
            <Button variant="outline" className="border border-gray-200 px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-gray-50">
              <Gift className="mr-2 h-4 w-4" /> Claim Coupon
            </Button>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 0.6 }
            }}
            className="mt-10 flex flex-wrap justify-center md:justify-start gap-6"
          >
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
          </motion.div>
        </motion.div>

        {/* Image Content - Reduced image size by using lower width in URL */}
        <div className="flex-1 relative w-full max-w-lg md:max-w-none">
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 bg-green-50 rounded-[40px] p-4 md:p-8"
          >
            <img 
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop"
              alt="Fashion Trends" 
              className="w-full h-auto rounded-[32px] object-cover shadow-2xl max-h-[500px]"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=800&auto=format&fit=crop';
              }}
            />
            
            {/* Floating Offer Tag */}
            <motion.div 
              animate={{
                y: [0, -10, 0],
                rotate: [12, 15, 12]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-6 -right-6 bg-yellow-400 text-black p-6 rounded-full font-black text-center shadow-xl border-4 border-white"
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
