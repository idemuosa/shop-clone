import React from "react";
import { Home, Search, ShoppingBag, Heart, User, ShieldCheck } from "lucide-react";
import { useCart } from "../lib/CartContext";
import { useAuth } from "../lib/AuthContext";
import { hapticImpact } from "../lib/haptics";

interface MobileBottomNavProps {
  activeTab: 'home' | 'search' | 'wishlist' | 'cart' | 'profile' | 'admin';
  onNavigate: (tab: 'home' | 'search' | 'wishlist' | 'cart' | 'profile' | 'admin') => void;
  wishlistCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onNavigate,
  wishlistCount = 0,
}) => {
  const { totalItems } = useCart();
  const { user, isAdmin } = useAuth();

  const handleTabClick = (tab: 'home' | 'search' | 'wishlist' | 'cart' | 'profile' | 'admin') => {
    hapticImpact('LIGHT');
    onNavigate(tab);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-2 py-1.5 shadow-lg pb-safe">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <button
          onClick={() => handleTabClick('home')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
            activeTab === 'home' ? 'text-orange-600 font-extrabold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Home className={`h-5 w-5 ${activeTab === 'home' ? 'scale-110' : ''} transition-transform`} />
          <span className="text-[10px] tracking-tight mt-0.5">Home</span>
        </button>

        <button
          onClick={() => handleTabClick('search')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
            activeTab === 'search' ? 'text-orange-600 font-extrabold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Search className={`h-5 w-5 ${activeTab === 'search' ? 'scale-110' : ''} transition-transform`} />
          <span className="text-[10px] tracking-tight mt-0.5">Explore</span>
        </button>

        <button
          onClick={() => handleTabClick('cart')}
          className={`relative flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
            activeTab === 'cart' ? 'text-orange-600 font-extrabold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <div className="relative">
            <ShoppingBag className={`h-5 w-5 ${activeTab === 'cart' ? 'scale-110' : ''} transition-transform`} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-orange-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full min-w-[16px] h-[16px] flex items-center justify-center border-2 border-white animate-pulse">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Cart</span>
        </button>

        <button
          onClick={() => handleTabClick('wishlist')}
          className={`relative flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
            activeTab === 'wishlist' ? 'text-orange-600 font-extrabold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <div className="relative">
            <Heart className={`h-5 w-5 ${activeTab === 'wishlist' ? 'scale-110 fill-orange-600 text-orange-600' : ''} transition-transform`} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full min-w-[16px] h-[16px] flex items-center justify-center border-2 border-white">
                {wishlistCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Wishlist</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => handleTabClick('admin')}
            className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
              activeTab === 'admin' ? 'text-orange-600 font-extrabold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShieldCheck className={`h-5 w-5 ${activeTab === 'admin' ? 'scale-110' : ''} transition-transform`} />
            <span className="text-[10px] tracking-tight mt-0.5">Admin</span>
          </button>
        )}

        <button
          onClick={() => handleTabClick('profile')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
            activeTab === 'profile' ? 'text-orange-600 font-extrabold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <User className={`h-5 w-5 ${activeTab === 'profile' ? 'scale-110' : ''} transition-transform`} />
          <span className="text-[10px] tracking-tight mt-0.5">{user ? 'Account' : 'Login'}</span>
        </button>
      </div>
    </div>
  );
};

export default MobileBottomNav;
