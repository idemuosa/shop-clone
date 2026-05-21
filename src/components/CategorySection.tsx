import { motion } from "motion/react";
import { Zap, Smartphone, Laptop, Watch, ShoppingBag, BookOpen, Footprints, Headphones, Box } from "lucide-react";
import { useState, useEffect } from "react";
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
  "Electronics": <Smartphone className="h-8 w-8" />,
  "Fashion": <ShoppingBag className="h-8 w-8" />,
  "Home & Decor": <Box className="h-8 w-8" />,
  "Sports": <Footprints className="h-8 w-8" />,
  "Gadgets": <Smartphone className="h-8 w-8" />,
  "Laptops": <Laptop className="h-8 w-8" />,
  "Watches": <Watch className="h-8 w-8" />,
  "Audio": <Headphones className="h-8 w-8" />,
  "Books": <BookOpen className="h-8 w-8" />,
};

const colorMap = [
  { color: "bg-blue-50 text-blue-600", border: "border-blue-100" },
  { color: "bg-purple-50 text-purple-600", border: "border-purple-100" },
  { color: "bg-green-50 text-purple-600", border: "border-green-100" },
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
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <section className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-lg">
              <Zap className="h-5 w-5 text-white fill-white" />
            </div>
            <h2 className="text-xl font-black text-black uppercase tracking-tight">Shop By <span className="text-purple-600 italic">Category</span></h2>
          </div>
          <button 
            onClick={() => onSelectCategory?.("all")}
            className="text-sm font-bold text-purple-600 hover:underline uppercase tracking-widest"
          >
            See All
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {categories.map((cat, idx) => {
            const theme = colorMap[idx % colorMap.length];
            return (
              <motion.div
                key={cat.id}
                whileHover={{ y: -5, scale: 1.02 }}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border ${theme.border} ${theme.color} cursor-pointer transition-all hover:shadow-md group`}
                onClick={() => onSelectCategory?.(cat.name)}
              >
                <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                  {iconMap[cat.name] || <Box className="h-8 w-8" />}
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-center">{cat.name}</h3>
              </motion.div>
            );
          })}
          {categories.length === 0 && (
             <div className="col-span-full py-10 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                <Box className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium italic">No categories found in database.</p>
             </div>
          )}
        </div>
      </div>
    </section>
  );
}
