import React, { useEffect, useState } from 'react';
import { User, Phone, Calendar, Trash2, Bell, Download, ChevronLeft } from 'lucide-react';
import type { Booking } from '../services/booking';
import { getUserHistory, deleteBooking, updateUserPreference } from '../services/booking';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Modal } from '../components/ui/Modal';

export const Profile: React.FC = () => {
    const [user, setUser] = useState<{ name: string, phone: string, notificationTime?: number } | null>(null);
    const [history, setHistory] = useState<Booking[]>([]);
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        text: string;
        type?: 'success' | 'error' | 'warning';
        onConfirm?: () => void;
        showConfirmButton?: boolean;
    }>({ isOpen: false, title: '', text: '' });

    const { isInstallable, install } = usePWAInstall();

    const loadHistory = (phone: string) => {
        getUserHistory(phone).then(data => {
            setHistory(data);
        });
    };

    useEffect(() => {
        const stored = localStorage.getItem('sapar_user');
        if (stored) {
            const parsedUser = JSON.parse(stored);
            setUser(parsedUser);
            loadHistory(parsedUser.phone);
        }
    }, []);

    const handleCancelBooking = (bookingId: string) => {
        setModalConfig({
            isOpen: true,
            title: 'ביטול תור',
            text: 'האם אתה בטוח שברצונך לבטל את התור?',
            type: 'warning',
            showConfirmButton: true,
            onConfirm: async () => {
                try {
                    await deleteBooking(bookingId);
                    if (user) loadHistory(user.phone);
                    setModalConfig({ isOpen: true, title: 'הצלחה', text: 'התור בוטל בהצלחה', showConfirmButton: false });
                } catch (error) {
                    setModalConfig({ isOpen: true, title: 'שגיאה', text: 'אירעה שגיאה בביטול התור', type: 'error' });
                }
            }
        });
    };

    if (!user) {
        return (
            <div className="min-h-screen pt-32 px-6 text-center">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <User className="w-10 h-10 text-gray-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">אורח</h2>
                <p className="text-gray-400 mb-8">אין פרטים שמורים. הזמן תור כדי ליצור פרופיל.</p>
            </div>
        );
    }

    // User requested "Allow cancelling". Usually only future bookings.
    const now = new Date();

    return (
        <div className="min-h-screen bg-black text-white pb-24">
            {/* Header */}
            <div className="relative h-64 bg-gradient-to-b from-emerald-900/20 to-black">
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                    <div className="w-24 h-24 bg-[#1a1a1a] rounded-full border-4 border-black p-1">
                        <div className="w-full h-full bg-emerald-500 rounded-full flex items-center justify-center text-3xl font-black text-black">
                            {user.name.charAt(0)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-16 px-6 text-center">
                <h1 className="text-3xl font-black mb-1">{user.name}</h1>
                <div className="flex items-center justify-center gap-2 text-gray-400 text-sm dir-ltr">
                    <span>{user.phone}</span>
                    <Phone className="w-3 h-3" />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 px-6 mt-8">
                <div className="glass-panel p-4 rounded-2xl text-center">
                    <div className="text-3xl font-black text-emerald-400 mb-1">{history.length}</div>
                    <div className="text-xs text-gray-400">תורים שהוזמנו</div>
                </div>
                {/* 
                <div className="glass-panel p-4 rounded-2xl text-center">
                    <div className="text-3xl font-black text-white mb-1">0</div>
                    <div className="text-xs text-gray-400">ביטולים</div>
                </div>
                */}
            </div>

            {/* History */}
            <div className="px-6 mt-10">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    היסטוריית תורים
                </h3>
                <div className="space-y-3">
                    {history.length === 0 ? (
                        <div className="text-center text-gray-500 py-4">אין תורים עדיין</div>
                    ) : (
                        history.map(item => {
                            const isFuture = item.date > now;
                            return (
                                <div key={item.id} className="glass-panel p-4 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${isFuture ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
                                            {item.date.getDate()}.{item.date.getMonth() + 1}
                                        </div>
                                        <div>
                                            <div className="font-bold">{item.service || 'תספורת'}</div>
                                            <div className="text-xs text-gray-400">{item.barberName} • {item.time}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="font-mono text-emerald-400">₪{item.price || 80}</div>
                                        {isFuture && (
                                            <button
                                                onClick={() => item.id && handleCancelBooking(item.id)}
                                                className="bg-red-500/10 p-2 rounded-lg text-red-500 hover:bg-red-500/20"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Notification Settings */}
            <div className="px-6 mt-10">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-emerald-500" />
                    הגדרות התראות
                </h3>
                <div className="glass-panel p-4 rounded-2xl">
                    <label className="block text-sm text-gray-400 mb-2">תזמון התראה לפני תור</label>
                    <select
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        value={user.notificationTime || 2}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            setUser({ ...user, notificationTime: val });
                            const stored = localStorage.getItem('sapar_user');
                            if (stored) {
                                const parsed = JSON.parse(stored);
                                parsed.notificationTime = val;
                                localStorage.setItem('sapar_user', JSON.stringify(parsed));
                                updateUserPreference(user.phone, { notificationTime: val });
                            }
                        }}
                    >
                        <option value={1} className="bg-black text-white">שעה לפני</option>
                        <option value={2} className="bg-black text-white">שעתיים לפני</option>
                        <option value={24} className="bg-black text-white">יום לפני</option>
                        <option value={0} className="bg-black text-white">ללא התראות</option>
                    </select>
                </div>
            </div>

            {/* App Settings */}
            {/* App Settings - Always show install button if strictly not in PWA mode (this is a simplified check, ideally check window.matchMedia) */}
            <div className="px-6 mt-10 mb-8">
                <button
                    onClick={() => {
                        if (isInstallable) {
                            install();
                        } else {
                            setModalConfig({
                                isOpen: true,
                                title: 'התקנת האפליקציה',
                                text: 'כדי להתקין את האפליקציה:\n\nבאנדרואיד: לחץ על תפריט הדפדפן (3 נקודות) > התקן אפליקציה\n\nבאייפון: לחץ על כפתור השיתוף > הוסף למסך הבית',
                                showConfirmButton: false
                            });
                        }
                    }}
                    className={`w-full glass-panel p-4 rounded-2xl flex items-center justify-between group hover:bg-white/5 transition-colors ${!isInstallable ? 'opacity-50' : ''}`}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black">
                            <Download className="w-5 h-5" />
                        </div>
                        <div className="text-right">
                            <div className="font-bold">התקנת האפליקציה</div>
                            <div className="text-xs text-gray-400">{isInstallable ? 'גישה מהירה ממסך הבית' : 'הוראות התקנה ידנית'}</div>
                        </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:-translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Existing Modal component handles the display */}
            <Modal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                title={modalConfig.title}
                text={modalConfig.text}
                type={modalConfig.type}
                showConfirmButton={modalConfig.showConfirmButton}
                onConfirm={modalConfig.onConfirm}
            />
        </div>
    );
};
