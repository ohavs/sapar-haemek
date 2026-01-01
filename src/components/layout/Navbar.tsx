import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
    onNavigate: (page: string) => void;
    cartCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, cartCount }) => {
    const [logoClicks, setLogoClicks] = React.useState(0);
    const [showPinModal, setShowPinModal] = React.useState(false);
    const [pin, setPin] = React.useState('');
    const navigate = useNavigate();

    const handleLogoClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setLogoClicks(prev => prev + 1);

        // Reset if no click for 2 seconds
        if (logoClicks === 0) {
            setTimeout(() => setLogoClicks(0), 2000);
        }

        if (logoClicks >= 4) { // 5th click
            setShowPinModal(true);
            setLogoClicks(0);
        } else {
            onNavigate('home');
        }
    };

    const [adminPassword, setAdminPassword] = React.useState('1234');

    React.useEffect(() => {
        // Dynamic import to avoid circular dependency issues if any, or just direct import
        import('../../services/settings').then(mod => {
            mod.getAdminSettings().then(settings => {
                if (settings.adminPassword) {
                    setAdminPassword(settings.adminPassword);
                }
            });
        });
    }, []);

    const [error, setError] = React.useState('');

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === adminPassword) {
            setShowPinModal(false);
            setPin('');
            setError('');
            localStorage.setItem('sapar_admin_auth', 'true');
            navigate('/admin');
        } else {
            setError('קוד שגוי, נסה שנית');
            setPin('');
        }
    };

    return (
        <>
            <nav className="fixed top-0 w-full z-40 px-6 py-6 flex justify-between items-center pointer-events-none mix-blend-difference">
                <div className="flex items-center gap-2 pointer-events-auto glass-panel px-5 py-3 rounded-full border-white/10 cursor-pointer selects-none" onClick={handleLogoClick}>
                    <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                    <span className="font-black text-white tracking-widest text-xs">SAPAR HA'EMEK</span>
                </div>
                <div className="pointer-events-auto glass-panel p-2 rounded-full relative cursor-pointer" onClick={() => onNavigate('shop')}>
                    <ShoppingBag className="text-white w-5 h-5" />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold text-black border border-black animate-bounce">
                            {cartCount}
                        </span>
                    )}
                </div>
            </nav>

            {/* PIN Modal */}
            {showPinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="glass-panel p-8 rounded-3xl w-80 text-center relative pointer-events-auto">
                        <button onClick={() => setShowPinModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
                        <h3 className="text-xl font-bold text-white mb-6">כניסה למנהלים</h3>
                        <form onSubmit={handlePinSubmit}>
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-white text-xl tracking-widest mb-6 focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="****"
                                autoFocus
                            />
                            {error && <p className="text-red-500 text-sm text-center font-bold animate-pulse">{error}</p>}
                            <button type="submit" className="w-full bg-emerald-500 text-black font-bold py-3 rounded-xl hover:bg-emerald-400 transition-colors">
                                אישור
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};
