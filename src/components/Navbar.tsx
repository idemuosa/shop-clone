import React, { useState, useEffect } from "react";
import { Search, ShoppingCart, Heart, User, ChevronDown, Menu, Zap, LogOut, LayoutDashboard, Box, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { useCart } from "@/lib/CartContext";
import { useCurrency } from "@/lib/CurrencyContext";
import { API_URL } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenCart: () => void;
  onOpenProfile: () => void;
  onToggleAdmin: () => void;
  onSearch?: (query: string) => void;
  onOpenInfoPage?: (page: string) => void;
  showAdmin: boolean;
  wishlistCount: number;
}

export default function Navbar({ onOpenAuth, onOpenCart, onOpenProfile, onToggleAdmin, onSearch, onOpenInfoPage, showAdmin, wishlistCount }: NavbarProps) {
  const { user, profile, isAdmin, loading } = useAuth();
  const { totalItems } = useCart();
  const { currency, setCurrency } = useCurrency();
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/categories/`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (e) {
        console.error("Navbar category fetch failed");
      }
    };
    fetchCategories();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchTerm);
  };

  return (
    <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      {/* Top bar */}
      <div className="bg-purple-600 text-white py-2 px-4 text-center text-xs font-bold  tracking-widest">
        <span className="flex items-center justify-center gap-2">
          <Zap className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          Vivi Style Flash Sale: Up to 90% Off!
          <Zap className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <a href="#" className="underline underline-offset-4 hover:text-yellow-200 transition-colors ml-2">Shop Now</a>
        </span>
      </div>

      {/* Main Navbar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-2 md:gap-4">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-1 md:gap-2 cursor-pointer" onClick={() => {
            if (showAdmin) onToggleAdmin();
            onSearch?.("");
            setSearchTerm("");
          }}>
            <span className="text-2xl md:text-3xl font-black tracking-tighter text-purple-600 italic ">Vivi</span>
          </div>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input 
              type="text" 
              placeholder="Search for items, brands and categories..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-gray-100 border-2 border-transparent focus:border-purple-500 rounded-full h-12 text-base transition-all"
            />
            <Button type="submit" className="absolute right-1 top-1 bottom-1 px-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold">
              Search
            </Button>
          </form>

          {/* User Actions */}
          <div className="flex items-center gap-1.5 sm:gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={(props) => (
                  <button
                    {...props}
                    className="flex items-center gap-1 px-1.5 sm:px-3 py-1 bg-gray-50 rounded-full border border-gray-100 hover:border-purple-200 transition-all cursor-pointer group outline-none"
                  >
                    <span className="text-[8px] sm:text-[10px] font-black text-gray-400 group-hover:text-purple-600 transition-colors ">{currency}</span>
                    <ChevronDown className="h-2.5 w-2.5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </button>
                )}
              />
              <DropdownMenuContent className="rounded-xl border-2">
                {["Usd", "Ngn", "Eur", "Gbp"].map((c) => (
                  <DropdownMenuItem key={c} onClick={() => {
                    setCurrency(c.toUpperCase() as any);
                    toast.info(`Currency changed to ${c}`);
                  }} className="font-bold text-xs  cursor-pointer">
                    {c}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {isAdmin && (
              <div className="flex flex-col items-center cursor-pointer group" onClick={onToggleAdmin}>
                <div className="relative">
                  <LayoutDashboard className={`h-5 w-5 md:h-6 md:w-6 ${showAdmin ? 'text-purple-600' : 'text-gray-700'} group-hover:text-purple-600 transition-colors`} />
                </div>
                <span className="text-[9px] md:text-[11px] hidden sm:block mt-1 font-bold text-gray-600 group-hover:text-purple-600">Admin</span>
              </div>
            )}

            <div className="flex flex-col items-center cursor-pointer group" onClick={onOpenAuth}>
              <div className="relative">
                <User className="h-5 w-5 md:h-6 md:w-6 text-gray-700 group-hover:text-purple-600 transition-colors" />
              </div>
              <span className="text-[9px] md:text-[11px] hidden sm:block mt-1 font-bold text-gray-600 group-hover:text-purple-600">
                {user ? (profile?.displayName || 'Account') : 'Login'}
              </span>
            </div>

            {user && (
              <div className="flex flex-col items-center cursor-pointer group" onClick={handleLogout}>
                <div className="relative">
                  <LogOut className="h-5 w-5 md:h-6 md:w-6 text-gray-700 group-hover:text-purple-600 transition-colors" />
                </div>
                <span className="text-[9px] md:text-[11px] hidden sm:block mt-1 font-bold text-gray-600 group-hover:text-purple-600">Logout</span>
              </div>
            )}
            
            <div className="flex flex-col items-center cursor-pointer group">
              <div className="relative">
                <Heart className="h-5 w-5 md:h-6 md:w-6 text-gray-700 group-hover:text-purple-600 transition-colors" />
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[8px] md:text-[10px] font-bold px-1 py-0.5 md:px-1.5 md:py-0.5 rounded-full border-2 border-white">{wishlistCount}</span>
              </div>
              <span className="text-[9px] md:text-[11px] hidden sm:block mt-1 font-bold text-gray-600 group-hover:text-purple-600">Saved</span>
            </div>
            
            <div className="flex flex-col items-center cursor-pointer group" onClick={onOpenCart}>
              <div className="relative">
                <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-gray-700 group-hover:text-purple-600 transition-colors" />
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[8px] md:text-[10px] font-bold px-1 py-0.5 md:px-1.5 md:py-0.5 rounded-full border-2 border-white">{totalItems}</span>
              </div>
              <span className="text-[9px] md:text-[11px] hidden sm:block mt-1 font-bold text-gray-600 group-hover:text-purple-600">Cart</span>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-50 space-y-4 animate-in slide-in-from-top duration-300">
            <form onSubmit={(e) => { handleSearch(e); setIsMobileMenuOpen(false); }} className="relative px-2">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
               <Input
                 placeholder="Search..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="pl-10 h-10 rounded-xl bg-gray-100 border-none"
               />
            </form>
            <div className="flex flex-col gap-1 px-2">
               {["Flash sales", "New arrivals", "Best sellers", "Clearance", "Brands", "Help"].map((link) => (
                 <button
                   key={link}
                   onClick={() => {
                     onOpenInfoPage?.(link);
                     setIsMobileMenuOpen(false);
                   }}
                   className="text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-all"
                 >
                   {link}
                 </button>
               ))}
            </div>
            <div className="px-4 pt-2">
               <Button
                 onClick={() => { onSearch?.(""); setIsMobileMenuOpen(false); }}
                 className="w-full bg-purple-600 text-white rounded-xl font-bold h-11"
               >
                 View All Products
               </Button>
            </div>
          </div>
        )}

        <nav className="hidden md:flex items-center justify-between py-2 border-t border-gray-50">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={(props) => (
                <button
                  {...props}
                  className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-md cursor-pointer hover:bg-green-100 transition-colors border border-green-100 active:scale-95 outline-none"
                >
                  <Menu className="h-4 w-4" />
                  <span className="text-sm font-bold  tracking-wide">All categories</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              )}
            />
            <DropdownMenuContent className="w-56 rounded-2xl border-2 p-2 shadow-xl shadow-purple-100/50">
               {Array.isArray(categories) && categories.length > 0 ? categories.map((cat) => (
                 <DropdownMenuItem
                    key={cat.id}
                    onClick={() => onSearch?.(cat.name || "")}
                    className="rounded-xl h-11 font-black  text-xs tracking-tighter cursor-pointer hover:bg-green-50 hover:text-purple-600 transition-all gap-3"
                 >
                   <Box className="h-4 w-4 text-purple-600" />
                   {cat.name}
                 </DropdownMenuItem>
               )) : (
                 <p className="p-4 text-center text-[10px] font-black  text-gray-400">No categories found</p>
               )}
               <div className="border-t border-gray-100 mt-2 pt-2">
                 <DropdownMenuItem
                   onClick={() => onSearch?.("")}
                   className="rounded-xl h-11 font-black  text-xs tracking-tighter cursor-pointer bg-purple-600 text-white hover:bg-purple-700"
                 >
                   View all products
                 </DropdownMenuItem>
               </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-8">
            {["Flash sales", "New arrivals", "Best sellers", "Clearance", "Brands", "Help"].map((link) => (
              <a 
                key={link} 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  onOpenInfoPage?.(link);
                }}
                className="text-sm font-bold text-gray-700 hover:text-purple-600 transition-colors  tracking-tight"
              >
                {link}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-purple-600">
            <span className="flex items-center gap-1 cursor-pointer hover:underline">
              <Zap className="h-3 w-3 fill-purple-600" />
              Top deals
            </span>
            <span className="flex items-center gap-1 cursor-pointer hover:underline">Sell on Vivi</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
