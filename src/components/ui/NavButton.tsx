import React from 'react';
import { type LucideIcon } from 'lucide-react';

interface NavButtonProps {
    active: boolean;
    onClick: () => void;
    Icon: LucideIcon;
}

export const NavButton: React.FC<NavButtonProps> = ({ active, onClick, Icon }) => (
    <button
        onClick={onClick}
        className={`p-3 rounded-full transition-all duration-300 relative group flex flex-col items-center justify-center ${active
            ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-110'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
    >
        <Icon
            className={`w-6 h-6 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}
            strokeWidth={active ? 2.5 : 2}
            absoluteStrokeWidth={true}
        />
    </button>
);
