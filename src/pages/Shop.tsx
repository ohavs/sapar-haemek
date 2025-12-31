import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PRODUCTS } from '../data';
import { ProductCard } from '../components/ui/ProductCard';
import { useOutletContext } from 'react-router-dom';

export const Shop: React.FC = () => {
    const navigate = useNavigate();
    const { onAddToCart } = useOutletContext<{ onAddToCart: () => void }>();

    return (
        <div className="px-6 pt-32 pb-32 min-h-screen animate-slide-up">
            <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer">
                <ArrowRight className="w-5 h-5" />
                חזרה
            </button>
            <h2 className="text-4xl font-black text-white mb-8">THE SHOP</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {PRODUCTS.map(product => (
                    <ProductCard key={product.id} product={product} onAdd={onAddToCart} />
                ))}
                {PRODUCTS.map(product => (
                    <ProductCard key={'dup' + product.id} product={product} onAdd={onAddToCart} />
                ))}
            </div>
        </div>
    );
};
