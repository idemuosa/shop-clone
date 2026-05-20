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
import { Button, buttonVariants } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  LayoutDashboard,
  Wallet,
  TrendingDown,
  DollarSign,
  Zap,
  Plus,
  Search,
  User as UserIcon,
  TrendingUp,
  Package,
  BarChart3,
  LayoutGrid,
  ShoppingCart,
  Mail,
  ArrowRight,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Truck,
  Clock,
  XCircle,
  Image as ImageIcon
} from 'lucide-react';
import { useCurrency } from '@/lib/CurrencyContext';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [newProductImage, setNewProductImage] = useState<string>("");
  const [editProductImage, setEditProductImage] = useState<string>("");
  const [editCategoryId, setEditCategoryId] = useState<string>("");
  const [newCategoryId, setNewCategoryId] = useState<string>("");
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    activeCustomers: 0,
    avgOrderValue: 0,
    expenses: 0,
    profit: 0,
    inStock: 0,
    outOfStock: 0,
    totalStockIn: 0,
    totalStockOut: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const q = query(collection(db, 'settings'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setSettings({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        // Create default settings if not exists
        const defaultSettings = {
          bankAccountNumber: "0123456789",
          bankName: "Wema Bank / Alat",
          momoNumber: "+2348000000000",
          expenses: 500, // Hardcoded default for demo
        };
        const ref = await addDoc(collection(db, 'settings'), defaultSettings);
        setSettings({ id: ref.id, ...defaultSettings });
      }
    } catch (e) {
      console.error("Error fetching settings:", e);
    }
  };

  const fetchData = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const timestamp = Date.now();

      // Fetch Products from Python API with cache busting
      const pRes = await fetch(`${apiUrl}/products/?t=${timestamp}`);
      if (!pRes.ok) throw new Error('Failed to fetch products');
      const productsData = await pRes.json();

      const mappedProducts = Array.isArray(productsData) ? productsData.map((p: any) => ({
        ...p,
        price: p.price?.toString() || '0',
        oldPrice: p.old_price ? p.old_price.toString() : undefined,
        stock: p.stock || 0,
        sold: p.sold || 0,
        category: p.category_name || 'General'
      })) : [];
      setProducts(mappedProducts);

      // Fetch Categories from Python API
      const cRes = await fetch(`${apiUrl}/categories/`);
      if (cRes.ok) {
        const categoriesData = await cRes.json();
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      }

      // Orders and Notifications still in Firestore
      let ordersData: any[] = [];
      try {
        const oSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
        ordersData = oSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        setOrders(ordersData);
      } catch (e: any) {
        console.warn("Orders fetch permission error:", e);
        setOrders([]);
      }

      try {
        const nSnap = await getDocs(query(collection(db, 'notifications'), orderBy('createdAt', 'desc')));
        setNotifications(nSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
      } catch (e: any) {
        console.warn("Notifications fetch permission error:", e);
        setNotifications([]);
      }

      // Fetch Users
      try {
        const uSnap = await getDocs(query(collection(db, 'users')));
        setUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
      } catch (e: any) {
        console.warn("Users fetch permission error:", e);
        setUsers([]);
      }

      // Fetch Expenses from settings (or calculated)
      const currentExpenses = settings?.expenses || 0;

      // Calculate Stats
      const totalSales = ordersData.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
      const uniqueCustomers = new Set(ordersData.map(o => o.userId)).size;
      const profit = totalSales - currentExpenses;

      const inStock = mappedProducts.filter((p: any) => (p.stock || 0) > 0).length;
      const outOfStock = mappedProducts.filter((p: any) => (p.stock || 0) <= 0).length;
      const totalStockIn = mappedProducts.reduce((acc: number, p: any) => acc + (p.stock || 0), 0);
      const totalStockOut = mappedProducts.reduce((acc: number, p: any) => acc + (p.sold || 0), 0);

      setStats({
        totalSales,
        totalOrders: ordersData.length,
        activeCustomers: uniqueCustomers,
        avgOrderValue: ordersData.length > 0 ? totalSales / ordersData.length : 0,
        expenses: currentExpenses,
        profit,
        inStock,
        outOfStock,
        totalStockIn,
        totalStockOut
      });

      // Prepare Chart Data (last 7 days)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString(undefined, { weekday: 'short' });
      }).reverse();

      const salesByDay = last7Days.map(day => {
        const dailyOrders = ordersData.filter(o => {
          if (!o.createdAt) return false;
          try {
            const date = typeof o.createdAt.toDate === 'function' ? o.createdAt.toDate() : new Date(o.createdAt);
            return date.toLocaleDateString(undefined, { weekday: 'short' }) === day;
          } catch (e) {
            return false;
          }
        });
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

  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryImage, setNewCategoryImage] = useState("");

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    try {
      const response = await fetch(`${apiUrl}/categories/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, image: newCategoryImage }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Failed to create category');
      }

      toast.success('Category created successfully!');
      setShowCategoryDialog(false);
      setNewCategoryName("");
      setNewCategoryImage("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!settings) return;
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

    const updatedSettings = {
      bankAccountNumber: formData.get('bankAccountNumber') as string,
      bankName: formData.get('bankName') as string,
      momoNumber: formData.get('momoNumber') as string,
      expenses: parseFloat(formData.get('expenses') as string) || 0,
    };

    try {
      await updateDoc(doc(db, 'settings', settings.id), updatedSettings);
      toast.success('Settings updated successfully!');
      fetchSettings();
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'new' | 'edit') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;

        // Compress image before saving to state
        const img = new Image();
        img.src = base64String;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          if (type === 'new') setNewProductImage(compressedBase64);
          else setEditProductImage(compressedBase64);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const oldPriceStr = formData.get('oldPrice') as string;
    const stockStr = formData.get('stock') as string;
    const soldStr = formData.get('sold') as string;

    const updatedProduct = {
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      old_price: oldPriceStr && oldPriceStr.trim() !== "" ? parseFloat(oldPriceStr) : null,
      stock: stockStr ? parseInt(stockStr) : 0,
      sold: soldStr ? parseInt(soldStr.replace(/[^0-9]/g, '')) : 0,
      image: editProductImage || editingProduct.image,
      tag: formData.get('tag') as string,
      description: formData.get('description') as string,
      category_id: parseInt(editCategoryId),
    };

    try {
       const response = await fetch(`${apiUrl}/products/${editingProduct.id}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(updatedProduct),
       });

       if (!response.ok) throw new Error('Update failed. Check backend endpoint.');

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
      
      // Update local state for immediate feedback in the open dialog
      setSelectedOrder((prev: any) => prev ? { ...prev, status: newStatus } : null);
      
      fetchData();
    } catch (error: any) {
      toast.error("Failed to update status: " + error.message);
    }
  };

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      toast.success(`User role updated to ${newRole}`);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to update user role: " + error.message);
    }
  };

  const filteredProducts = products.filter(p => {
    const name = String(p.name || "").toLowerCase();
    const category = String(p.category_name || p.category || "").toLowerCase();
    const queryStr = String(searchQuery || "").toLowerCase();
    return name.includes(queryStr) || category.includes(queryStr);
  });

  const filteredOrders = orders.filter(o => {
    const id = String(o.id || "").toLowerCase();
    const email = String(o.customerEmail || "").toLowerCase();
    const queryStr = String(searchQuery || "").toLowerCase();
    return id.includes(queryStr) || email.includes(queryStr);
  });

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
    const form = e.currentTarget;
    setIsLoading(true);
    const formData = new FormData(form);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const categoryId = parseInt(newCategoryId);
    if (isNaN(categoryId)) {
      toast.error("Please select a category");
      setIsLoading(false);
      return;
    }

    const oldPriceStr = formData.get('oldPrice') as string;
    const stockStr = formData.get('stock') as string;
    const soldStr = formData.get('sold') as string;

    const newProduct = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string) || 0,
      old_price: oldPriceStr && oldPriceStr.trim() !== "" ? parseFloat(oldPriceStr) : null,
      image: newProductImage,
      category_id: categoryId,
      tag: formData.get('tag') as string,
      stock: stockStr ? parseInt(stockStr) : 0,
      sold: soldStr ? parseInt(soldStr.replace(/[^0-9]/g, '')) : 0,
      is_available: true
    };

    if (!newProductImage) {
      toast.error("Please select a product image");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/products/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Failed to create product');
      }

      toast.success('Product added successfully!');
      form.reset();
      setNewProductImage("");
      setNewCategoryId("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string | number) => {
    if (!id) {
      toast.error("Invalid product id");
      return;
    }
    if (!confirm('Are you sure you want to delete this product?')) return;

    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to delete product');
      }

      toast.success('Product deleted successfully!');
      await fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-purple-600 p-3 rounded-2xl shadow-lg shadow-purple-200">
            <Zap className="h-8 w-8 text-white fill-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-black text-black italic tracking-tighter">Admin dashboard</h1>
            <p className="text-gray-500 font-bold  text-xs tracking-widest">Manage your store products and orders</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
              <DialogTrigger
                render={(props) => (
                  <button
                    {...props}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "rounded-xl border-2 font-black text-xs px-6 h-11 border-gray-100 hover:border-purple-200 gap-2 transition-all bg-white"
                    )}
                  >
                    <Plus className="h-4 w-4" /> New category
                  </button>
                )}
              />
              <DialogContent className="rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black  tracking-tighter">Add category</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cat-name">Category name</Label>
                    <Input
                      id="cat-name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      required
                      className="rounded-xl"
                      placeholder="e.g. Tech, Shoes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cat-image">Icon/Image URL</Label>
                    <Input
                      id="cat-image"
                      value={newCategoryImage}
                      onChange={(e) => setNewCategoryImage(e.target.value)}
                      required
                      className="rounded-xl"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                  <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl h-12" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create category'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <div className="relative w-64 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products or orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl border-gray-200 focus:border-purple-500 transition-all bg-white"
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="rounded-3xl border-none shadow-lg shadow-gray-200/50 bg-gradient-to-br from-white to-green-50/30">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-green-100 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <p className="text-gray-500 text-xs font-black  tracking-widest mb-1">Total revenue</p>
              <h3 className="text-2xl font-black italic tracking-tighter text-black">{formatPrice(stats.totalSales)}</h3>
              <div className="mt-2 flex items-center text-[10px] text-green-600 font-bold">
                Gross sales from orders
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-none shadow-lg shadow-gray-200/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-red-100 rounded-xl">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <p className="text-gray-500 text-xs font-black  tracking-widest mb-1">Total expenses</p>
              <h3 className="text-2xl font-black italic tracking-tighter text-black">{formatPrice(stats.expenses)}</h3>
              <div className="mt-2 flex items-center text-[10px] text-red-600 font-bold">
                Operational costs
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-none shadow-lg shadow-gray-200/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <p className="text-gray-500 text-xs font-black  tracking-widest mb-1">Profit / Loss</p>
              <h3 className={`text-2xl font-black italic tracking-tighter ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPrice(stats.profit)}
              </h3>
              <div className={`mt-2 flex items-center text-[10px] font-bold ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.profit >= 0 ? 'Surplus recorded' : 'Deficit detected'}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-none shadow-lg shadow-gray-200/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="text-gray-500 text-xs font-black  tracking-widest mb-1">Inventory flow</p>
              <h3 className="text-2xl font-black italic tracking-tighter text-black">
                <span className="text-green-600">{stats.totalStockIn}</span>
                <span className="text-gray-300 mx-1">/</span>
                <span className="text-red-500">{stats.totalStockOut}</span>
              </h3>
              <div className="mt-2 flex items-center text-[10px] text-gray-500 font-bold">
                Stock in / Stock out (total)
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="rounded-xl font-black  tracking-tighter px-8 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="products" className="rounded-xl font-black  tracking-tighter px-8 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Package className="h-4 w-4 mr-2" /> Products
            </TabsTrigger>
            <TabsTrigger value="gallery" className="rounded-xl font-black  tracking-tighter px-8 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <LayoutGrid className="h-4 w-4 mr-2" /> Gallery
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl font-black  tracking-tighter px-8 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <ShoppingCart className="h-4 w-4 mr-2" /> Orders
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl font-black  tracking-tighter px-8 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <UserIcon className="h-4 w-4 mr-2" /> Admins
            </TabsTrigger>
            <TabsTrigger value="emails" className="rounded-xl font-black  tracking-tighter px-8 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Mail className="h-4 w-4 mr-2" /> Logs
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl font-black  tracking-tighter px-8 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Wallet className="h-4 w-4 mr-2" /> Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 rounded-3xl border-none shadow-xl shadow-gray-200/50">
                <CardHeader>
                  <CardTitle className="text-xl font-black  tracking-tighter">Growth metrics</CardTitle>
                  <CardDescription>Performance review for the current week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ fontWeight: 800 }}
                        />
                        <Area type="monotone" name="Revenue ($)" dataKey="sales" stroke="#9333ea" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                        <Area type="monotone" name="Orders count" dataKey="orders" stroke="#2563eb" strokeWidth={3} fillOpacity={0.1} fill="#dbeafe" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-none shadow-xl shadow-gray-200/50 flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl font-black  tracking-tighter">Inventory health</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center items-center text-center pb-12">
                   <div className="w-40 h-40 relative flex items-center justify-center">
                     <svg className="w-full h-full transform -rotate-90">
                       <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="15" fill="none"></circle>
                       <circle cx="80" cy="80" r="70" stroke="#9333ea" strokeWidth="15" fill="none" strokeDasharray="440" strokeDashoffset={440 - (440 * (products.length / 500))}></circle>
                     </svg>
                     <div className="absolute flex flex-col items-center">
                        <span className="text-3xl font-black">{products.length}</span>
                        <span className="text-[10px] font-bold text-gray-400 ">Items</span>
                     </div>
                   </div>
                   <p className="mt-6 text-sm font-bold text-gray-600">Inventory capacity at <span className="text-purple-600">{(products.length / 5).toFixed(1)}%</span></p>
                   <p className="text-[10px] text-gray-400 font-medium">Optimal storage detected</p>
                </CardContent>
              </Card>

              <Card className="lg:col-span-1 rounded-3xl border-none shadow-xl shadow-gray-200/50">
                <CardHeader>
                  <CardTitle className="text-xl font-black  tracking-tighter">Recent activities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Top Product Spotlight */}
                  {products.length > 0 && (
                    <div className="mb-6 p-4 bg-green-50 rounded-2xl border border-green-100">
                      <p className="text-[10px] font-black  text-purple-600 tracking-widest mb-3">Top performing product</p>
                      <div className="flex gap-3">
                        <img 
                          src={[...products].sort((a,b) => (b.sold || 0) - (a.sold || 0))[0]?.image}
                          className="w-12 h-12 rounded-lg object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=500&auto=format&fit=crop';
                          }}
                        />
                        <div>
                          <p className="text-sm font-black truncate w-32">
                            {[...products].sort((a,b) => {
                              const soldA = typeof a.sold === 'string' ? parseFloat(a.sold.replace('k+', '1000')) : (a.sold || 0);
                              const soldB = typeof b.sold === 'string' ? parseFloat(b.sold.replace('k+', '1000')) : (b.sold || 0);
                              return soldB - soldA;
                            })[0]?.name}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 capitalize">
                            {[...products].sort((a,b) => {
                              const soldA = typeof a.sold === 'string' ? parseFloat(a.sold.replace('k+', '1000')) : (a.sold || 0);
                              const soldB = typeof b.sold === 'string' ? parseFloat(b.sold.replace('k+', '1000')) : (b.sold || 0);
                              return soldB - soldA;
                            })[0]?.sold} Sold
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {orders.slice(0, 5).map((o, i) => (
                    <div key={o.id} className="flex items-center gap-4">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <ShoppingCart className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold truncate">{o.customerEmail}</p>
                        <p className="text-[10px] text-gray-500  font-black">Placed order #{o.id.slice(-4).toUpperCase()}</p>
                      </div>
                      <p className="font-black text-sm text-purple-600">{formatPrice(o.totalAmount)}</p>
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full text-purple-600 font-bold  tracking-tighter text-xs h-10 hover:bg-green-50" onClick={() => setActiveTab('orders')}>
                    View all orders <ArrowRight className="ml-2 h-4 w-4" />
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
                  <CardTitle className="text-xl font-black  tracking-tighter">Add new product</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product name</Label>
                      <Input id="name" name="name" required className="rounded-xl border-2 focus:border-purple-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price ($)</Label>
                        <Input id="price" name="price" type="number" step="0.01" required className="rounded-xl border-2 focus:border-purple-500" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="oldPrice">Old price ($)</Label>
                        <Input id="oldPrice" name="oldPrice" type="number" step="0.01" className="rounded-xl border-2 focus:border-purple-500" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoryId">Category</Label>
                      <Select value={newCategoryId} onValueChange={setNewCategoryId} required>
                        <SelectTrigger className="rounded-xl border-2 w-full h-11">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="image">Product image</Label>
                      <div className="flex flex-col gap-3">
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'new')}
                          className="rounded-xl border-2 focus:border-purple-500 h-auto py-2 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                        {newProductImage && (
                          <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-gray-100 bg-gray-50">
                             <img src={newProductImage} className="w-full h-full object-cover" />
                             <Button
                               type="button"
                               variant="destructive"
                               size="icon-xs"
                               className="absolute top-2 right-2 rounded-full shadow-lg"
                               onClick={() => setNewProductImage("")}
                             >
                               <Trash2 className="h-3 w-3" />
                             </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tag">Tag (e.g. -50%)</Label>
                        <Input id="tag" name="tag" className="rounded-xl border-2 focus:border-purple-500" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stock">Available stock</Label>
                        <Input id="stock" name="stock" type="number" defaultValue="100" required className="rounded-xl border-2 focus:border-purple-500" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sold">Sold count (e.g. 5k+)</Label>
                      <Input id="sold" name="sold" className="rounded-xl border-2 focus:border-purple-500" />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="description">Product description</Label>
                       <Textarea id="description" name="description" placeholder="Describe the features and details..." className="rounded-xl border-2 focus:border-purple-500 min-h-[100px]" />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="prescription">Prescription / Special instructions</Label>
                       <Textarea id="prescription" name="prescription" placeholder="Usage instructions or health notes..." className="rounded-xl border-2 focus:border-purple-500" />
                    </div>
                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl h-12 mt-4" disabled={isLoading}>
                      <Plus className="h-5 w-5 mr-2" /> {isLoading ? 'Adding...' : 'Add product'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Product List */}
              <Card className="lg:col-span-2 rounded-3xl border-none shadow-xl shadow-gray-200/50 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl font-black  tracking-tighter">Product inventory</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-black  text-[10px] tracking-widest">Product</TableHead>
                          <TableHead className="font-black  text-[10px] tracking-widest">Category</TableHead>
                          <TableHead className="font-black  text-[10px] tracking-widest">Price</TableHead>
                          <TableHead className="font-black  text-[10px] tracking-widest">Stock</TableHead>
                          <TableHead className="font-black  text-[10px] tracking-widest text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((p) => (
                          <TableRow key={p.id} className="hover:bg-green-50/30 transition-colors">
                            <TableCell className="font-bold">
                              <div className="flex items-center gap-3">
                                <img
                                  src={p.image}
                                  className="w-10 h-10 rounded-lg object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=500&auto=format&fit=crop';
                                  }}
                                />
                                <span>{p.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-500 font-medium">{p.category}</TableCell>
                            <TableCell className="font-black text-purple-600">{formatPrice(p.price)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${p.stock < 10 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'} font-bold`}>
                                {p.stock || 0} left
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Dialog open={editingProduct?.id === p.id} onOpenChange={(open) => {
                                  if (!open) {
                                    setEditingProduct(null);
                                    setEditProductImage("");
                                    setEditCategoryId("");
                                  }
                                }}>
                                  <DialogTrigger
                                    render={(props) => (
                                      <button
                                        {...props}
                                        className={cn(
                                          buttonVariants({ variant: "ghost", size: "icon" }),
                                          "text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                                        )}
                                        onClick={(e) => {
                                          props.onClick?.(e);
                                          setEditingProduct(p);
                                          setEditCategoryId(categories.find(c => c.name === (p.category_name || p.category))?.id?.toString() || "");
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </button>
                                    )}
                                  />
                                  <DialogContent className="rounded-3xl">
                                    <DialogHeader>
                                      <DialogTitle className="text-xl font-black  tracking-tighter">Edit product</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleUpdateProduct} className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-name">Product name</Label>
                                        <Input id="edit-name" name="name" defaultValue={p.name} required className="rounded-xl" />
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-price">Price ($)</Label>
                                          <Input id="edit-price" name="price" type="number" step="0.01" defaultValue={p.price} required className="rounded-xl" />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-oldPrice">Old price ($)</Label>
                                          <Input id="edit-oldPrice" name="oldPrice" type="number" step="0.01" defaultValue={p.oldPrice} className="rounded-xl" />
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-categoryId">Category</Label>
                                        <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                                          <SelectTrigger className="rounded-xl border-2 w-full h-11">
                                            <SelectValue placeholder="Select a category" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {categories.map((cat) => (
                                              <SelectItem key={cat.id} value={cat.id.toString()}>
                                                {cat.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-image">Product image</Label>
                                        <div className="flex flex-col gap-3">
                                          <Input
                                            id="edit-image"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'edit')}
                                            className="rounded-xl border-2 h-auto py-2 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                          />
                                          <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-gray-100 bg-gray-50">
                                             <img src={editProductImage || p.image} className="w-full h-full object-cover" />
                                          </div>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-tag">Tag</Label>
                                          <Input id="edit-tag" name="tag" defaultValue={p.tag} className="rounded-xl" />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-stock">Stock (Restock)</Label>
                                          <Input id="edit-stock" name="stock" type="number" defaultValue={p.stock || 0} required className="rounded-xl border-purple-200 focus:border-purple-500" />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-sold">Items sold</Label>
                                          <Input id="edit-sold" name="sold" type="number" defaultValue={p.sold || 0} required className="rounded-xl" />
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-description">Description</Label>
                                        <Textarea id="edit-description" name="description" defaultValue={p.description} className="rounded-xl" />
                                      </div>
                                      <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl h-12" disabled={isLoading}>
                                        {isLoading ? 'Saving...' : 'Save changes'}
                                      </Button>
                                    </form>
                                  </DialogContent>
                                </Dialog>
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className={cn(
                                    buttonVariants({ variant: "ghost", size: "icon" }),
                                    "text-red-500 hover:text-red-700 hover:bg-red-50"
                                  )}
                                  title="Delete product"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
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

          <TabsContent value="gallery">
            <Card className="rounded-[40px] border-none shadow-xl shadow-gray-200/50 p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                  <h2 className="text-3xl font-black  tracking-tighter italic">Product gallery</h2>
                  <p className="text-[10px] font-black text-gray-400  tracking-widest mt-1">Visual inventory browsing and management</p>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-purple-600 font-black  tracking-widest text-[9px] px-3">{products.length} Products</Badge>
                  <Button 
                    variant="outline"
                    className="rounded-xl border-2 font-black text-xs px-6 h-11 border-gray-100 hover:border-purple-200 gap-2"
                    onClick={() => setActiveTab('products')}
                  >
                    <Plus className="h-4 w-4" /> Add new
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="group relative bg-white rounded-3xl border-2 border-transparent hover:border-purple-500 transition-all overflow-hidden shadow-sm hover:shadow-xl hover:shadow-purple-100 hover:-translate-y-1">
                    <div className="aspect-square relative overflow-hidden bg-gray-50">
                      <img 
                        src={p.image} 
                        alt={p.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=500&auto=format&fit=crop';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button 
                          size="icon"
                          variant="secondary"
                          className="rounded-xl bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-purple-600 h-10 w-10"
                          onClick={() => {
                            setEditingProduct(p);
                            setEditCategoryId(categories.find(c => c.name === (p.category_name || p.category))?.id?.toString() || "");
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <button
                          className={cn(
                            buttonVariants({ variant: "secondary", size: "icon" }),
                            "rounded-xl bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-red-600 h-10 w-10 transition-all"
                          )}
                          onClick={() => handleDeleteProduct(p.id)}
                          title="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {p.tag && (
                        <div className="absolute top-3 left-3 bg-purple-600 text-white text-[8px] font-black  px-2 py-1 rounded-full shadow-lg">
                          {p.tag}
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-black text-purple-600  tracking-widest truncate max-w-[80px]">{p.category}</p>
                        <Badge variant="outline" className={`${p.stock < 10 ? 'border-red-200 text-red-500' : 'border-gray-100 text-gray-400'} text-[8px] font-black h-5`}>
                          {p.stock} left
                        </Badge>
                      </div>
                      <h4 className="font-bold text-sm truncate leading-tight mb-1">{p.name}</h4>
                      <div className="flex items-center justify-between">
                        <p className="font-black text-purple-600 text-base">{formatPrice(p.price)}</p>
                        <div className="flex items-center gap-1 text-gray-400">
                           <ImageIcon className="h-3 w-3" />
                           <span className="text-[9px] font-bold  tracking-tighter">{p.sold || '0 sold'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <LayoutGrid className="h-8 w-8 text-gray-200" />
                  </div>
                  <p className="text-gray-400 font-bold italic">No products found in gallery</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="rounded-3xl border-none shadow-xl shadow-gray-200/50 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black  tracking-tighter">Sales orders</CardTitle>
                  <CardDescription>Real-time stream of customer transactions</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-black  text-[10px] tracking-widest">Order id</TableHead>
                      <TableHead className="font-black  text-[10px] tracking-widest">Customer</TableHead>
                      <TableHead className="font-black  text-[10px] tracking-widest">Address</TableHead>
                      <TableHead className="font-black  text-[10px] tracking-widest">Total</TableHead>
                      <TableHead className="font-black  text-[10px] tracking-widest">Status</TableHead>
                      <TableHead className="font-black  text-[10px] tracking-widest">Date</TableHead>
                      <TableHead className="font-black  text-[10px] tracking-widest text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((o) => (
                      <TableRow key={o.id} className="group hover:bg-green-50/30 transition-colors">
                        <TableCell className="font-mono text-[10px] text-gray-500">#{o.id.slice(-6).toUpperCase()}</TableCell>
                        <TableCell className="font-bold text-sm">
                          {o.customerEmail}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          <span className="text-xs text-gray-500 font-medium">
                            {o.shippingAddress?.address}, {o.shippingAddress?.city}
                          </span>
                        </TableCell>
                        <TableCell className="font-black text-purple-600">{formatPrice(o.totalAmount)}</TableCell>
                        <TableCell>
                          {getStatusBadge(o.status)}
                        </TableCell>
                        <TableCell className="text-gray-500 text-xs font-medium">
                          {o.createdAt?.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                                <Dialog onOpenChange={(open) => !open && setSelectedOrder(null)}>
                                  <DialogTrigger
                                    render={(props) => (
                                      <button
                                        {...props}
                                        className={cn(
                                          buttonVariants({ variant: "outline", size: "sm" }),
                                          "h-8 rounded-lg font-bold border-2 border-input hover:bg-accent hover:text-accent-foreground text-xs gap-1.5 transition-colors bg-white px-4"
                                        )}
                                        onClick={(e) => {
                                           props.onClick?.(e);
                                           setSelectedOrder(o);
                                        }}
                                      >
                                        <Eye className="h-3 w-3" /> View
                                      </button>
                                    )}
                                  />
                              <DialogContent className="max-w-md rounded-3xl">
                                <DialogHeader>
                                  <DialogTitle className="text-2xl font-black  tracking-tighter">Order <span className="text-purple-600">details</span></DialogTitle>
                                </DialogHeader>
                                {selectedOrder && (
                                  <div className="space-y-6">
                                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                                      <div>
                                        <p className="text-[10px] font-black  text-gray-400 tracking-widest">Order id</p>
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
                                          <p className="text-xs font-black  text-gray-400">Customer</p>
                                          <p className="font-medium text-sm">{selectedOrder.customerEmail}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-50 rounded-lg">
                                          <Truck className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div>
                                          <p className="text-xs font-black  text-gray-400">Shipping address</p>
                                          <p className="font-medium text-sm">
                                            {selectedOrder.shippingAddress?.address}<br/>
                                            {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.zipCode}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <p className="text-xs font-black  text-gray-400 mb-3">Order items</p>
                                      <div className="space-y-3">
                                        {selectedOrder.items?.map((item: any, idx: number) => (
                                          <div key={idx} className="flex justify-between items-center p-3 border rounded-xl">
                                            <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-[10px] font-bold">
                                                {item.quantity}x
                                              </div>
                                              <p className="font-bold text-sm">{item.name}</p>
                                            </div>
                                            <p className="font-black text-purple-600">{formatPrice(item.price)}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="pt-4 border-t border-dashed flex justify-between items-end">
                                      <div>
                                        <p className="text-[10px] font-black  text-gray-400 mb-1">Update status</p>
                                        <Select 
                                          value={selectedOrder.status} 
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
                                        <p className="text-xs font-black  text-gray-400">Total paid</p>
                                        <p className="text-3xl font-black text-purple-600 tracking-tighter">{formatPrice(selectedOrder.totalAmount)}</p>
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

          <TabsContent value="users">
            <Card className="rounded-3xl border-none shadow-xl shadow-gray-200/50 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-black  tracking-tighter">User & Admin management</CardTitle>
                <CardDescription>Grant or revoke administrator privileges</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-black  text-[10px] tracking-widest">Admins</TableHead>
                      <TableHead className="font-black  text-[10px] tracking-widest">Email</TableHead>
                      <TableHead className="font-black  text-[10px] tracking-widest">Role</TableHead>
                      <TableHead className="font-black  text-[10px] tracking-widest text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-bold">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-black text-xs">
                              {u.displayName?.charAt(0) || u.email?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            {u.displayName || 'Unnamed User'}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-500">{u.email}</TableCell>
                        <TableCell>
                          <Badge className={u.role === 'admin' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}>
                            {u.role || 'user'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAdmin(u.id, u.role)}
                            className="rounded-lg font-bold text-[10px] "
                            disabled={u.email === 'idemudiawisdom27@gmail.com' || u.email === import.meta.env.VITE_ADMIN_EMAIL} // Protect main admin
                          >
                            {u.role === 'admin' ? 'Revoke admin' : 'Make admin'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-gray-400 font-bold">No users found</TableCell>
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
                <CardTitle className="text-xl font-black  tracking-tighter">Email notification logs</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-black  text-[10px] tracking-widest">Type</TableHead>
                      <TableHead className="font-black  text-[10px] tracking-widest">Recipient</TableHead>
                      <TableHead className="font-black  text-[10px] tracking-widest">Status</TableHead>
                      <TableHead className="font-black  text-[10px] tracking-widest">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((n) => (
                      <TableRow key={n.id}>
                        <TableCell className="font-bold text-purple-600  text-xs">{n.type.replace('_', ' ')}</TableCell>
                        <TableCell className="font-medium">{n.email}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-black ">
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
          <TabsContent value="settings">
            <Card className="rounded-3xl border-none shadow-xl shadow-gray-200/50 p-8">
               <div className="flex items-center gap-3 mb-8">
                  <div className="bg-purple-600 p-2 rounded-lg">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-black  tracking-tighter italic">Store <span className="text-purple-600">settings</span></h3>
               </div>

               <form onSubmit={handleUpdateSettings} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-black  tracking-widest text-gray-400 mb-4">Payment information</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Bank account number</Label>
                          <Input name="bankAccountNumber" defaultValue={settings?.bankAccountNumber} className="rounded-xl h-12" />
                        </div>
                        <div className="space-y-2">
                          <Label>Bank name</Label>
                          <Input name="bankName" defaultValue={settings?.bankName} className="rounded-xl h-12" />
                        </div>
                        <div className="space-y-2">
                          <Label>Airtime / phone number</Label>
                          <Input name="momoNumber" defaultValue={settings?.momoNumber} className="rounded-xl h-12" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-black  tracking-widest text-gray-400 mb-4">Financial management</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Monthly expenses ($)</Label>
                          <Input name="expenses" type="number" step="0.01" defaultValue={settings?.expenses} className="rounded-xl h-12" />
                          <p className="text-[10px] text-gray-400 font-bold  mt-1 italic">Costs like hosting, staff, and shipping logistics.</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 space-y-4">
                      <Button type="submit" disabled={isLoading} className="w-full bg-black text-white font-black rounded-xl h-14 shadow-xl hover:bg-zinc-800 transition-all">
                        {isLoading ? 'Updating...' : 'Save store settings'}
                      </Button>

                      <div className="p-6 bg-red-50 rounded-[32px] border-2 border-red-100 mt-10">
                         <h4 className="text-sm font-black text-red-900 mb-2">Database maintenance</h4>
                         <p className="text-[10px] text-red-700 font-bold mb-4 italic">Use this to fill your shop with demo products and images if it's empty.</p>
                         <Button
                            type="button"
                            onClick={async () => {
                               setIsLoading(true);
                               try {
                                 const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                                 const res = await fetch(`${apiUrl}/api/seed`, { method: 'POST' });
                                 const data = await res.json();
                                 toast.success(data.message);
                                 fetchData();
                               } catch (e) {
                                 toast.error("Failed to seed database");
                               } finally {
                                 setIsLoading(false);
                               }
                            }}
                            disabled={isLoading}
                            variant="destructive"
                            className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest"
                         >
                            {isLoading ? 'Processing...' : 'Repair database & images'}
                         </Button>
                      </div>
                    </div>
                  </div>
               </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
