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
  X
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
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/products/`);
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

    // Standard query for orders
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory to avoid index requirements for now
      const sortedOrders = orders.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      setRecentOrders(sortedOrders.slice(0, 3));
    }, (error) => {
      console.warn("Dashboard orders permission/index error:", error);
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
    <div className="bg-[#f8f9fa] min-h-screen">
      {/* Dashboard Top Area */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-xl font-black tracking-tighter italic leading-none mb-1">
                User <span className="text-purple-400">Dashboard</span>
              </h1>
              <div className="text-gray-400 font-bold  text-[9px] tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Always secure • Always discounted
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-100">
                <div className="px-4 py-1.5 text-center">
                   <p className="text-[8px] font-black uppercase text-gray-400 mb-0.5">Coins</p>
                   <p className="text-sm font-black text-purple-600">🪙 {profile?.points || 0}</p>
                </div>
                <div className="w-px h-6 bg-gray-200 self-center" />
                <div className="px-4 py-1.5 text-center">
                   <p className="text-[8px] font-black uppercase text-gray-400 mb-0.5">Orders</p>
                   <p className="text-sm font-black text-black">{recentOrders.length}</p>
                </div>
              </div>
              <Button onClick={onBrowseMore} className="bg-black hover:bg-zinc-800 text-white rounded-xl font-black  tracking-widest text-[9px] h-10 px-6 shadow-xl shadow-zinc-100">
                Go to market
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Dashboard Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Bar - Enhanced */}
            <form onSubmit={handleSearch} className="bg-white p-1.5 rounded-[22px] shadow-2xl shadow-gray-200/50 flex items-center border border-gray-100">
              <div className="pl-4 text-gray-400">
                <Search className="h-4 w-4" />
              </div>
              <Input 
                placeholder="Search for jerseys, watches, tech..."
                className="border-none bg-transparent h-10 focus-visible:ring-0 font-bold text-gray-600 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" size="icon" className="h-10 w-10 rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-100 mr-1 shrink-0">
                <Filter className="h-4 w-4" />
              </Button>
            </form>

            {/* Recommendations Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                   <h2 className="text-lg font-black  tracking-tighter italic">Top <span className="text-purple-600">Picks</span> For You</h2>
                   <p className="text-[9px] font-black text-gray-400  tracking-widest">Based on your recent browsing</p>
                </div>
                <Button variant="link" className="text-purple-600 font-bold text-[10px] p-0 h-auto" onClick={onBrowseMore}>
                  View all <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {products.length > 0 ? products.slice(0, 4).map((product) => (
                  <motion.div 
                    key={product.id}
                    whileHover={{ y: -3 }}
                    className="bg-white rounded-[24px] p-3 border border-gray-100 shadow-sm group cursor-pointer"
                  >
                    <div className="relative aspect-square rounded-[16px] overflow-hidden bg-gray-50 mb-3">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=500&auto=format&fit=crop';
                        }}
                      />
                      <div className="absolute top-2 right-2">
                         <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full bg-white/80 backdrop-blur-md border-none shadow-sm text-gray-400 hover:text-purple-600">
                            <Heart className="h-3.5 w-3.5" />
                         </Button>
                      </div>
                      <div className="absolute bottom-2 left-2">
                         <Badge className="bg-purple-600 text-white font-black text-[7px]  tracking-widest border-none h-4 px-1.5">
                            {product.tag || 'New'}
                         </Badge>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-black text-[11px]  truncate mb-0.5">{product.name}</h3>
                      <div className="flex items-center justify-between">
                         <span className="text-purple-600 font-black text-sm">{formatPrice(product.price)}</span>
                         <div className="flex items-center gap-1 text-gray-400">
                            <Star className="h-2.5 w-2.5 fill-purple-400 text-purple-400" />
                            <span className="text-[9px] font-bold">{product.rating}</span>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                )) : (
                  <div className="col-span-2 py-8 text-center bg-white rounded-2xl border-2 border-dashed border-gray-100">
                     <ShoppingBag className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                     <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">Loading picks...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Promo Section */}
            <div className="bg-gradient-to-br from-zinc-900 to-black rounded-[32px] p-4 text-white relative overflow-hidden group">
               <div className="relative z-10 max-w-[65%]">
                  <Badge className="bg-purple-600 text-white font-black mb-3 h-5 text-[9px]">Member special</Badge>
                  <h3 className="text-2xl font-black  tracking-tighter leading-none italic mb-3">Get 20% off <br /> your next <span className="text-purple-600">tech purchase</span></h3>
                  <p className="text-[9px] font-bold text-gray-400  tracking-widest leading-relaxed mb-4">
                    Valid for all members with over 100 Vivo Coins. Use code <span className="text-white font-black italic">Techsavvy</span>
                  </p>
                  <Button className="bg-white text-black font-black rounded-xl h-10 px-6 text-[10px] hover:bg-green-100 transition-all active:scale-95">
                    Claim voucher
                  </Button>
               </div>
               <div className="absolute right-[-15px] bottom-[-15px] opacity-20 group-hover:scale-110 transition-transform duration-700">
                  <Zap className="h-48 w-48 text-purple-600 rotate-12" />
               </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Recent Orders - Mini View */}
            <Card className="rounded-[32px] border-none shadow-2xl shadow-gray-200/50 p-4">
              <div className="flex items-center justify-between mb-4 px-1">
                 <h3 className="font-black  tracking-tighter italic text-xs">Recent <span className="text-purple-600">orders</span></h3>
                 <Clock className="h-3.5 w-3.5 text-gray-300" />
              </div>
              <div className="space-y-3">
                {recentOrders.length === 0 ? (
                  <div className="text-center py-6">
                     <p className="text-[9px] font-bold text-gray-300  tracking-widest">No recent activity</p>
                  </div>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className="w-10 h-10 bg-white rounded-lg overflow-hidden shrink-0 border border-gray-100">
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
                         <p className="text-[9px] font-black  truncate leading-tight group-hover:text-purple-600 transition-colors">{order.productName || order.items?.[0]?.name}</p>
                         <p className="text-[7px] font-bold text-gray-400  tracking-widest mt-0.5 uppercase">{order.status || 'Pending'}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-purple-600 transition-all translate-x-0 group-hover:translate-x-1" />
                    </div>
                  ))
                )}
                <Button variant="outline" className="w-full rounded-xl border-2 font-black  tracking-widest text-[9px] h-9 mt-1">
                  View all history
                </Button>
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
               <button onClick={() => setActiveModal('track')} className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm text-center hover:bg-green-50 transition-colors group">
                  <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:rotate-12 transition-transform">
                     <Package className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-[8px] font-black  tracking-widest">Track pack</p>
               </button>
               <button onClick={() => setActiveModal('wallets')} className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm text-center hover:bg-green-50 transition-colors group">
                  <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:rotate-12 transition-transform">
                     <CreditCard className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-[8px] font-black  tracking-widest">Wallets</p>
               </button>
               <button onClick={() => setActiveModal('alerts')} className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm text-center hover:bg-green-50 transition-colors group">
                  <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:rotate-12 transition-transform">
                     <Bell className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-[8px] font-black  tracking-widest">Alerts</p>
               </button>
               <button onClick={() => setActiveModal('sell')} className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm text-center hover:bg-zinc-900 group transition-colors">
                  <div className="w-8 h-8 bg-zinc-100 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:rotate-12 transition-transform">
                     <TrendingUp className="h-4 w-4 text-zinc-900" />
                  </div>
                  <p className="text-[8px] font-black  tracking-widest group-hover:text-white transition-colors">Sell items</p>
               </button>
            </div>

            {/* Community/Social Card */}
            <Card className="rounded-[32px] border-none shadow-2xl shadow-green-100/50 p-6 bg-purple-600 text-white overflow-hidden relative">
               <div className="relative z-10">
                  <Badge className="bg-white text-purple-600 border-none font-black mb-3 h-5 text-[8px]">New feat</Badge>
                  <h4 className="text-lg font-black  tracking-tighter leading-tight mb-3 italic">Invite friends <br /> win coupons</h4>
                  <div className="flex gap-1.5">
                     <div className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-gray-100">
                        <img src="https://i.pravatar.cc/150?u=1" className="w-full h-full object-cover" />
                     </div>
                     <div className="w-6 h-6 rounded-full border-2 border-white overflow-hidden -ml-3 bg-gray-200">
                        <img src="https://i.pravatar.cc/150?u=2" className="w-full h-full object-cover" />
                     </div>
                     <div className="w-6 h-6 rounded-full border-2 border-white overflow-hidden -ml-3 bg-purple-400 flex items-center justify-center text-[7px] font-black">
                        +12k
                     </div>
                  </div>
               </div>
               <Heart className="absolute top-[-10px] right-[-10px] h-24 w-24 text-white/10 rotate-12" />
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
               <div className="space-y-4">
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
                          <div>
                             <p className="text-sm font-bold truncate">{order.productName || "Multiple Items"}</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase">Estimated arrival: Tomorrow</p>
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
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Vivo Balance</p>
                   <h3 className="text-4xl font-black italic tracking-tighter mb-8">🪙 {profile?.points || 0} Coins</h3>
                   <div className="flex justify-between items-end">
                      <div>
                         <p className="text-[8px] font-black uppercase opacity-60">Verified Member</p>
                         <p className="text-xs font-bold">{user?.displayName || "Vivo Explorer"}</p>
                      </div>
                      <Wallet className="h-8 w-8 opacity-40" />
                   </div>
                </div>
                <div className="absolute top-[-20px] right-[-20px] bg-white/10 w-40 h-40 rounded-full blur-3xl" />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <Button className="rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest bg-zinc-900 text-white">Recharge</Button>
                <Button variant="outline" className="rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest border-2">Transactions</Button>
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
                <Zap className="h-5 w-5 text-purple-600 shrink-0" />
                <div>
                   <p className="text-xs font-bold text-black leading-tight mb-1">Welcome to the VIP Dashboard!</p>
                   <p className="text-[10px] text-gray-500 font-medium">You now have access to exclusive member-only tech deals.</p>
                </div>
             </div>
             <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex gap-3 opacity-60">
                <Bell className="h-5 w-5 text-gray-400 shrink-0" />
                <div>
                   <p className="text-xs font-bold text-black leading-tight mb-1">Security Update</p>
                   <p className="text-[10px] text-gray-500 font-medium">Your 2FA has been successfully verified for secure shopping.</p>
                </div>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sell Modal */}
      <Dialog open={activeModal === 'sell'} onOpenChange={() => setActiveModal('none')}>
        <DialogContent className="sm:max-w-md rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Sell on <span className="text-purple-600">Vivo</span></DialogTitle>
            <DialogDescription className="font-bold text-gray-400 uppercase text-[10px] tracking-widest">Start making money today</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
             <div className="bg-zinc-900 p-8 rounded-[32px] text-white text-center">
                <Smartphone className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h4 className="text-xl font-black mb-2">Become a Verified Seller</h4>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                   List your products and reach millions of customers across the platform.
                </p>
             </div>
             <div className="space-y-4">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-gray-400">Business Name</Label>
                   <Input placeholder="Enter your shop name" className="rounded-xl h-12" />
                </div>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl h-14 shadow-lg shadow-purple-100">
                   Apply for Merchant Account
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
