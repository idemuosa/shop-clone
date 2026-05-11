import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore';
import { 
  ShoppingBag, 
  Zap, 
  Star, 
  TrendingUp, 
  Search, 
  Filter, 
  ChevronRight, 
  Heart,
  Package,
  CreditCard,
  Bell,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import ProductSection from '../ProductSection';
import { motion } from 'motion/react';

interface UserDashboardProps {
  onBrowseMore: () => void;
}

export default function UserDashboard({ onBrowseMore }: UserDashboardProps) {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(8));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        price: `$${doc.data().price}`,
      })));
    }, (error) => {
      console.error("Dashboard products error:", error);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecentOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Dashboard orders error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      {/* Dashboard Top Area */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none mb-2">
                User <span className="text-orange-600">Dashboard</span>
              </h1>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Always secure • Always discounted
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex bg-gray-50 rounded-2xl p-1 border border-gray-100">
                <div className="px-6 py-2 text-center">
                   <p className="text-[9px] font-black uppercase text-gray-400 mb-0.5">Coins</p>
                   <p className="font-black text-orange-600">🪙 {profile?.points || 0}</p>
                </div>
                <div className="w-px h-8 bg-gray-200 self-center" />
                <div className="px-6 py-2 text-center">
                   <p className="text-[9px] font-black uppercase text-gray-400 mb-0.5">Orders</p>
                   <p className="font-black text-black">{recentOrders.length}</p>
                </div>
              </div>
              <Button onClick={onBrowseMore} className="bg-black hover:bg-zinc-800 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] h-12 px-8 shadow-xl shadow-zinc-100">
                GO TO MARKET
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Dashboard Feed */}
          <div className="lg:col-span-2 space-y-8">
            {/* Search Bar - Enhanced */}
            <div className="bg-white p-2 rounded-[28px] shadow-2xl shadow-gray-200/50 flex items-center border border-gray-100">
              <div className="pl-6 text-gray-400">
                <Search className="h-5 w-5" />
              </div>
              <Input 
                placeholder="Search for jerseys, watches, tech..." 
                className="border-none bg-transparent h-14 focus-visible:ring-0 font-bold text-gray-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button size="icon" className="h-12 w-12 rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-100 mr-1 shrink-0">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Recommendations Grid */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                   <h2 className="text-xl font-black uppercase tracking-tighter italic">Top <span className="text-orange-600">Picks</span> For You</h2>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Based on your recent browsing</p>
                </div>
                <Button variant="link" className="text-orange-600 font-bold text-xs p-0 h-auto" onClick={onBrowseMore}>
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {products.slice(0, 4).map((product) => (
                  <motion.div 
                    key={product.id}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-[32px] p-4 border border-gray-100 shadow-sm group cursor-pointer"
                  >
                    <div className="relative aspect-square rounded-[24px] overflow-hidden bg-gray-50 mb-4">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 right-3">
                         <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-md border-none shadow-sm text-gray-400 hover:text-orange-600">
                            <Heart className="h-4 w-4" />
                         </Button>
                      </div>
                      <div className="absolute bottom-3 left-3">
                         <Badge className="bg-orange-600 text-white font-black text-[8px] uppercase tracking-widest border-none">
                            {product.tag || 'NEW'}
                         </Badge>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-black text-xs uppercase truncate mb-1">{product.name}</h3>
                      <div className="flex items-center justify-between">
                         <span className="text-orange-600 font-black text-base">{product.price}</span>
                         <div className="flex items-center gap-1 text-gray-400">
                            <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                            <span className="text-[10px] font-bold">{product.rating}</span>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Promo Section */}
            <div className="bg-gradient-to-br from-zinc-900 to-black rounded-[40px] p-8 text-white relative overflow-hidden group">
               <div className="relative z-10 max-w-[60%]">
                  <Badge className="bg-orange-600 text-white font-black mb-4">MEMBER SPECIAL</Badge>
                  <h3 className="text-3xl font-black uppercase tracking-tighter leading-none italic mb-4">Get 20% Off <br /> Your Next <span className="text-orange-600">Tech Purchase</span></h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed mb-6">
                    Valid for all members with over 100 Shopsy Coins. Use code <span className="text-white font-black italic">TECHSAVVY</span>
                  </p>
                  <Button className="bg-white text-black font-black rounded-2xl h-12 px-8 hover:bg-orange-100 transition-all active:scale-95">
                    CLAIM VOUCHER
                  </Button>
               </div>
               <div className="absolute right-[-20px] bottom-[-20px] opacity-20 group-hover:scale-110 transition-transform duration-700">
                  <Zap className="h-64 w-64 text-orange-600 rotate-12" />
               </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            {/* Recent Orders - Mini View */}
            <Card className="rounded-[40px] border-none shadow-2xl shadow-gray-200/50 p-6">
              <div className="flex items-center justify-between mb-6 px-2">
                 <h3 className="font-black uppercase tracking-tighter italic text-sm">Recent <span className="text-orange-600">Orders</span></h3>
                 <Clock className="h-4 w-4 text-gray-300" />
              </div>
              <div className="space-y-4">
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                     <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No recent activity</p>
                  </div>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shrink-0 border border-gray-100">
                         <img src={order.productImage} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-[10px] font-black uppercase truncate leading-tight group-hover:text-orange-600 transition-colors">{order.productName}</p>
                         <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{order.status || 'Pending'}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-orange-600 transition-all translate-x-0 group-hover:translate-x-1" />
                    </div>
                  ))
                )}
                <Button variant="outline" className="w-full rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] h-11 mt-2">
                  VIEW ALL HISTORY
                </Button>
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
               <button className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm text-center hover:bg-orange-50 transition-colors group">
                  <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:rotate-12 transition-transform">
                     <Package className="h-5 w-5 text-orange-600" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest">Track Pack</p>
               </button>
               <button className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm text-center hover:bg-orange-50 transition-colors group">
                  <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:rotate-12 transition-transform">
                     <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest">Wallets</p>
               </button>
               <button className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm text-center hover:bg-orange-50 transition-colors group">
                  <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:rotate-12 transition-transform">
                     <Bell className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest">Alerts</p>
               </button>
               <button className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm text-center hover:bg-zinc-900 group transition-colors">
                  <div className="w-10 h-10 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:rotate-12 transition-transform">
                     <TrendingUp className="h-5 w-5 text-zinc-900" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest group-hover:text-white transition-colors">Sell Items</p>
               </button>
            </div>

            {/* Community/Social Card */}
            <Card className="rounded-[40px] border-none shadow-2xl shadow-orange-100/50 p-8 bg-orange-600 text-white overflow-hidden relative">
               <div className="relative z-10">
                  <Badge className="bg-white text-orange-600 border-none font-black mb-4">NEW FEAT</Badge>
                  <h4 className="text-xl font-black uppercase tracking-tighter leading-tight mb-4 italic">Invite Friends <br /> Win Coupons</h4>
                  <div className="flex gap-2">
                     <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-100">
                        <img src="https://i.pravatar.cc/150?u=1" className="w-full h-full object-cover" />
                     </div>
                     <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden -ml-4 bg-gray-200">
                        <img src="https://i.pravatar.cc/150?u=2" className="w-full h-full object-cover" />
                     </div>
                     <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden -ml-4 bg-orange-400 flex items-center justify-center text-[8px] font-black">
                        +12k
                     </div>
                  </div>
               </div>
               <Heart className="absolute top-[-10px] right-[-10px] h-32 w-32 text-white/10 rotate-12" />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
