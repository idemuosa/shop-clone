import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Zap, Smartphone, Laptop, Watch, ShoppingBag, BookOpen, Footprints, Headphones, Box } from "lucide-react";
import { API_URL } from "@/lib/api";

interface Category {
  id: number;
  name: string;
  image: string;
}

interface CategorySectionProps {
  onSelectCategory?: (category: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  "Electronics": <Smartphone className="h-5 w-5" />,
  "Fashion": <ShoppingBag className="h-5 w-5" />,
  "Home & Decor": <Box className="h-5 w-5" />,
  "Sports": <Footprints className="h-5 w-5" />,
  "Gadgets": <Smartphone className="h-5 w-5" />,
  "Laptops": <Laptop className="h-5 w-5" />,
  "Watches": <Watch className="h-5 w-5" />,
  "Audio": <Headphones className="h-5 w-5" />,
  "Books": <BookOpen className="h-5 w-5" />,
};

const colorMap = [
  { color: "bg-blue-50 text-blue-600", border: "border-blue-100" },
  { color: "bg-orange-50 text-orange-600", border: "border-orange-100" },
  { color: "bg-green-50 text-orange-600", border: "border-green-100" },
  { color: "bg-pink-50 text-pink-600", border: "border-pink-100" },
  { color: "bg-green-50 text-green-600", border: "border-green-100" },
  { color: "bg-red-50 text-red-600", border: "border-red-100" },
  { color: "bg-yellow-50 text-yellow-600", border: "border-yellow-100" },
];

export default function CategorySection({ onSelectCategory }: CategorySectionProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/categories/`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setCategories(data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <section className="py-4 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-orange-600 p-1.5 rounded-md">
              <Zap className="h-3.5 w-3.5 text-white fill-white" />
            </div>
            <h2 className="text-sm md:text-base font-black text-black uppercase tracking-tight">Shop By <span className="text-orange-600 italic">Category</span></h2>
          </div>
          <button 
            onClick={() => onSelectCategory?.("all")}
            className="text-xs font-bold text-orange-600 hover:underline uppercase tracking-widest"
          >
            See All
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {categories.map((cat, idx) => {
            const theme = colorMap[idx % colorMap.length];
            return (
              <motion.div
                key={cat.id}
                whileHover={{ y: -3, scale: 1.02 }}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border ${theme.border} ${theme.color} cursor-pointer transition-all hover:shadow-xs group`}
                onClick={() => onSelectCategory?.(cat.name)}
              >
                <div className="mb-2 group-hover:scale-110 transition-transform duration-300">
                  {iconMap[cat.name] || <Box className="h-5 w-5" />}
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-center">{cat.name}</h3>
              </motion.div>
            );
          })}
          {categories.length === 0 && (
             <div className="col-span-full py-6 text-center border border-dashed border-gray-100 rounded-2xl">
                <Box className="h-6 w-6 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-medium italic">No categories found in database.</p>
             </div>
          )}
        </div>
      </div>
    </section>
  );
}
