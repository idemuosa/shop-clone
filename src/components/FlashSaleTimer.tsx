import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { motion } from "motion/react";

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

export default function FlashSaleTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    hours: 2,
    minutes: 45,
    seconds: 12,
  });

  useEffect(() => {
    // Set an end time (e.g., 2 hours, 45 mins, 12 secs from now for demo)
    const targetDate = new Date();
    targetDate.setHours(targetDate.getHours() + 2);
    targetDate.setMinutes(targetDate.getMinutes() + 45);
    targetDate.setSeconds(targetDate.getSeconds() + 12);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white rounded-xl p-6 shadow-sm border border-green-100 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4">
          <div className="bg-purple-600 p-3 rounded-lg text-white">
            <Zap className="h-6 w-6 fill-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-purple-600 italic tracking-tighter">Flash Sale</h2>
            <p className="text-sm text-gray-500 font-medium">
              Ending in: <span className="text-black font-bold font-mono">{formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <TimeUnit value={timeLeft.hours} label="Hours" />
          <TimeUnit value={timeLeft.minutes} label="Mins" />
          <TimeUnit value={timeLeft.seconds} label="Secs" />
        </div>
      </motion.div>
    </section>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  const formattedValue = value.toString().padStart(2, '0');

  return (
    <div className="text-center">
      <motion.div
        key={value}
        initial={{ scale: 0.9, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-100 w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold font-mono shadow-inner"
      >
        {formattedValue}
      </motion.div>
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 block">{label}</span>
    </div>
  );
}
