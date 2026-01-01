import React from 'react';
import { ArrowUpLeft } from 'lucide-react';
import type { Barber } from '../../services/barbers';

interface BarberCardProps {
    barber: Barber;
    onClick: (barber: Barber) => void;
}

export const BarberCard: React.FC<BarberCardProps> = ({ barber, onClick }) => (
    <div
        onClick={() => onClick(barber)}
        className="relative group overflow-hidden rounded-[2.5rem] h-80 bg-gray-900 cursor-pointer transition-all duration-500 hover:scale-[1.02] active:scale-95 border border-white/5"
    >
        <img src={barber.image} alt={barber.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 grayscale-0 md:grayscale group-hover:grayscale-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90"></div>

        <div className="absolute bottom-0 p-6 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
            <p className="text-emerald-400 font-bold text-[10px] tracking-[0.2em] uppercase mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">{barber.specialty}</p>
            <h3 className="text-4xl font-black text-white leading-none mb-1">{barber.name}</h3>
        </div>

        <div className="absolute top-5 right-5 w-10 h-10 border border-white/20 rounded-full flex items-center justify-center text-white/50 group-hover:bg-emerald-500 group-hover:text-black group-hover:border-transparent transition-all duration-300">
            <ArrowUpLeft className="w-5 h-5" />
        </div>
    </div>
);
