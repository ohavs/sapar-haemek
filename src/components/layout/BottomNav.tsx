import React from 'react';
import { Home, Calendar, ShoppingBag, User } from 'lucide-react';
import { NavButton } from '../ui/NavButton';

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
    return (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-auto">
            <div className="glass-nav rounded-full px-2 py-2 flex items-center gap-2 scale-90 md:scale-100 transition-all duration-300 hover:scale-105">
                <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} Icon={Home} />
                <NavButton
                    active={activeTab === 'booking'}
                    onClick={() => {
                        setActiveTab('booking');
                        setTimeout(() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' }), 100);
                    }}
                    Icon={Calendar}
                />
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <NavButton active={activeTab === 'shop'} onClick={() => setActiveTab('shop')} Icon={ShoppingBag} />
                <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} Icon={User} />
            </div>
        </div>
    );
};
