import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';

export const Layout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [cartCount, setCartCount] = useState(0);

    const handleAddToCart = () => {
        setCartCount(prev => prev + 1);
    };

    const [manualActiveTab, setManualActiveTab] = useState<string | null>(null);

    const getActiveTab = () => {
        if (manualActiveTab) return manualActiveTab;
        if (location.pathname === '/' || location.pathname === '/home') return 'home';
        if (location.pathname === '/shop') return 'shop';
        if (location.pathname === '/profile') return 'profile';
        if (location.pathname === '/course') return 'course';
        return 'home';
    };

    const handleNavigate = (tab: string) => {
        if (tab === 'booking') {
            setManualActiveTab('booking');
            if (location.pathname !== '/') {
                navigate('/');
            }
            // Scroll to booking after navigation
            setTimeout(() => {
                document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            return;
        }

        setManualActiveTab(null); // Reset manual override for other tabs
        if (tab === 'home') navigate('/');
        else navigate(`/${tab}`);
    };

    const isAdmin = location.pathname.startsWith('/admin');

    return (
        <div className="pb-8 min-h-screen">
            {!isAdmin && <Navbar onNavigate={handleNavigate} cartCount={cartCount} />}

            <Outlet context={{ onAddToCart: handleAddToCart }} />

            {!isAdmin && <BottomNav activeTab={getActiveTab()} setActiveTab={handleNavigate} />}
        </div>
    );
};
