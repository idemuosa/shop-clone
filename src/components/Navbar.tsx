import React, { useState, useEffect } from "react";
import { Search, ShoppingCart, Heart, User, ChevronDown, Menu, Zap, LogOut, LayoutDashboard, Box, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { useCart } from "@/lib/CartContext";
import { useCurrency } from "@/lib/CurrencyContext";
import { API_URL } from "@/lib/api";
import { auth, db } from "@/lib/firebase";
import { collection, query, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
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

export const NAV_LINKS = ["New arrivals", "Best sellers", "Clearance", "Brands", "Help"];

export default function Navbar({ onOpenAuth, onOpenCart, onOpenProfile: _onOpenProfile, onToggleAdmin, onSearch, onOpenInfoPage, showAdmin, wishlistCount }: NavbarProps) {
  const { user, profile, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const { currency, setCurrency } = useCurrency();
  const [categories, setCategories] = useState<any[]>([]);
  const [storeSettings, setStoreSettings] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'settings'));
    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) setStoreSettings(snap.docs[0].data());
    });
    return () => unsubscribe();
  }, []);

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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const trendingSearches = ["Wireless Earbuds", "Smart Watch", "Summer T-shirt", "Running Shoes"];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchTerm);
    setShowSuggestions(false);
  };

  return (
    <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      {/* Top bar */}
      <div className="bg-orange-600 text-white py-1 px-3 text-center text-[10px] md:text-xs font-bold tracking-widest">
        <span className="flex items-center justify-center gap-2">
          {storeSettings?.bannerMessage || 'Welcome to Vivi - Enjoy Free Shipping on Orders Over ₦140!'}
          <a href="#" className="underline underline-offset-4 hover:text-yellow-200 transition-colors ml-2">Shop Now</a>
        </span>
      </div>

      {/* Main Navbar */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-20 gap-2 md:gap-4">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-1 md:gap-2 cursor-pointer" onClick={() => {
            if (showAdmin) onToggleAdmin();
            onSearch?.("");
            setSearchTerm("");
          }}>
            <span className="text-2xl md:text-3xl font-black tracking-tighter text-orange-600 italic ">
               {storeSettings?.logoUrl || 'Vivi'}
            </span>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl relative">
            <form onSubmit={handleSearch} className="w-full relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search for items, brands and categories..."
                value={searchTerm}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 bg-gray-100 border-2 border-transparent focus:border-orange-500 rounded-full h-12 text-base transition-all w-full"
              />
              <Button type="submit" className="absolute right-1 top-1 bottom-1 px-8 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
                Search
              </Button>
            </form>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute top-14 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Trending Searches</h4>
                </div>
                <div className="p-2">
                  {trendingSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setSearchTerm(term);
                        onSearch?.(term);
                        setShowSuggestions(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-all text-left"
                    >
                      <Search className="h-4 w-4 text-gray-400" />
                      {term}
                    </button>
                  ))}
                </div>
                {searchTerm && (
                  <div className="p-4 border-t border-gray-50 flex justify-between items-center bg-green-50/30">
                    <p className="text-[10px] font-bold text-gray-500 italic">Press enter to search for <span className="text-orange-600">"{searchTerm}"</span></p>
                    <Zap className="h-4 w-4 text-orange-600 animate-pulse" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-1.5 sm:gap-6">
            <div className="flex items-center gap-1 px-1.5 sm:px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
              <span className="text-[8px] sm:text-[10px] font-black text-gray-500">NGN (₦)</span>
            </div>

            {isAdmin && (
              <div className="flex flex-col items-center cursor-pointer group" onClick={onToggleAdmin}>
                <div className="relative">
                  <LayoutDashboard className={`h-5 w-5 md:h-6 md:w-6 ${showAdmin ? 'text-orange-600' : 'text-gray-700'} group-hover:text-orange-600 transition-colors`} />
                </div>
                <span className="text-[9px] md:text-[11px] hidden sm:block mt-1 font-bold text-gray-600 group-hover:text-orange-600">Admin</span>
              </div>
            )}

            <div className="flex flex-col items-center cursor-pointer group" onClick={onOpenAuth}>
              <div className="relative">
                <User className="h-5 w-5 md:h-6 md:w-6 text-gray-700 group-hover:text-orange-600 transition-colors" />
              </div>
              <span className="text-[9px] md:text-[11px] hidden sm:block mt-1 font-bold text-gray-600 group-hover:text-orange-600">
                {user ? 'Account' : 'Login'}
              </span>
            </div>

            {user && (
              <div className="flex flex-col items-center cursor-pointer group" onClick={handleLogout}>
                <div className="relative">
                  <LogOut className="h-5 w-5 md:h-6 md:w-6 text-gray-700 group-hover:text-orange-600 transition-colors" />
                </div>
                <span className="text-[9px] md:text-[11px] hidden sm:block mt-1 font-bold text-gray-600 group-hover:text-orange-600">Logout</span>
              </div>
            )}
            
            <div className="flex flex-col items-center cursor-pointer group">
              <div className="relative">
                <Heart className="h-5 w-5 md:h-6 md:w-6 text-gray-700 group-hover:text-orange-600 transition-colors" />
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[8px] md:text-[10px] font-bold px-1 py-0.5 md:px-1.5 md:py-0.5 rounded-full border-2 border-white">{wishlistCount}</span>
              </div>
              <span className="text-[9px] md:text-[11px] hidden sm:block mt-1 font-bold text-gray-600 group-hover:text-orange-600">Saved</span>
            </div>
            
            <div className="flex flex-col items-center cursor-pointer group" onClick={onOpenCart}>
              <div className="relative">
                <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-gray-700 group-hover:text-orange-600 transition-colors" />
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[8px] md:text-[10px] font-bold px-1 py-0.5 md:px-1.5 md:py-0.5 rounded-full border-2 border-white">{totalItems}</span>
              </div>
              <span className="text-[9px] md:text-[11px] hidden sm:block mt-1 font-bold text-gray-600 group-hover:text-orange-600">Cart</span>
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
          <div className="md:hidden py-1.5 border-t border-gray-50 space-y-1.5 animate-in slide-in-from-top duration-300">
            <form onSubmit={(e) => { handleSearch(e); setIsMobileMenuOpen(false); }} className="relative px-2">
               <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
               <Input
                 placeholder="Search..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="pl-8 h-8 rounded-md bg-gray-100 border-none text-[11px]"
               />
            </form>
            <div className="flex flex-col gap-0.5 px-2">
               {NAV_LINKS.map((link) => (
                 <button
                   key={link}
                   onClick={() => {
                     onOpenInfoPage?.(link);
                     setIsMobileMenuOpen(false);
                   }}
                   className="text-left px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-md transition-all"
                 >
                   {link}
                 </button>
               ))}
            </div>
            <div className="px-2 pt-0.5">
               <Button
                 onClick={() => { onSearch?.(""); setIsMobileMenuOpen(false); }}
                 className="w-full bg-orange-600 text-white rounded-md font-bold h-8 text-[11px]"
               >
                 View All Products
               </Button>
            </div>
          </div>
        )}

        <nav className="hidden md:flex items-center justify-between py-1.5 border-t border-gray-50">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={(props) => (
                <button
                  {...props}
                  className="flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded cursor-pointer hover:bg-green-100 transition-colors border border-green-100 active:scale-95 outline-none"
                >
                  <Menu className="h-3 w-3" />
                  <span className="text-[11px] font-bold tracking-wide">All categories</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              )}
            />
            <DropdownMenuContent className="w-48 rounded-lg border p-1 shadow-md shadow-orange-100/50">
               {Array.isArray(categories) && categories.length > 0 ? categories.map((cat) => (
                 <DropdownMenuItem
                    key={cat.id}
                    onClick={() => onSearch?.(cat.name || "")}
                    className="rounded h-8 font-bold text-[11px] tracking-tighter cursor-pointer hover:bg-green-50 hover:text-orange-600 transition-all gap-1.5"
                 >
                   <Box className="h-3 w-3 text-orange-600" />
                   {cat.name}
                 </DropdownMenuItem>
               )) : (
                 <p className="p-2 text-center text-[9px] font-bold text-gray-400">No categories found</p>
               )}
               <div className="border-t border-gray-100 mt-1 pt-1">
                 <DropdownMenuItem
                   onClick={() => onSearch?.("")}
                   className="rounded h-8 font-bold text-[11px] tracking-tighter cursor-pointer bg-orange-600 text-white hover:bg-orange-700"
                 >
                   View all products
                 </DropdownMenuItem>
               </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-4">
            {NAV_LINKS.map((link) => (
              <a 
                key={link} 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  onOpenInfoPage?.(link);
                }}
                className="text-xs md:text-sm font-bold text-gray-700 hover:text-orange-600 transition-colors tracking-tight"
              >
                {link}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-orange-600">
            <span className="flex items-center gap-1 cursor-pointer hover:underline">
              <Zap className="h-3 w-3 fill-orange-600" />
              Top deals
            </span>
            <span className="flex items-center gap-1 cursor-pointer hover:underline">Sell on Vivi</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
