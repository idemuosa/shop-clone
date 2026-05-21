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
  Clock,
  MapPin,
  Smartphone,
  Wallet,
  CheckCircle2,
  Trash2,
  X,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'motion/react';
import { useCurrency } from '@/lib/CurrencyContext';
import { API_URL } from '@/lib/api';
import { toast } from 'sonner';

interface UserDashboardProps {
  onBrowseMore: () => void;
}

export default function UserDashboard({ onBrowseMore }: UserDashboardProps) {
  const { user, profile } = useAuth();
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [activeModal, setActiveModal] = useState<'none' | 'track' | 'wallets' | 'alerts' | 'sell'>('none');

  useEffect(() => {
    const fetchDashboardProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/products/`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setProducts(data.slice(0, 8).map((p: any) => ({
            id: p.id,
            name: p.name,
            image: p.image,
            price: p.price,
            rating: p.rating || 4.5,
            tag: p.tag
          })));
        }
      } catch (error) {
        console.error("Dashboard products fetch error:", error);
      }
    };
    fetchDashboardProducts();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedOrders = orders.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      setRecentOrders(sortedOrders.slice(0, 5));
    }, (error) => {
      console.warn("Dashboard orders error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
       toast.info(`Searching for "${searchQuery}"...`);
    }
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-10">
      {/* Dashboard Top Area */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tighter italic leading-none mb-1">
                User <span className="text-purple-600">Dashboard</span>
              </h1>
              <div className="text-gray-400 font-bold text-[8px] md:text-[9px] tracking-widest flex items-center gap-2">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" /> Always secure • Always discounted
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex bg-gray-50 rounded-xl p-0.5 border border-gray-100">
                <div className="px-3 md:px-4 py-1 text-center">
                   <p className="text-[7px] md:text-[8px] font-black uppercase text-gray-400 mb-0.5">Coins</p>
                   <p className="text-xs md:text-sm font-black text-purple-600">🪙 {profile?.points || 0}</p>
                </div>
                <div className="w-px h-6 bg-gray-200 self-center" />
                <div className="px-3 md:px-4 py-1 text-center">
                   <p className="text-[7px] md:text-[8px] font-black uppercase text-gray-400 mb-0.5">Orders</p>
                   <p className="text-xs md:text-sm font-black text-black">{recentOrders.length}</p>
                </div>
              </div>
              <Button onClick={onBrowseMore} className="bg-black hover:bg-zinc-800 text-white rounded-xl font-black uppercase tracking-widest text-[8px] md:text-[9px] h-8 md:h-10 px-4 md:px-6 shadow-xl shadow-zinc-100 transition-all active:scale-95">
                Market
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Dashboard Feed */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Search Bar - Enhanced */}
            <form onSubmit={handleSearch} className="bg-white p-1 rounded-2xl md:rounded-[22px] shadow-2xl shadow-gray-200/50 flex items-center border border-gray-100">
              <div className="pl-3 md:pl-4 text-gray-400">
                <Search className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </div>
              <Input 
                placeholder="Search..."
                className="border-none bg-transparent h-8 md:h-10 focus-visible:ring-0 font-bold text-gray-600 text-xs md:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-lg md:rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-100 mr-1 shrink-0">
                <Filter className="h-3.5 w-3.5" />
              </Button>
            </form>

            {/* Recommendations Grid */}
            <div>
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div>
                   <h2 className="text-base md:text-lg font-black uppercase tracking-tighter italic">Top <span className="text-purple-600">Picks</span></h2>
                   <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest">Based on browsing</p>
                </div>
                <Button variant="link" className="text-purple-600 font-bold text-[9px] md:text-[10px] p-0 h-auto" onClick={onBrowseMore}>
                  View all <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {products.length > 0 ? products.slice(0, 4).map((product) => (
                  <motion.div 
                    key={product.id}
                    whileHover={{ y: -3 }}
                    className="bg-white rounded-2xl md:rounded-[24px] p-2 md:p-3 border border-gray-100 shadow-sm group cursor-pointer"
                  >
                    <div className="relative aspect-[4/3] rounded-xl md:rounded-[18px] overflow-hidden bg-gray-50 mb-2 md:mb-3">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=500&auto=format&fit=crop';
                        }}
                      />
                      <div className="absolute top-1.5 md:top-2 right-1.5 md:right-2">
                         <Button size="icon" variant="secondary" className="h-6 w-6 md:h-7 md:w-7 rounded-full bg-white/80 backdrop-blur-md border-none shadow-sm text-gray-400 hover:text-purple-600">
                            <Heart className="h-3 w-3 md:h-3.5 md:w-3.5" />
                         </Button>
                      </div>
                      <div className="absolute bottom-1.5 md:bottom-2 left-1.5 md:left-2">
                         <Badge className="bg-purple-600 text-white font-black text-[6px] md:text-[7px] uppercase tracking-widest border-none h-3.5 md:h-4 px-1.5">
                            {product.tag || 'New'}
                         </Badge>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-black text-[10px] md:text-[11px] uppercase truncate mb-0.5">{product.name}</h3>
                      <div className="flex items-center justify-between">
                         <span className="text-purple-600 font-black text-xs md:text-sm">{formatPrice(product.price)}</span>
                         <div className="flex items-center gap-0.5 text-gray-400">
                            <Star className="h-2 w-2 md:h-2.5 md:w-2.5 fill-purple-400 text-purple-400" />
                            <span className="text-[8px] md:text-[9px] font-bold">{product.rating}</span>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                )) : (
                  <div className="col-span-2 py-6 md:py-10 text-center bg-white rounded-2xl border-2 border-dashed border-gray-100">
                     <ShoppingBag className="h-6 w-6 md:h-8 md:w-8 text-gray-200 mx-auto mb-2" />
                     <p className="text-gray-400 font-bold uppercase text-[8px] md:text-[9px] tracking-widest">Loading picks...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Promo Section */}
            <div className="bg-gradient-to-br from-zinc-900 to-black rounded-[24px] md:rounded-[32px] p-4 md:p-6 text-white relative overflow-hidden group">
               <div className="relative z-10 max-w-[70%]">
                  <Badge className="bg-purple-600 text-white font-black mb-2 md:mb-3 h-4 md:h-5 text-[8px] md:text-[10px]">Member special</Badge>
                  <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter leading-none italic mb-2 md:mb-3">Get 20% off <br /> <span className="text-purple-600">tech items</span></h3>
                  <p className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed mb-3 md:mb-4">
                    Over 100 Vivi Coins. Use code <span className="text-white font-black italic">Techsavvy</span>
                  </p>
                  <Button className="bg-white text-black font-black rounded-lg md:rounded-xl h-8 md:h-10 px-4 md:px-6 text-[8px] md:text-[10px] hover:bg-green-100 transition-all active:scale-95">
                    Claim
                  </Button>
               </div>
               <div className="absolute right-[-10px] md:right-[-15px] bottom-[-10px] md:bottom-[-15px] opacity-20 group-hover:scale-110 transition-transform duration-700">
                  <Zap className="h-32 w-32 md:h-40 md:w-40 text-purple-600 rotate-12" />
               </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-4 md:space-y-6">
            {/* Recent Orders - Mini View */}
            <Card className="rounded-3xl md:rounded-[32px] border-none shadow-2xl shadow-gray-200/50 p-3 md:p-4">
              <div className="flex items-center justify-between mb-3 md:mb-4 px-1">
                 <h3 className="font-black uppercase tracking-tighter italic text-[11px] md:text-xs">Recent <span className="text-purple-600">orders</span></h3>
                 <Clock className="h-3 w-3 md:h-3.5 md:w-3.5 text-gray-300" />
              </div>
              <div className="space-y-2 md:space-y-3">
                {recentOrders.length === 0 ? (
                  <div className="text-center py-4 md:py-6">
                     <p className="text-[8px] md:text-[9px] font-bold text-gray-300 uppercase tracking-widest">No activity</p>
                  </div>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center gap-2 p-1.5 md:p-2 rounded-lg md:rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg overflow-hidden shrink-0 border border-gray-100">
                         <img
                           src={order.productImage || (order.items?.[0]?.image)}
                           className="w-full h-full object-cover"
                           referrerPolicy="no-referrer"
                           onError={(e) => {
                             (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=500&auto=format&fit=crop';
                           }}
                         />
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-[8px] md:text-[9px] font-black uppercase truncate leading-tight group-hover:text-purple-600 transition-colors">{order.productName || order.items?.[0]?.name}</p>
                         <p className="text-[6px] md:text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{order.status || 'Pending'}</p>
                      </div>
                      <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-purple-600 transition-all translate-x-0 group-hover:translate-x-1" />
                    </div>
                  ))
                )}
                <Button variant="outline" className="w-full rounded-lg md:rounded-xl border font-black uppercase tracking-widest text-[8px] md:text-[9px] h-8 md:h-9 mt-1">
                  History
                </Button>
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 md:gap-3">
               <button onClick={() => setActiveModal('track')} className="bg-white p-3 md:p-4 rounded-[20px] md:rounded-[24px] border border-gray-100 shadow-sm text-center hover:bg-green-50 transition-colors group">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-1.5 md:mb-2 group-hover:rotate-12 transition-transform">
                     <Package className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
                  </div>
                  <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">Track</p>
               </button>
               <button onClick={() => setActiveModal('wallets')} className="bg-white p-3 md:p-4 rounded-[20px] md:rounded-[24px] border border-gray-100 shadow-sm text-center hover:bg-green-50 transition-colors group">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-100 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-1.5 md:mb-2 group-hover:rotate-12 transition-transform">
                     <CreditCard className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                  </div>
                  <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">Wallets</p>
               </button>
               <button onClick={() => setActiveModal('alerts')} className="bg-white p-3 md:p-4 rounded-[20px] md:rounded-[24px] border border-gray-100 shadow-sm text-center hover:bg-green-50 transition-colors group">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-purple-100 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-1.5 md:mb-2 group-hover:rotate-12 transition-transform">
                     <Bell className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
                  </div>
                  <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">Alerts</p>
               </button>
               <button onClick={() => setActiveModal('sell')} className="bg-white p-3 md:p-4 rounded-[20px] md:rounded-[24px] border border-gray-100 shadow-sm text-center hover:bg-zinc-900 group transition-colors">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-zinc-100 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-1.5 md:mb-2 group-hover:rotate-12 transition-transform">
                     <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-zinc-900" />
                  </div>
                  <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest group-hover:text-white transition-colors">Sell</p>
               </button>
            </div>

            {/* Community/Social Card */}
            <Card className="rounded-[24px] md:rounded-[32px] border-none shadow-2xl shadow-green-100/50 p-4 md:p-6 bg-purple-600 text-white overflow-hidden relative">
               <div className="relative z-10">
                  <Badge className="bg-white text-purple-600 border-none font-black mb-2 md:mb-3 h-4 md:h-5 text-[7px] md:text-[8px]">New feat</Badge>
                  <h4 className="text-base md:text-lg font-black uppercase tracking-tighter leading-tight mb-2 md:mb-3 italic">Win <br /> coupons</h4>
                  <div className="flex gap-1">
                     <div className="w-5 h-5 md:w-7 md:h-7 rounded-full border border-white overflow-hidden bg-gray-100">
                        <img src="https://i.pravatar.cc/150?u=1" className="w-full h-full object-cover" />
                     </div>
                     <div className="w-5 h-5 md:w-7 md:h-7 rounded-full border border-white overflow-hidden -ml-2 md:-ml-3 bg-gray-200">
                        <img src="https://i.pravatar.cc/150?u=2" className="w-full h-full object-cover" />
                     </div>
                  </div>
               </div>
               <Heart className="absolute top-[-5px] right-[-5px] h-16 w-16 md:h-24 md:w-24 text-white/10 rotate-12" />
            </Card>
          </div>
        </div>
      </div>

      {/* Track Modal */}
      <Dialog open={activeModal === 'track'} onOpenChange={() => setActiveModal('none')}>
        <DialogContent className="sm:max-w-md rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Track <span className="text-purple-600">Package</span></DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {recentOrders.length > 0 ? (
               <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {recentOrders.map(order => (
                    <div key={order.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                       <div className="flex justify-between items-center mb-3">
                          <p className="text-[10px] font-black text-gray-400 uppercase">Order #{order.id.slice(-6).toUpperCase()}</p>
                          <Badge className="bg-purple-600 text-white uppercase text-[8px] font-black">{order.status || 'Pending'}</Badge>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl border border-gray-100">
                             <Package className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-sm font-bold truncate">{order.productName || (order.items?.[0]?.name) || "Package"}</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Estimated arrival: Tomorrow</p>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            ) : (
               <div className="text-center py-10">
                  <Package className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 font-bold uppercase text-[10px]">No packages currently in transit</p>
               </div>
            )}
            <DialogFooter>
               <Button onClick={() => setActiveModal('none')} className="w-full rounded-xl bg-black text-white font-black text-xs uppercase tracking-widest h-12">Close Tracker</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wallet Modal */}
      <Dialog open={activeModal === 'wallets'} onOpenChange={() => setActiveModal('none')}>
        <DialogContent className="sm:max-w-md rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">My <span className="text-purple-600">Wallet</span></DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
             <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-8 rounded-[32px] text-white relative overflow-hidden shadow-xl shadow-purple-100">
                <div className="relative z-10">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Vivi Balance</p>
                   <h3 className="text-4xl font-black italic tracking-tighter mb-8">🪙 {profile?.points || 0} Coins</h3>
                   <div className="flex justify-between items-end">
                      <div>
                         <p className="text-[8px] font-black uppercase opacity-60">Verified Member</p>
                         <p className="text-xs font-bold">{profile?.displayName || user?.displayName || "Vivi Explorer"}</p>
                      </div>
                      <Wallet className="h-8 w-8 opacity-40" />
                   </div>
                </div>
                <div className="absolute top-[-20px] right-[-20px] bg-white/10 w-40 h-40 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10px] left-[-10px] w-20 h-20 bg-purple-400 opacity-20 rounded-full blur-2xl" />
             </div>

             <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg">
                         <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                         <p className="text-xs font-bold">Loyalty Points</p>
                         <p className="text-[10px] text-gray-400 font-medium">Earned from purchases</p>
                      </div>
                   </div>
                   <p className="font-black text-sm">+{profile?.points || 0}</p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => toast.success("Feature coming soon!")} className="rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest bg-zinc-900 text-white shadow-lg transition-all active:scale-95">Recharge</Button>
                <Button variant="outline" onClick={() => toast.info("No transaction history yet.")} className="rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest border-2 transition-all active:scale-95">History</Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alerts Modal */}
      <Dialog open={activeModal === 'alerts'} onOpenChange={() => setActiveModal('none')}>
        <DialogContent className="sm:max-w-md rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Recent <span className="text-purple-600">Alerts</span></DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
             <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex gap-3">
                <div className="bg-white p-2 rounded-xl h-fit">
                   <Zap className="h-4 w-4 text-purple-600 fill-purple-600" />
                </div>
                <div>
                   <p className="text-xs font-black uppercase tracking-tight mb-1 text-green-900">Welcome to VIP!</p>
                   <p className="text-[10px] text-green-700 font-medium leading-relaxed">You've successfully accessed the premium dashboard. Enjoy exclusive deals and zero-fee transactions.</p>
                </div>
             </div>
             <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex gap-3 opacity-60">
                <div className="bg-white p-2 rounded-xl h-fit">
                   <Bell className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                   <p className="text-xs font-black uppercase tracking-tight mb-1 text-gray-700">Security Update</p>
                   <p className="text-[10px] text-gray-500 font-medium leading-relaxed">Your 2FA has been successfully verified for secure shopping across all devices.</p>
                </div>
             </div>
             {recentOrders.length > 0 && (
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl flex gap-3">
                   <div className="bg-white p-2 rounded-xl h-fit">
                      <ShoppingBag className="h-4 w-4 text-purple-600" />
                   </div>
                   <div>
                      <p className="text-xs font-black uppercase tracking-tight mb-1 text-purple-900">New Order Alert</p>
                      <p className="text-[10px] text-purple-700 font-medium leading-relaxed">Your latest order #{recentOrders[0].id.slice(-6).toUpperCase()} is now processing.</p>
                   </div>
                </div>
             )}
          </div>
          <DialogFooter className="mt-4">
             <Button variant="ghost" onClick={() => setActiveModal('none')} className="w-full text-gray-400 font-bold uppercase text-[9px] tracking-widest">Clear all alerts</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sell Modal */}
      <Dialog open={activeModal === 'sell'} onOpenChange={() => setActiveModal('none')}>
        <DialogContent className="sm:max-w-md rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Sell on <span className="text-purple-600">Vivi</span></DialogTitle>
            <DialogDescription className="font-bold text-gray-400 uppercase text-[10px] tracking-widest">Start making money today</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
             e.preventDefault();
             toast.success("Merchant application submitted! We will contact you soon.");
             setActiveModal('none');
          }} className="space-y-6 pt-4">
             <div className="bg-zinc-900 p-8 rounded-[32px] text-white text-center relative overflow-hidden group">
                <Smartphone className="h-12 w-12 text-purple-600 mx-auto mb-4 relative z-10 group-hover:scale-110 transition-transform" />
                <h4 className="text-xl font-black mb-2 relative z-10">Become a Verified Seller</h4>
                <p className="text-xs text-gray-400 font-medium leading-relaxed relative z-10 uppercase tracking-tight">
                   List your products and reach millions of customers across the platform.
                </p>
                <div className="absolute top-[-10px] right-[-10px] opacity-10 group-hover:rotate-45 transition-transform duration-1000">
                   <Zap className="h-24 w-24 text-purple-600" />
                </div>
             </div>
             <div className="space-y-4">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Business Name</Label>
                   <Input placeholder="e.g. Wizzy Fashion Hub" required className="rounded-xl h-12 border-2 border-gray-100 focus:border-purple-500 font-bold" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Category</Label>
                   <Input placeholder="e.g. Electronics, Fashion" required className="rounded-xl h-12 border-2 border-gray-100 focus:border-purple-500 font-bold" />
                </div>
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl h-14 shadow-lg shadow-purple-100 uppercase tracking-widest text-xs transition-all active:scale-95">
                   Apply for Merchant Account
                </Button>
             </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
