import { motion } from "motion/react";
import { Zap, Smartphone, Laptop, Watch, ShoppingBag, BookOpen, Footprints, Headphones } from "lucide-react";

const categories = [
  { name: "Gadgets", icon: <Smartphone className="h-8 w-8" />, color: "bg-blue-50 text-blue-600", border: "border-blue-100" },
  { name: "Laptops", icon: <Laptop className="h-8 w-8" />, color: "bg-purple-50 text-purple-600", border: "border-purple-100" },
  { name: "Watches", icon: <Watch className="h-8 w-8" />, color: "bg-orange-50 text-orange-600", border: "border-orange-100" },
  { name: "Fashion", icon: <ShoppingBag className="h-8 w-8" />, color: "bg-pink-50 text-pink-600", border: "border-pink-100" },
  { name: "Sneakers", icon: <Footprints className="h-8 w-8" />, color: "bg-green-50 text-green-600", border: "border-green-100" },
  { name: "Audio", icon: <Headphones className="h-8 w-8" />, color: "bg-red-50 text-red-600", border: "border-red-100" },
  { name: "Books", icon: <BookOpen className="h-8 w-8" />, color: "bg-yellow-50 text-yellow-600", border: "border-yellow-100" },
];

interface CategorySectionProps {
  onSelectCategory?: (category: string) => void;
}

export default function CategorySection({ onSelectCategory }: CategorySectionProps) {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2 rounded-lg">
              <Zap className="h-5 w-5 text-white fill-white" />
            </div>
            <h2 className="text-xl font-black text-black uppercase tracking-tight">Shop By <span className="text-orange-600 italic">Category</span></h2>
          </div>
          <button 
            onClick={() => onSelectCategory?.("all")}
            className="text-sm font-bold text-orange-600 hover:underline uppercase tracking-widest"
          >
            See All
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {categories.map((cat, idx) => (
            <motion.div 
              key={cat.name}
              whileHover={{ y: -5, scale: 1.02 }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border ${cat.border} ${cat.color} cursor-pointer transition-all hover:shadow-md group`}
              onClick={() => onSelectCategory?.(cat.name)}
            >
              <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                {cat.icon}
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-center">{cat.name}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
