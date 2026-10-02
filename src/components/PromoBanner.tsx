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
    <section className="py-6 md:py-8 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-orange-600 rounded-[32px] overflow-hidden shadow-2xl shadow-orange-100">
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
              
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-4 tracking-tight">
                Get <span className="text-yellow-400">Extra 20% Off</span> <br />
                On Your First Order
              </h2>

              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
                <div className="flex flex-col items-center">
                  <div className="bg-white/20 backdrop-blur-md text-white w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black border border-white/30">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <span className="text-[10px] font-black text-orange-100 mt-2 uppercase tracking-widest">Hours</span>
                </div>
                <div className="text-white text-3xl font-black self-center mb-6">:</div>
                <div className="flex flex-col items-center">
                  <div className="bg-white/20 backdrop-blur-md text-white w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black border border-white/30">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <span className="text-[10px] font-black text-orange-100 mt-2 uppercase tracking-widest">Mins</span>
                </div>
                <div className="text-white text-3xl font-black self-center mb-6">:</div>
                <div className="flex flex-col items-center">
                  <div className="bg-white/20 backdrop-blur-md text-white w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black border border-white/30">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                  <span className="text-[10px] font-black text-orange-100 mt-2 uppercase tracking-widest">Secs</span>
                </div>
              </div>

              <Button
                onClick={handleGetCoupon}
                className="bg-white text-orange-600 hover:bg-yellow-400 hover:text-black px-6 py-3 rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95"
              >
                Get My Coupon <ArrowRight className="ml-2 h-4 w-4" />
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
