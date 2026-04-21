import React, { useState } from "react";
import { Search, ShoppingCart, Heart, User, ChevronDown, Menu, Zap, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { useCart } from "@/lib/CartContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenCart: () => void;
  onOpenProfile: () => void;
  onToggleAdmin: () => void;
  onSearch?: (query: string) => void;
  showAdmin: boolean;
  wishlistCount: number;
}

export default function Navbar({ onOpenAuth, onOpenCart, onOpenProfile, onToggleAdmin, onSearch, showAdmin, wishlistCount }: NavbarProps) {
  const { user, profile, isAdmin } = useAuth();
  const { totalItems } = useCart();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchTerm);
  };

  return (
    <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      {/* Top bar */}
      <div className="bg-orange-600 text-white py-2 px-4 text-center text-xs font-bold uppercase tracking-widest">
        <span className="flex items-center justify-center gap-2">
          <Zap className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          Temu Style Flash Sale: Up to 90% Off! 
          <Zap className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <a href="#" className="underline underline-offset-4 hover:text-yellow-200 transition-colors ml-2">Shop Now</a>
        </span>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => {
            if (showAdmin) onToggleAdmin();
            onSearch?.("");
            setSearchTerm("");
          }}>
            <span className="text-3xl font-black tracking-tighter text-orange-600 italic">SHOPSY</span>
          </div>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input 
              type="text" 
              placeholder="Search for items, brands and categories..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-gray-100 border-2 border-transparent focus:border-orange-500 rounded-full h-12 text-base transition-all"
            />
            <Button type="submit" className="absolute right-1 top-1 bottom-1 px-8 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
              SEARCH
            </Button>
          </form>

          {/* User Actions */}
          <div className="flex items-center gap-2 sm:gap-6">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 hover:border-orange-200 transition-all cursor-pointer group">
               <span className="text-[10px] font-black text-gray-400 group-hover:text-orange-600 transition-colors">USD</span>
               <ChevronDown className="h-3 w-3 text-gray-400 group-hover:text-orange-600 transition-colors" />
            </div>

            {isAdmin && (
              <div className="flex flex-col items-center cursor-pointer group" onClick={onToggleAdmin}>
                <div className="relative">
                  <LayoutDashboard className={`h-6 w-6 ${showAdmin ? 'text-orange-600' : 'text-gray-700'} group-hover:text-orange-600 transition-colors`} />
                </div>
                <span className="text-[11px] hidden sm:block mt-1 font-bold text-gray-600 group-hover:text-orange-600">Admin</span>
              </div>
            )}

            <div className="flex flex-col items-center cursor-pointer group" onClick={onOpenAuth}>
              <div className="relative">
                <User className="h-6 w-6 text-gray-700 group-hover:text-orange-600 transition-colors" />
              </div>
              <span className="text-[11px] hidden sm:block mt-1 font-bold text-gray-600 group-hover:text-orange-600">
                {user ? (profile?.displayName || 'Account') : 'Login'}
              </span>
            </div>

            {user && (
              <div className="flex flex-col items-center cursor-pointer group" onClick={handleLogout}>
                <div className="relative">
                  <LogOut className="h-6 w-6 text-gray-700 group-hover:text-orange-600 transition-colors" />
                </div>
                <span className="text-[11px] hidden sm:block mt-1 font-bold text-gray-600 group-hover:text-orange-600">Logout</span>
              </div>
            )}
            
            <div className="flex flex-col items-center cursor-pointer group">
              <div className="relative">
                <Heart className="h-6 w-6 text-gray-700 group-hover:text-orange-600 transition-colors" />
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">{wishlistCount}</span>
              </div>
              <span className="text-[11px] hidden sm:block mt-1 font-bold text-gray-600 group-hover:text-orange-600">Saved</span>
            </div>
            
            <div className="flex flex-col items-center cursor-pointer group" onClick={onOpenCart}>
              <div className="relative">
                <ShoppingCart className="h-6 w-6 text-gray-700 group-hover:text-orange-600 transition-colors" />
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">{totalItems}</span>
              </div>
              <span className="text-[11px] hidden sm:block mt-1 font-bold text-gray-600 group-hover:text-orange-600">Cart</span>
            </div>

            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Categories & Links */}
        <nav className="hidden md:flex items-center justify-between py-2 border-t border-gray-50">
          <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-md cursor-pointer hover:bg-orange-100 transition-colors border border-orange-100">
            <Menu className="h-4 w-4" />
            <span className="text-sm font-bold uppercase tracking-wide">All Categories</span>
            <ChevronDown className="h-4 w-4" />
          </div>

          <div className="flex items-center gap-8">
            {["Flash Sales", "New Arrivals", "Best Sellers", "Clearance", "Brands", "Help"].map((link) => (
              <a 
                key={link} 
                href="#" 
                className="text-sm font-bold text-gray-700 hover:text-orange-600 transition-colors uppercase tracking-tight"
              >
                {link}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-orange-600">
            <span className="flex items-center gap-1 cursor-pointer hover:underline">
              <Zap className="h-3 w-3 fill-orange-600" />
              TOP DEALS
            </span>
            <span className="flex items-center gap-1 cursor-pointer hover:underline">SELL ON SHOPSY</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
