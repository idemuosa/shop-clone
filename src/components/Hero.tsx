import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Zap, ShoppingBag, Gift, Clock } from "lucide-react";

export default function Hero() {
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 22, seconds: 54 });

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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 flex flex-col md:flex-row items-center gap-4 md:gap-6">
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
            className="flex flex-col md:flex-row items-center gap-2 mb-3"
          >
            <div
              className="inline-flex items-center gap-1.5 bg-orange-600 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100"
            >
              <Zap className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              Vivi Store
            </div>
            
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-orange-600" />
              <div className="flex gap-0.5">
                {[timeLeft.hours, timeLeft.minutes, timeLeft.seconds].map((unit, i) => (
                  <div key={i} className="flex items-center">
                    <div className="bg-black text-white px-1.5 py-0.5 rounded text-[10px] font-black min-w-[22px] text-center">
                      {unit.toString().padStart(2, '0')}
                    </div>
                    {i < 2 && <span className="text-black font-black mx-0.5 text-[10px]">:</span>}
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
            className="text-lg md:text-2xl font-black text-black leading-tight mb-2 md:mb-3 uppercase italic tracking-tighter"
          >
            UP TO <span className="text-orange-600">90% OFF</span> <br />
            ON ALL <span className="underline decoration-yellow-400 decoration-4 underline-offset-2">TRENDING</span> ITEMS
          </motion.h1>
          
          <motion.p 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            className="text-gray-500 max-w-lg mb-3 md:mb-4 text-xs md:text-sm font-medium"
          >
            Don't miss out on the biggest deals of the season. High-quality products at unbeatable prices.
          </motion.p>
          
          <motion.div 
            variants={{
              hidden: { opacity: 0, scale: 0.9 },
              visible: { opacity: 1, scale: 1 }
            }}
            className="flex flex-wrap justify-center md:justify-start gap-2"
          >
            <Button className="bg-orange-600 hover:bg-orange-700 text-white px-4 md:px-6 py-2 rounded-xl text-xs font-black shadow-md shadow-orange-100 transition-all hover:scale-105 active:scale-95 uppercase tracking-tighter h-9">
              <ShoppingBag className="mr-1.5 h-3.5 w-3.5" /> Shop Deals Now
            </Button>
            <Button variant="outline" className="border border-gray-200 px-4 md:px-6 py-2 rounded-xl text-xs font-black transition-all hover:bg-gray-50 uppercase tracking-tighter h-9">
              <Gift className="mr-1.5 h-3.5 w-3.5" /> Claim Coupon
            </Button>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 0.6 }
            }}
            className="mt-4 flex flex-wrap justify-center md:justify-start gap-4"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-[9px] font-black uppercase tracking-widest">Verified Sellers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-[9px] font-black uppercase tracking-widest">Secure Payment</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-[9px] font-black uppercase tracking-widest">Easy Returns</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Image Content */}
        <div className="flex-1 relative w-full max-w-sm md:max-w-none">
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 bg-green-50 rounded-2xl p-2 md:p-4"
          >
            <img 
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop"
              alt="Fashion Trends" 
              className="w-full h-auto rounded-xl object-cover shadow-lg max-h-[260px]"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=800&auto=format&fit=crop';
              }}
            />
            
          </motion.div>
          
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-50 -z-10"></div>
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-yellow-100 rounded-full blur-3xl opacity-50 -z-10"></div>
        </div>
      </div>
    </section>
  );
}
