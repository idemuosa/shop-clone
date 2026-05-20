import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Zap, Clock, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

export default function PromoBanner() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 12,
    minutes: 45,
    seconds: 30
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-purple-600 rounded-[32px] overflow-hidden shadow-2xl shadow-purple-100">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-8 md:p-12 gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-yellow-400 text-black px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6">
                <Zap className="h-4 w-4 fill-black" />
                Flash Sale Ending Soon
              </div>
              
              <h2 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6 uppercase italic tracking-tighter">
                DON'T WAIT! <br />
                <span className="text-yellow-400">EXTRA 20% OFF</span> <br />
                ON YOUR FIRST ORDER
              </h2>

              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
                <div className="flex flex-col items-center">
                  <div className="bg-white/20 backdrop-blur-md text-white w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black border border-white/30">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <span className="text-[10px] font-black text-purple-100 mt-2 uppercase tracking-widest">Hours</span>
                </div>
                <div className="text-white text-3xl font-black self-center mb-6">:</div>
                <div className="flex flex-col items-center">
                  <div className="bg-white/20 backdrop-blur-md text-white w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black border border-white/30">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <span className="text-[10px] font-black text-purple-100 mt-2 uppercase tracking-widest">Mins</span>
                </div>
                <div className="text-white text-3xl font-black self-center mb-6">:</div>
                <div className="flex flex-col items-center">
                  <div className="bg-white/20 backdrop-blur-md text-white w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black border border-white/30">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                  <span className="text-[10px] font-black text-purple-100 mt-2 uppercase tracking-widest">Secs</span>
                </div>
              </div>

              <Button className="bg-white text-purple-600 hover:bg-yellow-400 hover:text-black px-12 py-8 rounded-2xl text-xl font-black shadow-xl transition-all hover:scale-105 active:scale-95 uppercase tracking-tighter">
                Get My Coupon <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </div>

            <div className="flex-1 relative">
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10"
              >
                <img 
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop" 
                  alt="Special Offer" 
                  className="w-full max-w-md mx-auto rounded-[32px] shadow-2xl rotate-3"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop';
                  }}
                />
                <div className="absolute -bottom-6 -left-6 bg-yellow-400 text-black p-6 rounded-3xl font-black text-2xl shadow-xl border-4 border-white -rotate-6">
                  -85% OFF
                </div>
              </motion.div>
              
              {/* Decorative circles */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border-2 border-white/10 rounded-full -z-10"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] border-2 border-white/5 rounded-full -z-10"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
