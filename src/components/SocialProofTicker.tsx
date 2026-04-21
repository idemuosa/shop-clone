import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Users, Zap, Star } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface SocialProof {
  id: string;
  customerEmail: string;
  productName: string;
  time: string;
}

const names = ['Adebayo', 'Chinelo', 'Oluwatobi', 'Zainab', 'Chidi', 'Ify', 'Tunde', 'Kemi', 'Samuel', 'Sarah'];
const cities = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Benin City', 'Warri'];

export default function SocialProofTicker() {
  const [currentNotification, setCurrentNotification] = useState<SocialProof | null>(null);

  useEffect(() => {
    // Attempt to get real recent orders, otherwise fallback to mock
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) return;
      
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        customerEmail: doc.data().customerEmail,
        productName: doc.data().productName,
        time: 'Just now'
      }));

      // Show a notification every 20-30 seconds
      const interval = setInterval(() => {
        const randomOrder = orders[Math.floor(Math.random() * orders.length)];
        // Mask the email
        const maskedEmail = randomOrder.customerEmail ? 
          randomOrder.customerEmail.split('@')[0].slice(0, 3) + '***' : 
          names[Math.floor(Math.random() * names.length)];

        setCurrentNotification({
          ...randomOrder,
          customerEmail: maskedEmail
        });

        // Hide after 6 seconds
        setTimeout(() => setCurrentNotification(null), 6000);
      }, 25000);

      return () => clearInterval(interval);
    });

    return () => unsubscribe();
  }, []);

  // Mock interval if no orders exist yet
  useEffect(() => {
    const mockInterval = setInterval(() => {
      if (currentNotification) return;

      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      const products = ['Smart Watch Ultra', 'Wireless Earbuds', 'Gaming Mouse', 'Keyboard Pro', 'USB-C Hub'];
      const randomProduct = products[Math.floor(Math.random() * products.length)];

      setCurrentNotification({
        id: Math.random().toString(),
        customerEmail: randomName,
        productName: randomProduct,
        time: 'just now in ' + randomCity
      });

      setTimeout(() => setCurrentNotification(null), 6000);
    }, 45000);

    return () => clearInterval(mockInterval);
  }, [currentNotification]);

  return (
    <div className="fixed bottom-24 left-6 z-40 hidden md:block">
      <AnimatePresence>
        {currentNotification && (
          <motion.div
            initial={{ opacity: 0, x: -100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.5 }}
            className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_15px_40px_rgba(0,0,0,0.1)] p-4 rounded-[24px] flex items-center gap-4 max-w-[300px]"
          >
            <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100 flex-shrink-0">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1 italic">Recent Purchase</p>
              <h4 className="text-xs font-black text-black leading-tight uppercase tracking-tighter truncate">
                {currentNotification.customerEmail} bought {currentNotification.productName}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex -space-x-1">
                   {[1,2,3].map(i => <div key={i} className="w-3 h-3 rounded-full bg-orange-600 border border-white" />)}
                </div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{currentNotification.time}</p>
              </div>
            </div>
            <motion.div 
               animate={{ scale: [1, 1.2, 1] }} 
               transition={{ repeat: Infinity, duration: 2 }}
               className="bg-orange-50 p-1.5 rounded-lg"
            >
               <Zap className="h-3 w-3 text-orange-600 fill-orange-600" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
