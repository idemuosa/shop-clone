import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Zap, Clock, ArrowRight, Gift } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { toast } from "sonner";

export default function PromoBanner() {
  const { user } = useAuth();
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

  const handleGetCoupon = async () => {
    if (!user) {
      toast.info("Please login to claim your coupon!");
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        vouchers: arrayUnion({
          code: 'FIRST20',
          offer: '20% OFF',
          type: 'First Order',
          date: 'Dec 31, 2024',
          addedAt: new Date().toISOString()
        })
      });
      toast.success("Coupon added to your profile!", {
        description: "Use code FIRST20 at checkout.",
        icon: <Gift className="h-4 w-4 text-orange-600" />
      });
    } catch (e) {
      console.error("Coupon error:", e);
      toast.error("Failed to add coupon. It might already be in your profile.");
    }
  };

  return (
    <section className="py-4 sm:py-6 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-orange-600 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl shadow-orange-100">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-4 sm:p-6 md:p-8 gap-4 sm:gap-6">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 bg-yellow-400 text-black px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider mb-2">
                <Zap className="h-3.5 w-3.5 fill-black" />
                Limited Offers Available
              </div>
              
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight mb-3 uppercase italic tracking-tighter">
                DON'T WAIT! <span className="text-yellow-400">EXTRA 20% OFF</span> <br className="hidden sm:inline" /> ON YOUR FIRST ORDER
              </h2>

              <div className="flex flex-wrap justify-center md:justify-start gap-2 sm:gap-3 mb-4">
                <div className="flex flex-col items-center">
                  <div className="bg-white/20 backdrop-blur-md text-white w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-base sm:text-lg font-black border border-white/30">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-black text-orange-100 mt-1 uppercase tracking-wider">Hours</span>
                </div>
                <div className="text-white text-lg sm:text-xl font-black self-center mb-3">:</div>
                <div className="flex flex-col items-center">
                  <div className="bg-white/20 backdrop-blur-md text-white w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-base sm:text-lg font-black border border-white/30">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-black text-orange-100 mt-1 uppercase tracking-wider">Mins</span>
                </div>
                <div className="text-white text-lg sm:text-xl font-black self-center mb-3">:</div>
                <div className="flex flex-col items-center">
                  <div className="bg-white/20 backdrop-blur-md text-white w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-base sm:text-lg font-black border border-white/30">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-black text-orange-100 mt-1 uppercase tracking-wider">Secs</span>
                </div>
              </div>

              <Button
                onClick={handleGetCoupon}
                className="bg-white text-orange-600 hover:bg-yellow-400 hover:text-black px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl text-sm sm:text-base font-black shadow-lg transition-all hover:scale-105 active:scale-95 uppercase tracking-tighter"
              >
                Get My Coupon <ArrowRight className="ml-1.5 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>

            <div className="flex-1 relative flex justify-center w-full max-w-xs md:max-w-none">
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10"
              >
                <img 
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop" 
                  alt="Special Offer" 
                  className="w-full max-w-[180px] sm:max-w-[220px] md:max-w-[260px] mx-auto rounded-2xl shadow-xl rotate-3"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop';
                  }}
                />
                <div className="absolute -bottom-2 -left-2 sm:-bottom-3 sm:-left-3 bg-yellow-400 text-black px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm shadow-md border-2 border-white -rotate-6">
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
