import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  Trash2, 
  Plus, 
  Package, 
  ShoppingCart, 
  Mail, 
  Zap, 
  Eye, 
  TrendingUp, 
  Users, 
  Search,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  BarChart3,
  Edit,
  ArrowRight,
  TrendingDown
} from 'lucide-react';

export default function AdminDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    activeCustomers: 0,
    avgOrderValue: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const pSnap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
      const productsData = pSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setProducts(productsData);

      const oSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
      const ordersData = oSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setOrders(ordersData);

      const nSnap = await getDocs(query(collection(db, 'notifications'), orderBy('createdAt', 'desc')));
      setNotifications(nSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)));

      // Calculate Stats
      const totalSales = ordersData.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
      const uniqueCustomers = new Set(ordersData.map(o => o.userId)).size;
      
      setStats({
        totalSales,
        totalOrders: ordersData.length,
        activeCustomers: uniqueCustomers,
        avgOrderValue: ordersData.length > 0 ? totalSales / ordersData.length : 0
      });

      // Prepare Chart Data (last 7 days)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString(undefined, { weekday: 'short' });
      }).reverse();

      const salesByDay = last7Days.map(day => {
        const dailyOrders = ordersData.filter(o => 
          o.createdAt?.toDate().toLocaleDateString(undefined, { weekday: 'short' }) === day
        );
        return {
          name: day,
          sales: dailyOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
          orders: dailyOrders.length
        };
      });
      setChartData(salesByDay);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const updatedProduct = {
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      oldPrice: formData.get('oldPrice') ? parseFloat(formData.get('oldPrice') as string) : null,
      stock: parseInt(formData.get('stock') as string) || 0,
      category: formData.get('category') as string,
      image: formData.get('image') as string,
      tag: formData.get('tag') as string,
      sold: formData.get('sold') as string,
    };

    try {
      await updateDoc(doc(db, 'products', editingProduct.id), updatedProduct);
      toast.success('Product updated successfully!');
      setEditingProduct(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to update status: " + error.message);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 capitalize"><Clock className="w-3 h-3 mr-1" /> {status}</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 capitalize"><Zap className="w-3 h-3 mr-1" /> {status}</Badge>;
      case 'shipped':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 capitalize"><Truck className="w-3 h-3 mr-1" /> {status}</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 capitalize"><CheckCircle2 className="w-3 h-3 mr-1" /> {status}</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 capitalize"><XCircle className="w-3 h-3 mr-1" /> {status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const newProduct = {
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      oldPrice: formData.get('oldPrice') ? parseFloat(formData.get('oldPrice') as string) : null,
      stock: parseInt(formData.get('stock') as string) || 0,
      category: formData.get('category') as string,
      image: formData.get('image') as string,
      tag: formData.get('tag') as string,
      sold: formData.get('sold') as string,
      rating: 5.0,
      reviews: 0,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'products'), newProduct);
      toast.success('Product added successfully!');
      e.currentTarget.reset();
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-orange-600 p-3 rounded-2xl shadow-lg shadow-orange-200">
            <Zap className="h-8 w-8 text-white fill-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-black text-black uppercase italic tracking-tighter">Admin <span className="text-orange-600">Dashboard</span></h1>
            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Manage your store products and orders</p>
          </div>
          <div className="relative w-64 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search products or orders..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-gray-200 focus:border-orange-500 transition-all bg-white"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="rounded-3xl border-none shadow-lg shadow-gray-200/50 bg-gradient-to-br from-white to-orange-50/30">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Total Revenue</p>
              <h3 className="text-2xl font-black italic tracking-tighter text-black">${stats.totalSales.toFixed(2)}</h3>
              <div className="mt-2 flex items-center text-[10px] text-green-600 font-bold">
                +12.5% from last month
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-none shadow-lg shadow-gray-200/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Total Orders</p>
              <h3 className="text-2xl font-black italic tracking-tighter text-black">{stats.totalOrders}</h3>
              <div className="mt-2 flex items-center text-[10px] text-blue-600 font-bold">
                +8 new today
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-none shadow-lg shadow-gray-200/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Active Customers</p>
              <h3 className="text-2xl font-black italic tracking-tighter text-black">{stats.activeCustomers}</h3>
              <div className="mt-2 flex items-center text-[10px] text-purple-600 font-bold">
                Across all categories
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-none shadow-lg shadow-gray-200/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-green-100 rounded-xl">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Avg Order Value</p>
              <h3 className="text-2xl font-black italic tracking-tighter text-black">${stats.avgOrderValue.toFixed(2)}</h3>
              <div className="mt-2 flex items-center text-[10px] text-green-600 font-bold">
                Optimized performance
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="rounded-xl font-black uppercase tracking-tighter px-6 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="products" className="rounded-xl font-black uppercase tracking-tighter px-6 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              <Package className="h-4 w-4 mr-2" /> Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl font-black uppercase tracking-tighter px-6 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              <ShoppingCart className="h-4 w-4 mr-2" /> Orders
            </TabsTrigger>
            <TabsTrigger value="emails" className="rounded-xl font-black uppercase tracking-tighter px-6 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              <Mail className="h-4 w-4 mr-2" /> Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 rounded-3xl border-none shadow-xl shadow-gray-200/50">
                <CardHeader>
                  <CardTitle className="text-xl font-black uppercase tracking-tighter">Growth Metrics</CardTitle>
                  <CardDescription>Performance review for the current week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ fontWeight: 800 }}
                        />
                        <Area type="monotone" name="Revenue ($)" dataKey="sales" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                        <Area type="monotone" name="Orders Count" dataKey="orders" stroke="#2563eb" strokeWidth={3} fillOpacity={0.1} fill="#dbeafe" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-none shadow-xl shadow-gray-200/50 flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl font-black uppercase tracking-tighter">Inventory Health</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center items-center text-center pb-12">
                   <div className="w-40 h-40 relative flex items-center justify-center">
                     <svg className="w-full h-full transform -rotate-90">
                       <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="15" fill="none"></circle>
                       <circle cx="80" cy="80" r="70" stroke="#ea580c" strokeWidth="15" fill="none" strokeDasharray="440" strokeDashoffset={440 - (440 * (products.length / 500))}></circle>
                     </svg>
                     <div className="absolute flex flex-col items-center">
                        <span className="text-3xl font-black">{products.length}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Items</span>
                     </div>
                   </div>
                   <p className="mt-6 text-sm font-bold text-gray-600">Inventory capacity at <span className="text-orange-600">{(products.length / 5).toFixed(1)}%</span></p>
                   <p className="text-[10px] text-gray-400 font-medium">Optimal storage detected</p>
                </CardContent>
              </Card>

              <Card className="lg:col-span-1 rounded-3xl border-none shadow-xl shadow-gray-200/50">
                <CardHeader>
                  <CardTitle className="text-xl font-black uppercase tracking-tighter">Recent Activities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Top Product Spotlight */}
                  {products.length > 0 && (
                    <div className="mb-6 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                      <p className="text-[10px] font-black uppercase text-orange-600 tracking-widest mb-3">Top Performing Product</p>
                      <div className="flex gap-3">
                        <img 
                          src={[...products].sort((a,b) => parseFloat(b.sold?.replace('k+', '1000') || '0') - parseFloat(a.sold?.replace('k+', '1000') || '0'))[0]?.image} 
                          className="w-12 h-12 rounded-lg object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-sm font-black truncate w-32">{[...products].sort((a,b) => parseFloat(b.sold?.replace('k+', '1000') || '0') - parseFloat(a.sold?.replace('k+', '1000') || '0'))[0]?.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 capitalize">{[...products].sort((a,b) => parseFloat(b.sold?.replace('k+', '1000') || '0') - parseFloat(a.sold?.replace('k+', '1000') || '0'))[0]?.sold} Sold</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {orders.slice(0, 5).map((o, i) => (
                    <div key={o.id} className="flex items-center gap-4">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <ShoppingCart className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold truncate">{o.customerEmail}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-black">Placed Order #${o.id.slice(-4).toUpperCase()}</p>
                      </div>
                      <p className="font-black text-sm text-orange-600">${o.totalAmount?.toFixed(2)}</p>
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full text-orange-600 font-bold uppercase tracking-tighter text-xs h-10 hover:bg-orange-50" onClick={() => setActiveTab('orders')}>
                    View All Orders <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Add Product Form */}
              <Card className="lg:col-span-1 rounded-3xl border-none shadow-xl shadow-gray-200/50">
                <CardHeader>
                  <CardTitle className="text-xl font-black uppercase tracking-tighter">Add New Product</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input id="name" name="name" required className="rounded-xl border-2 focus:border-orange-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price ($)</Label>
                        <Input id="price" name="price" type="number" step="0.01" required className="rounded-xl border-2 focus:border-orange-500" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="oldPrice">Old Price ($)</Label>
                        <Input id="oldPrice" name="oldPrice" type="number" step="0.01" className="rounded-xl border-2 focus:border-orange-500" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input id="category" name="category" required className="rounded-xl border-2 focus:border-orange-500" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="image">Image URL</Label>
                      <Input id="image" name="image" required className="rounded-xl border-2 focus:border-orange-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tag">Tag (e.g. -50%)</Label>
                        <Input id="tag" name="tag" className="rounded-xl border-2 focus:border-orange-500" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stock">Available Stock</Label>
                        <Input id="stock" name="stock" type="number" defaultValue="100" required className="rounded-xl border-2 focus:border-orange-500" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sold">Sold Count (e.g. 5k+)</Label>
                      <Input id="sold" name="sold" className="rounded-xl border-2 focus:border-orange-500" />
                    </div>
                    <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl h-12 mt-4" disabled={isLoading}>
                      <Plus className="h-5 w-5 mr-2" /> {isLoading ? 'Adding...' : 'ADD PRODUCT'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Product List */}
              <Card className="lg:col-span-2 rounded-3xl border-none shadow-xl shadow-gray-200/50 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl font-black uppercase tracking-tighter">Product Inventory</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-black uppercase text-[10px] tracking-widest">Product</TableHead>
                          <TableHead className="font-black uppercase text-[10px] tracking-widest">Category</TableHead>
                          <TableHead className="font-black uppercase text-[10px] tracking-widest">Price</TableHead>
                          <TableHead className="font-black uppercase text-[10px] tracking-widest">Stock</TableHead>
                          <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((p) => (
                          <TableRow key={p.id} className="hover:bg-orange-50/30 transition-colors">
                            <TableCell className="font-bold">
                              <div className="flex items-center gap-3">
                                <img src={p.image} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                                <span>{p.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-500 font-medium">{p.category}</TableCell>
                            <TableCell className="font-black text-orange-600">${p.price}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${p.stock < 10 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'} font-bold`}>
                                {p.stock || 0} left
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Dialog open={editingProduct?.id === p.id} onOpenChange={(open) => !open && setEditingProduct(null)}>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setEditingProduct(p)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="rounded-3xl">
                                    <DialogHeader>
                                      <DialogTitle className="text-xl font-black uppercase tracking-tighter">Edit Product</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleUpdateProduct} className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-name">Product Name</Label>
                                        <Input id="edit-name" name="name" defaultValue={p.name} required className="rounded-xl" />
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-price">Price ($)</Label>
                                          <Input id="edit-price" name="price" type="number" step="0.01" defaultValue={p.price} required className="rounded-xl" />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-oldPrice">Old Price ($)</Label>
                                          <Input id="edit-oldPrice" name="oldPrice" type="number" step="0.01" defaultValue={p.oldPrice} className="rounded-xl" />
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-category">Category</Label>
                                        <Input id="edit-category" name="category" defaultValue={p.category} required className="rounded-xl" />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-image">Image URL</Label>
                                        <Input id="edit-image" name="image" defaultValue={p.image} required className="rounded-xl" />
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-tag">Tag</Label>
                                          <Input id="edit-tag" name="tag" defaultValue={p.tag} className="rounded-xl" />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-stock">Stock (Restock)</Label>
                                          <Input id="edit-stock" name="stock" type="number" defaultValue={p.stock || 0} required className="rounded-xl border-orange-200 focus:border-orange-500" />
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-sold">Sold</Label>
                                        <Input id="edit-sold" name="sold" defaultValue={p.sold} className="rounded-xl" />
                                      </div>
                                      <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl h-12" disabled={isLoading}>
                                        {isLoading ? 'SAVING...' : 'SAVE CHANGES'}
                                      </Button>
                                    </form>
                                  </DialogContent>
                                </Dialog>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="rounded-3xl border-none shadow-xl shadow-gray-200/50 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tighter">Sales Orders</CardTitle>
                  <CardDescription>Real-time stream of customer transactions</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">Order ID</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">Customer</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">Address</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">Total</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">Date</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((o) => (
                      <TableRow key={o.id} className="group hover:bg-orange-50/30 transition-colors">
                        <TableCell className="font-mono text-[10px] text-gray-500">#{o.id.slice(-6).toUpperCase()}</TableCell>
                        <TableCell className="font-bold text-sm">
                          {o.customerEmail}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          <span className="text-xs text-gray-500 font-medium">
                            {o.shippingAddress?.address}, {o.shippingAddress?.city}
                          </span>
                        </TableCell>
                        <TableCell className="font-black text-orange-600">${o.totalAmount?.toFixed(2)}</TableCell>
                        <TableCell>
                          {getStatusBadge(o.status)}
                        </TableCell>
                        <TableCell className="text-gray-500 text-xs font-medium">
                          {o.createdAt?.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 rounded-lg font-bold border-2" onClick={() => setSelectedOrder(o)}>
                                  <Eye className="h-3 w-3 mr-1" /> VIEW
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md rounded-3xl">
                                <DialogHeader>
                                  <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Order <span className="text-orange-600">Details</span></DialogTitle>
                                </DialogHeader>
                                {selectedOrder && (
                                  <div className="space-y-6">
                                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                                      <div>
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Order ID</p>
                                        <p className="font-bold text-sm">{selectedOrder.id}</p>
                                      </div>
                                      {getStatusBadge(selectedOrder.status)}
                                    </div>

                                    <div className="space-y-4">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                          <Mail className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                          <p className="text-xs font-black uppercase text-gray-400">Customer</p>
                                          <p className="font-medium text-sm">{selectedOrder.customerEmail}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-50 rounded-lg">
                                          <Truck className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div>
                                          <p className="text-xs font-black uppercase text-gray-400">Shipping Address</p>
                                          <p className="font-medium text-sm">
                                            {selectedOrder.shippingAddress?.address}<br/>
                                            {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.zipCode}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <p className="text-xs font-black uppercase text-gray-400 mb-3">Order Items</p>
                                      <div className="space-y-3">
                                        {selectedOrder.items?.map((item: any, idx: number) => (
                                          <div key={idx} className="flex justify-between items-center p-3 border rounded-xl">
                                            <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-[10px] font-bold">
                                                {item.quantity}x
                                              </div>
                                              <p className="font-bold text-sm">{item.name}</p>
                                            </div>
                                            <p className="font-black text-orange-600">{item.price}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="pt-4 border-t border-dashed flex justify-between items-end">
                                      <div>
                                        <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Update Status</p>
                                        <Select 
                                          defaultValue={selectedOrder.status} 
                                          onValueChange={(val) => handleUpdateOrderStatus(selectedOrder.id, val)}
                                        >
                                          <SelectTrigger className="w-[180px] rounded-xl font-bold">
                                            <SelectValue placeholder="Status" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="processing">Processing</SelectItem>
                                            <SelectItem value="shipped">Shipped</SelectItem>
                                            <SelectItem value="delivered">Delivered</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs font-black uppercase text-gray-400">Total Paid</p>
                                        <p className="text-3xl font-black text-orange-600 tracking-tighter">${selectedOrder.totalAmount?.toFixed(2)}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredOrders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-20">
                          <div className="flex flex-col items-center gap-2 text-gray-400">
                            <ShoppingCart className="h-10 w-10 opacity-20" />
                            <p className="font-bold italic">No matching orders found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emails">
            <Card className="rounded-3xl border-none shadow-xl shadow-gray-200/50 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-black uppercase tracking-tighter">Email Notification Logs</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">Type</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">Recipient</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((n) => (
                      <TableRow key={n.id}>
                        <TableCell className="font-bold text-orange-600 uppercase text-xs">{n.type.replace('_', ' ')}</TableCell>
                        <TableCell className="font-medium">{n.email}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-black uppercase">
                            Sent
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-500 text-xs">
                          {n.createdAt?.toDate().toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {notifications.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-gray-400 font-bold">No email logs yet</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
