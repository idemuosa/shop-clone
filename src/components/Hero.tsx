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
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-12 flex flex-col md:flex-row items-center gap-4 md:gap-8">
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
            className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-4 mb-3 md:mb-6"
          >
            <div
              className="inline-flex items-center gap-1.5 bg-orange-600 text-white px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border border-green-100"
            >
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
              Vivi Store
            </div>
            
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-600" />
              <div className="flex gap-1">
                {[timeLeft.hours, timeLeft.minutes, timeLeft.seconds].map((unit, i) => (
                  <div key={i} className="flex items-center">
                    <div className="bg-black text-white px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-black min-w-[24px] sm:min-w-[30px] text-center">
                      {unit.toString().padStart(2, '0')}
                    </div>
                    {i < 2 && <span className="text-black font-black mx-0.5 text-xs">:</span>}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          
          <motion.h1 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            className="text-xl sm:text-2xl md:text-4xl font-black text-black leading-tight mb-2 md:mb-6 uppercase italic tracking-tighter"
          >
            UP TO <span className="text-orange-600">90% OFF</span> <br className="hidden sm:inline" />
            ON ALL <span className="underline decoration-yellow-400 decoration-4 md:decoration-8 underline-offset-4">TRENDING</span> ITEMS
          </motion.h1>
          
          <motion.p 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            className="text-gray-500 max-w-lg mb-4 md:mb-8 text-xs sm:text-sm md:text-lg font-medium"
          >
            Don't miss out on the biggest deals of the season. High-quality products at unbeatable prices. Shop the latest gadgets, fashion, and home essentials.
          </motion.p>
          
          <motion.div 
            variants={{
              hidden: { opacity: 0, scale: 0.9 },
              visible: { opacity: 1, scale: 1 }
            }}
            className="flex flex-wrap justify-center md:justify-start gap-2.5 md:gap-4"
          >
            <Button className="bg-orange-600 hover:bg-orange-700 text-white px-4 md:px-10 py-2.5 md:py-7 h-10 md:h-auto rounded-xl md:rounded-2xl text-xs md:text-lg font-black shadow-lg shadow-orange-100 transition-all hover:scale-105 active:scale-95 uppercase tracking-tighter">
              <ShoppingBag className="mr-1.5 h-3.5 w-3.5 md:h-5 md:w-5" /> Shop Deals Now
            </Button>
            <Button variant="outline" className="border-2 border-gray-100 px-4 md:px-10 py-2.5 md:py-7 h-10 md:h-auto rounded-xl md:rounded-2xl text-xs md:text-lg font-black transition-all hover:bg-gray-50 uppercase tracking-tighter">
              <Gift className="mr-1.5 h-3.5 w-3.5 md:h-5 md:w-5" /> Claim Coupon
            </Button>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 0.6 }
            }}
            className="mt-4 md:mt-10 flex flex-wrap justify-center md:justify-start gap-3 sm:gap-6"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Verified Sellers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Secure Payment</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Easy Returns</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Image Content */}
        <div className="flex-1 relative w-full max-w-xs sm:max-w-lg md:max-w-none">
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 bg-green-50 rounded-2xl sm:rounded-[40px] p-2.5 sm:p-4 md:p-8"
          >
            <img 
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop"
              alt="Fashion Trends" 
              className="w-full h-auto rounded-xl sm:rounded-[32px] object-cover shadow-xl max-h-[180px] sm:max-h-[320px] md:max-h-[500px]"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=800&auto=format&fit=crop';
              }}
            />
            
            {/* Floating Offer Tag */}
            <motion.div 
              animate={{
                y: [0, -6, 0],
                rotate: [12, 15, 12]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-3 -right-3 sm:-top-6 sm:-right-6 bg-yellow-400 text-black p-3 sm:p-6 rounded-full font-black text-center shadow-lg border-2 sm:border-4 border-white"
            >
              <div className="text-[10px] sm:text-sm leading-none">ONLY</div>
              <div className="text-sm sm:text-3xl leading-none">{formatPrice(1.99)}</div>
            </motion.div>
          </motion.div>
          
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 sm:w-64 sm:h-64 bg-green-100 rounded-full blur-3xl opacity-50 -z-10"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 sm:w-64 sm:h-64 bg-yellow-100 rounded-full blur-3xl opacity-50 -z-10"></div>
        </div>
      </div>
    </section>
  );
}
