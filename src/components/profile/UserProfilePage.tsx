import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  User, 
  Package, 
  CreditCard, 
  MapPin, 
  Settings, 
  LogOut, 
  ChevronRight, 
  ShoppingBag,
  Bell,
  Heart,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Plus,
  Zap,
  Trophy,
  Truck,
  Ticket,
  Headset,
  LayoutDashboard,
  AlertCircle
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { signOut } from 'firebase/auth';
import PaymentMethods from '@/components/auth/PaymentMethods';
import { useCurrency } from '@/lib/CurrencyContext';
import { cn } from '@/lib/utils';

interface UserProfilePageProps {
  onClose: () => void;
  onSwitchToAdmin?: () => void;
}

export default function UserProfilePage({ onClose, onSwitchToAdmin }: UserProfilePageProps) {
  const { user, profile, isAdmin } = useAuth();
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile?.displayName || user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("UserProfilePage orders error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'addresses'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAddresses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: name,
        updatedAt: serverTimestamp(),
      });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const addressData = {
      street: formData.get('street') as string,
      city: formData.get('city') as string,
      zipCode: formData.get('zipCode') as string,
      country: formData.get('country') as string,
      type: formData.get('type') as string,
      isDefault: formData.get('isDefault') === 'on',
      createdAt: serverTimestamp(),
    };

    try {
      if (currentAddress) {
        await updateDoc(doc(db, 'users', user.uid, 'addresses', currentAddress.id), addressData);
        toast.success('Address updated successfully!');
      } else {
        await addDoc(collection(db, 'users', user.uid, 'addresses'), addressData);
        toast.success('Address added successfully!');
      }
      setIsAddressModalOpen(false);
      setCurrentAddress(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user || !window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'addresses', id));
      toast.success('Address deleted');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'shipped': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-20">
      {/* Header Profile Info */}
      <div className="bg-white border-b border-gray-100 pt-10 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <div className="w-32 h-32 bg-purple-600 rounded-full flex items-center justify-center text-5xl font-black text-white shadow-2xl shadow-purple-100 group-hover:scale-105 transition-transform">
                {profile?.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-100">
                <Settings className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                <h1 className="text-4xl font-black text-black uppercase tracking-tighter italic">
                  {profile?.displayName || 'Welcome Back!'}
                </h1>
                <Badge className="w-fit mx-auto md:mx-0 bg-zinc-900 text-white font-black uppercase tracking-widest text-[10px]">
                  {profile?.role || 'Member'}
                </Badge>
              </div>
              <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mb-6">{user.email}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <Button variant="outline" className="rounded-xl border-2 font-bold px-6 h-11" onClick={onClose}>
                  Back to Store
                </Button>
                {isAdmin && (
                  <Button 
                    onClick={onSwitchToAdmin}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-600 font-bold rounded-xl px-6 h-11 border-2 border-purple-200"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" /> Admin Dashboard
                  </Button>
                )}
                <Button 
                  onClick={() => signOut(auth).then(() => onClose())}
                  className="bg-black hover:bg-zinc-800 text-white font-bold rounded-xl px-6 h-11"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Log Out
                </Button>
              </div>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-6 rounded-3xl border border-green-100 text-center w-40">
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Total Orders</p>
                <p className="text-3xl font-black text-black tracking-tighter">{orders.length}</p>
              </div>
              <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 text-center w-40 relative overflow-hidden group">
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1 z-10 relative">Shopsy Coins 🪙</p>
                <p className="text-3xl font-black text-black tracking-tighter z-10 relative">{profile?.points || 0}</p>
                <div className="absolute bottom-[-10px] right-[-10px] opacity-10 group-hover:scale-110 transition-transform">
                   <Trophy className="h-20 w-20 text-purple-600 rotate-12" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <Tabs defaultValue="orders" className="space-y-8">
          <TabsList className="bg-white p-1.5 rounded-2xl shadow-xl shadow-gray-200/50 flex-wrap h-auto gap-1 border border-gray-50">
            <TabsTrigger value="orders" className="rounded-xl font-black uppercase tracking-tighter px-8 h-12 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Package className="h-4 w-4 mr-2" /> Order History
            </TabsTrigger>
            <TabsTrigger value="details" className="rounded-xl font-black uppercase tracking-tighter px-8 h-12 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <User className="h-4 w-4 mr-2" /> My Details
            </TabsTrigger>
            <TabsTrigger value="payment" className="rounded-xl font-black uppercase tracking-tighter px-8 h-12 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <CreditCard className="h-4 w-4 mr-2" /> Payment & Addresses
            </TabsTrigger>
            <TabsTrigger value="vouchers" className="rounded-xl font-black uppercase tracking-tighter px-8 h-12 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Ticket className="h-4 w-4 mr-2" /> Vouchers
            </TabsTrigger>
            <TabsTrigger value="help" className="rounded-xl font-black uppercase tracking-tighter px-8 h-12 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Headset className="h-4 w-4 mr-2" /> Help Center
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <div className="space-y-6">
              {orders.length === 0 ? (
                <Card className="rounded-[40px] border-none shadow-xl shadow-gray-200/50 py-20 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="h-10 w-10 text-gray-200" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">No orders yet</h3>
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-8">Start shopping to see your history</p>
                  <Button onClick={onClose} className="bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl px-10 h-14 shadow-xl shadow-purple-100">
                    EXPLORE PRODUCTS
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {orders.map((order) => (
                    <Card key={order.id} className="rounded-[32px] border-none shadow-xl shadow-gray-200/50 overflow-hidden group hover:scale-[1.01] transition-all">
                      <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order ID</p>
                            <h4 className="font-black text-sm uppercase tracking-tighter">#{order.id.slice(-8).toUpperCase()}</h4>
                          </div>
                          <Badge className={`${getStatusColor(order.status || 'Pending')} border-none font-black text-[10px] uppercase tracking-wider`}>
                            {order.status || 'Pending'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 overflow-hidden">
                             <img src={order.productImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-black text-sm uppercase leading-tight mb-1">{order.productName}</h5>
                            <p className="text-xs text-gray-500 font-bold">Qty: {order.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-purple-600 tracking-tighter">{formatPrice(order.totalAmount)}</p>
                          </div>
                        </div>

                        {/* Tracking Timeline */}
                        <div className="mb-6">
                           <div className="flex items-center justify-between relative">
                              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-100 -translate-y-1/2 z-0" />
                              <div className={`absolute top-1/2 left-0 h-[2px] bg-purple-600 -translate-y-1/2 transition-all duration-1000 z-0 ${
                                order.status === 'delivered' ? 'w-full' : 
                                order.status === 'shipped' ? 'w-2/3' : 
                                order.status === 'processing' ? 'w-1/3' : 'w-0'
                              }`} />
                              
                              {[
                                { label: 'Placed', icon: ShoppingBag, active: true },
                                { label: 'Process', icon: Settings, active: ['processing', 'shipped', 'delivered'].includes(order.status) },
                                { label: 'Ship', icon: Truck, active: ['shipped', 'delivered'].includes(order.status) },
                                { label: 'Done', icon: CheckCircle2, active: order.status === 'delivered' }
                              ].map((step, idx) => (
                                <div key={idx} className="relative z-10 flex flex-col items-center">
                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                                     step.active ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-100 text-gray-300'
                                   }`}>
                                      <step.icon className="h-4 w-4" />
                                   </div>
                                   <span className={`text-[8px] font-black uppercase mt-1 tracking-widest ${step.active ? 'text-black' : 'text-gray-300'}`}>{step.label}</span>
                                </div>
                              ))}
                           </div>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50/50 -mx-6 -mb-6 p-6 border-t border-gray-100 mt-6">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Clock className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{order.createdAt?.toDate().toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                          </div>
                          <div className="flex gap-4">
                            {order.status === 'delivered' && (
                              <Button variant="ghost" className="h-10 rounded-xl font-black uppercase text-[10px] tracking-widest text-purple-600 hover:bg-purple-600 hover:text-white border-2 border-purple-600 px-6 transition-all" onClick={onClose}>
                                 REVIEW
                              </Button>
                            )}
                            <Button variant="outline" className="h-10 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800 px-6 transition-all active:scale-95 shadow-md shadow-zinc-100" onClick={onClose}>
                               BUY AGAIN
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="details">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <Card className="rounded-[40px] border-none shadow-xl shadow-gray-200/50 p-8">
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-black uppercase tracking-tighter italic">Personal <span className="text-purple-600">Information</span></h3>
                      {!isEditing ? (
                        <Button variant="outline" type="button" onClick={() => setIsEditing(true)} className="rounded-xl font-bold">
                          Edit Profile
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                           <Button variant="ghost" type="button" onClick={() => setIsEditing(false)} className="rounded-xl font-bold">Cancel</Button>
                           <Button type="submit" disabled={loading} className="bg-purple-600 text-white rounded-xl font-bold">
                             {loading ? 'Saving...' : 'Save Changes'}
                           </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Full Name</Label>
                        <Input 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={!isEditing}
                          className="rounded-2xl border-gray-100 bg-gray-50/50 h-14 font-bold focus:border-purple-500 disabled:opacity-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Email Address</Label>
                        <Input 
                          value={user.email || ''}
                          disabled
                          className="rounded-2xl border-gray-100 bg-gray-50/50 h-14 font-bold opacity-50"
                        />
                      </div>
                    </div>
                  </form>
                </Card>

                <Card className="rounded-[40px] border-none shadow-xl shadow-gray-200/50 p-8">
                   <h3 className="text-xl font-black uppercase tracking-tighter italic mb-8">Account <span className="text-purple-600">Preferences</span></h3>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                         <div className="flex items-center gap-4">
                            <div className="bg-white p-3 rounded-xl shadow-sm">
                               <Bell className="h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                               <p className="text-sm font-black uppercase tracking-tight">Email Notifications</p>
                               <p className="text-[10px] font-bold text-gray-400">Receive weekly deals and news</p>
                            </div>
                         </div>
                         <Button variant="outline" className="rounded-lg h-8 text-[10px] font-black">ACTIVE</Button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                         <div className="flex items-center gap-4">
                            <div className="bg-white p-3 rounded-xl shadow-sm">
                               <ShieldCheck className="h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                               <p className="text-sm font-black uppercase tracking-tight">Two-Factor Auth</p>
                               <p className="text-[10px] font-bold text-gray-400">Secure your account</p>
                            </div>
                         </div>
                         <Button variant="outline" className="rounded-lg h-8 text-[10px] font-black">DISABLE</Button>
                      </div>
                   </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="rounded-[40px] border-none shadow-xl shadow-gray-200/50 p-8 bg-zinc-900 text-white overflow-hidden relative">
                   <div className="relative z-10">
                      <Badge className="bg-purple-600 text-white border-none font-black mb-4">VIP STATUS</Badge>
                      <h4 className="text-2xl font-black uppercase tracking-tighter leading-none mb-4 italic">Unlock Prime <br /> Benefits</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed mb-6">
                        Get free unlimited delivery and 10% cashback on all orders.
                      </p>
                      <Button className="w-full bg-white text-black font-black rounded-2xl h-14 hover:bg-purple-100 transition-colors">
                        ACTIVATE NOW
                      </Button>
                   </div>
                   <Zap className="absolute bottom-[-20px] right-[-20px] h-40 w-40 text-white/5 rotate-12" />
                </Card>

                <Card className="rounded-[40px] border-none shadow-xl shadow-gray-200/50 p-8">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-2xl">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verified Member</p>
                      <p className="text-sm font-black">Secure Account</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payment">
            <div className="space-y-8">
              <PaymentMethods />
              
              <Card className="rounded-[40px] border-none shadow-xl shadow-gray-200/50 p-8">
                <div className="flex justify-between items-center mb-8">
                   <div className="flex items-center gap-3">
                      <div className="bg-purple-600 p-2.5 rounded-xl shadow-lg shadow-purple-100">
                         <MapPin className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tighter italic">Shipping <span className="text-purple-600">Addresses</span></h3>
                   </div>
                   <Dialog open={isAddressModalOpen} onOpenChange={(open) => {
                     setIsAddressModalOpen(open);
                     if (!open) setCurrentAddress(null);
                   }}>
                     <DialogTrigger
                       render={(props) => (
                         <button
                           {...props}
                           className={cn(
                             buttonVariants({ variant: "outline" }),
                             "rounded-xl border-2 font-black text-xs px-6 h-11 border-gray-100 hover:border-purple-200 gap-2 bg-white transition-all"
                           )}
                         >
                           <Plus className="h-4 w-4" /> ADD NEW
                         </button>
                       )}
                     />
                     <DialogContent className="rounded-[32px] sm:max-w-[500px]">
                       <DialogHeader>
                         <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
                           {currentAddress ? 'Edit' : 'Add New'} <span className="text-purple-600">Address</span>
                         </DialogTitle>
                         <DialogDescription className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                           Enter your shipping details for faster checkout.
                         </DialogDescription>
                       </DialogHeader>
                       <form onSubmit={handleSaveAddress} className="space-y-4 mt-4">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                               <Label htmlFor="street" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Street Address</Label>
                               <Input id="street" name="street" defaultValue={currentAddress?.street} required className="rounded-xl h-12" />
                            </div>
                            <div className="space-y-2">
                               <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest text-gray-400">City</Label>
                               <Input id="city" name="city" defaultValue={currentAddress?.city} required className="rounded-xl h-12" />
                            </div>
                            <div className="space-y-2">
                               <Label htmlFor="zipCode" className="text-[10px] font-black uppercase tracking-widest text-gray-400">ZIP Code</Label>
                               <Input id="zipCode" name="zipCode" defaultValue={currentAddress?.zipCode} required className="rounded-xl h-12" />
                            </div>
                            <div className="space-y-2">
                               <Label htmlFor="country" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Country</Label>
                               <Input id="country" name="country" defaultValue={currentAddress?.country} required className="rounded-xl h-12" />
                            </div>
                            <div className="space-y-2">
                               <Label htmlFor="type" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Address Type</Label>
                               <Select name="type" defaultValue={currentAddress?.type || 'HOME'}>
                                 <SelectTrigger className="rounded-xl h-12">
                                   <SelectValue placeholder="Select type" />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="HOME">HOME</SelectItem>
                                   <SelectItem value="OFFICE">OFFICE</SelectItem>
                                   <SelectItem value="OTHER">OTHER</SelectItem>
                                 </SelectContent>
                               </Select>
                            </div>
                         </div>
                         <div className="flex items-center gap-2 mt-2">
                            <input type="checkbox" id="isDefault" name="isDefault" defaultChecked={currentAddress?.isDefault} className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                            <Label htmlFor="isDefault" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Set as default address</Label>
                         </div>
                         <DialogFooter className="mt-6">
                            <Button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl h-12 uppercase tracking-widest">
                               {loading ? 'SAVING...' : 'SAVE ADDRESS'}
                            </Button>
                         </DialogFooter>
                       </form>
                     </DialogContent>
                   </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {addresses.length === 0 ? (
                     <div className="col-span-full py-12 text-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
                        <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No shipping addresses saved yet.</p>
                     </div>
                   ) : (
                     addresses.map((addr) => (
                       <div key={addr.id} className={`p-6 rounded-3xl border-2 transition-all relative group ${addr.isDefault ? 'border-purple-500 bg-green-50/20' : 'border-gray-100 hover:border-purple-200'}`}>
                          <div className="flex items-center gap-2 mb-4">
                             {addr.isDefault && <Badge className="bg-zinc-900 text-white font-black uppercase tracking-widest text-[9px]">DEFAULT</Badge>}
                             <Badge variant="outline" className={`${addr.isDefault ? 'border-purple-500 text-purple-600' : 'border-gray-200 text-gray-400'} font-black uppercase tracking-widest text-[9px]`}>{addr.type}</Badge>
                          </div>
                          <p className="font-black text-lg mb-1">{profile?.displayName || 'Resident'}</p>
                          <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6 italic">
                            {addr.street}<br />
                            {addr.city}, {addr.country} {addr.zipCode}
                          </p>
                          <div className="flex gap-4">
                             <Button 
                                variant="link" 
                                onClick={() => {
                                  setCurrentAddress(addr);
                                  setIsAddressModalOpen(true);
                                }}
                                className="text-purple-600 p-0 font-black text-[10px] tracking-widest uppercase"
                             >
                               EDIT ADDRESS
                             </Button>
                             <Button 
                                variant="link" 
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="text-gray-300 p-0 font-black text-[10px] tracking-widest uppercase hover:text-red-500"
                             >
                               DELETE
                             </Button>
                          </div>
                       </div>
                     ))
                   )}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vouchers">
             <Card className="rounded-[40px] border-none shadow-xl shadow-gray-200/50 p-8">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic">My <span className="text-purple-600">Vouchers</span></h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Unused coupons and special discounts</p>
                  </div>
                  <Button variant="outline" className="rounded-xl border-2 font-black text-xs px-6 h-11 border-gray-100 hover:border-purple-200 gap-2">
                    <Plus className="h-4 w-4" /> ACTIVATE CODE
                  </Button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { code: 'WELCOME10', offer: '10% OFF', type: 'Platform Wide', date: 'Dec 31, 2024' },
                    { code: 'VIVO90', offer: '90% OFF', type: 'Flash Sale Only', date: 'Expiring Soon' },
                  ].map((v) => (
                    <div key={v.code} className="p-1 rounded-3xl bg-gradient-to-r from-purple-600/20 to-purple-400/20 shadow-sm overflow-hidden group">
                       <div className="bg-white rounded-[22px] p-6 flex items-center gap-6 relative">
                          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex flex-col items-center justify-center text-white shrink-0 shadow-lg shadow-purple-100">
                             <Ticket className="h-6 w-6 mb-1" />
                             <span className="text-[8px] font-black">{v.offer}</span>
                          </div>
                          <div className="flex-1">
                             <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest mb-1 italic">{v.type}</p>
                             <h4 className="font-black text-xl tracking-tighter uppercase">{v.code}</h4>
                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Expires: {v.date}</p>
                          </div>
                          <Button 
                            className="bg-black hover:bg-zinc-800 text-white font-black text-[9px] px-4 h-8 rounded-lg uppercase tracking-widest"
                            onClick={() => {
                              navigator.clipboard.writeText(v.code);
                              toast.success('Code copied to clipboard!');
                            }}
                          >
                             COPY
                          </Button>
                          <div className="absolute top-[-10px] right-[-10px] opacity-5 group-hover:scale-110 transition-transform">
                             <Zap className="h-24 w-24 text-purple-600 rotate-12" />
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
             </Card>
          </TabsContent>

          <TabsContent value="help">
             <Card className="rounded-[40px] border-none shadow-xl shadow-gray-200/50 p-8">
               <div className="text-center mb-12">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                     <Headset className="h-10 w-10 text-purple-600" />
                  </div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter italic">How can we <span className="text-purple-600">help</span>?</h2>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">24/7 Dedicated Support for Shopsy Members</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  {[
                    { title: 'Track My Order', desc: 'Real-time visibility of your shipment journey', icon: Truck },
                    { title: 'Returns & Refunds', desc: 'Easy 30-day money back guarantee process', icon: ShieldCheck },
                    { title: 'Payments & Safety', desc: 'Secure encryption for all your transactions', icon: CreditCard },
                  ].map((h, i) => (
                    <div key={i} className="p-8 rounded-[32px] border-2 border-gray-50 hover:border-purple-100 bg-white transition-all text-center cursor-pointer group">
                       <h.icon className="h-8 w-8 text-purple-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                       <h3 className="font-black uppercase tracking-tighter mb-2">{h.title}</h3>
                       <p className="text-xs text-gray-500 font-medium leading-relaxed italic">{h.desc}</p>
                    </div>
                  ))}
               </div>

               <div className="bg-zinc-900 rounded-[32px] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 border-4 border-purple-600/20">
                  <div>
                     <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 italic">Still need assistance?</h3>
                     <p className="text-gray-400 text-sm font-medium">Our agents are online and ready to chat with you right now.</p>
                  </div>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl h-16 px-10 text-lg shadow-xl shadow-purple-900 transition-all active:scale-95 flex items-center gap-3">
                     <Zap className="h-5 w-5 fill-yellow-400 text-yellow-400" /> START LIVE CHAT
                  </Button>
               </div>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
