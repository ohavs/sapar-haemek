import React from 'react';
import { Plus } from 'lucide-react';
import { PRODUCTS } from '../../data';

interface ProductCardProps {
    product: typeof PRODUCTS[0];
    onAdd: (product: typeof PRODUCTS[0]) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd }) => (
    <div className="min-w-[180px] snap-center">
        <div className="glass-panel rounded-[2rem] p-4 h-full flex flex-col justify-between group hover:border-emerald-500/30 transition-colors duration-500">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4 bg-gray-900 cursor-pointer">
                <img src={product.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" alt={product.name} />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
            </div>
            <div>
                <h4 className="font-bold text-white text-xl leading-tight mb-1">{product.name}</h4>
                <div className="flex justify-between items-center">
                    <p className="text-gray-400 text-sm">₪{product.price}</p>
                    <button
                        onClick={() => onAdd(product)}
                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-all active:scale-90 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    </div>
);
