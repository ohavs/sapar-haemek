import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, Play, Check, Instagram, Scissors, Settings, Sun } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { PRODUCTS } from '../data';
import { Marquee } from '../components/ui/Marquee';
import { BarberCard } from '../components/ui/BarberCard';
import { ProductCard } from '../components/ui/ProductCard';
import { BottomSheet } from '../components/ui/BottomSheet';
import { CustomDatePicker } from '../components/ui/CustomDatePicker';
import { Gallery } from '../components/ui/Gallery';
import type { Booking, BlockedDate } from '../services/booking';
import { subscribeToBookings, getBlockedDates, createBooking, saveUser } from '../services/booking';
import type { WeeklySchedule, Service } from '../services/settings';
import { getAdminSettings, getScheduleSettings, getServices } from '../services/settings';
import { subscribeToBarbers, type Barber } from '../services/barbers';
import { Modal } from '../components/ui/Modal';

// Custom TikTok Icon
const TikTokIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
);

interface UserDetails {
    name: string;
    phone: string;
}

const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear();
};

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const { onAddToCart } = useOutletContext<{ onAddToCart: () => void }>();

    // Booking State
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);

    // Subscribe to Barbers
    useEffect(() => {
        const unsub = subscribeToBarbers(setBarbers);
        return () => unsub();
    }, []);
    const [selectedService, setSelectedService] = useState<Service | null>(null); // New State
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isBooked, setIsBooked] = useState(false);

    // Guest Flow State
    const [showUserForm, setShowUserForm] = useState(false);
    const [userDetails, setUserDetails] = useState<UserDetails>({ name: '', phone: '' });
    const [modalMessage, setModalMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // DB State
    const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
    const [existingBookings, setExistingBookings] = useState<Booking[]>([]); // Changed from takenTimes to full bookings
    const [vacationMode, setVacationMode] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
    const [services, setServices] = useState<Service[]>([]); // Services list

    useEffect(() => {
        // Load initial data
        const loadData = async () => {
            // Admin & Settings
            const isAuth = localStorage.getItem('sapar_admin_auth') === 'true';
            setIsAdmin(isAuth);

            const settings = await getAdminSettings();
            setVacationMode(settings.vacationMode);

            const sched = await getScheduleSettings();
            setSchedule(sched);

            const blocked = await getBlockedDates();
            setBlockedDates(blocked);

            const s = await getServices();
            setServices(s);
        };
        loadData();
    }, []);

    useEffect(() => {
        if (!selectedDate) return;

        const unsubscribe = subscribeToBookings(selectedDate, (bookings) => {
            const relevantBookings = selectedBarber
                ? bookings.filter(b => b.barberId === selectedBarber.id)
                : bookings;
            setExistingBookings(relevantBookings);
        });

        return () => unsubscribe();
    }, [selectedDate, selectedBarber]);

    const handleBookingClose = () => {
        setSelectedBarber(null);
        setSelectedService(null);
        setSelectedDate(null);
        setSelectedTime(null);
        setIsBooked(false);
        setShowUserForm(false);
    };

    const handleConfirmBooking = () => {
        if (!selectedTime || !selectedDate || !selectedService) return;

        // Check for existing user
        const storedUser = localStorage.getItem('sapar_user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setUserDetails(user);
            handleFinalizeBooking(user);
        } else {
            setShowUserForm(true);
        }
    };

    const handleFinalizeBooking = async (user = userDetails) => {
        if (!selectedDate || !selectedTime || !selectedBarber || !selectedService) return;
        if (!user.name || !user.phone) {
            setModalMessage({ type: 'error', text: 'אנא מלא שם וטלפון תקינים' });
            return;
        }

        try {
            await createBooking({
                barberId: selectedBarber.id,
                barberName: selectedBarber.name,
                date: selectedDate,
                time: selectedTime,
                customerName: user.name,
                customerPhone: user.phone,
                service: selectedService.name,
                price: selectedService.price,
                duration: selectedService.duration // Store duration too
            });

            // Save user to Firestore (for history/stats)
            await saveUser(user.name, user.phone);

            // Save user locally for next time
            localStorage.setItem('sapar_user', JSON.stringify(user));

            setIsBooked(true);
            setTimeout(() => {
                handleBookingClose();
                navigate('/profile');
            }, 1500);
        } catch (error: any) {
            setModalMessage({ type: 'error', text: error.message || "אירעה שגיאה בקביעת התור" });
        }
    };

    // Parse time string "HH:MM" to minutes from start of day (or just Date comparison)
    const timeToDate = (date: Date, timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        const d = new Date(date);
        d.setHours(h, m, 0, 0);
        return d;
    };

    const isSlotAvailable = (slotStart: Date, durationMinutes: number) => {
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

        // Check against existing bookings
        for (const booking of existingBookings) {
            // Filter by selected barber
            if (selectedBarber && booking.barberId !== selectedBarber.id) continue;

            // Assume booking has duration ? If not in DB, fallback to slot size? 
            // For back-compat, we might not have 'duration' on old bookings.
            // Let's assume old bookings are 30 mins (default).
            // Actually, we should now store duration.
            // But 'Booking' type might need update in `booking.ts` to include `duration`.
            // For now, let's cast or default.

            const bookingDuration = (booking as any).duration || (schedule?.slotDuration || 30);

            const bookingStart = timeToDate(selectedDate!, booking.time);
            const bookingEnd = new Date(bookingStart.getTime() + bookingDuration * 60000);

            // Check overlap
            if (slotStart < bookingEnd && slotEnd > bookingStart) {
                return false;
            }
        }

        // Check against breaks (if any)
        if (schedule && selectedDate) {
            const dayIndex = selectedDate.getDay();
            const breaks = schedule.breaks[dayIndex] || [];
            for (const brk of breaks) {
                // Filter by barber specific break
                if (brk.barberId && selectedBarber && String(brk.barberId) !== String(selectedBarber.id)) continue;

                const breakStart = timeToDate(selectedDate, brk.start);
                const breakEnd = timeToDate(selectedDate, brk.end);

                if (slotStart < breakEnd && slotEnd > breakStart) {
                    return false;
                }
            }
        }

        // Check against blocked dates (Partial blocks)
        if (blockedDates.length > 0 && selectedDate) {
            const dayBlocks = blockedDates.filter(b =>
                isSameDay(b.date, selectedDate) &&
                (!b.barberId || (selectedBarber && b.barberId === selectedBarber.id))
            );

            for (const block of dayBlocks) {
                // If full day block (should be handled by date picker, but verification)
                if (!block.start || !block.end) return false;

                const blockStart = timeToDate(selectedDate, block.start);
                const blockEnd = timeToDate(selectedDate, block.end);

                if (slotStart < blockEnd && slotEnd > blockStart) {
                    return false;
                }
            }
        }

        // Check strict boundaries of working day?
        // Logic already generates slots within bounds, but we must ensure *end* time is also within bounds.
        if (schedule && selectedDate) {
            const dayIndex = selectedDate.getDay();
            const dayConfig = schedule.hours[dayIndex];
            if (dayConfig) {
                const dayEnd = timeToDate(selectedDate, dayConfig.end);
                if (slotEnd > dayEnd) return false;
            }
        }

        return true;
    };

    return (
        <>
            {/* ... Header & Sections ... */}
            {/* Hero Section */}
            <header className="relative min-h-[90vh] flex flex-col justify-end px-6 pb-12 pt-32 overflow-hidden lg:grid lg:grid-cols-2 lg:items-center lg:justify-center lg:min-h-screen lg:px-20 max-w-7xl mx-auto w-full">
                <div className="absolute top-[-20%] right-[-30%] w-[700px] h-[700px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-glow"></div>

                <div className="relative z-10 animate-slide-up lg:order-2">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-px w-8 bg-emerald-500"></div>
                        <span className="text-emerald-400 text-xs font-bold tracking-[0.3em] uppercase">Est. 2024</span>
                    </div>
                    <h1 className="text-[14vw] lg:text-[8vw] font-black leading-[0.8] tracking-tighter text-white mb-6 mix-blend-overlay">
                        <Scissors className="w-[10vw] h-[10vw] lg:w-[6vw] lg:h-[6vw] text-emerald-500 inline-block align-middle transform -rotate-12 animate-cut ml-4" />
                        ספר <br />
                        <span className="metallic-text">העמק.</span>
                    </h1>
                    <p className="text-gray-400 max-w-xs text-lg leading-relaxed mb-8 border-r-2 border-emerald-500 pr-4">
                        חווית תספורת שמגדירה אותך מחדש. המקום בו סטייל פוגש דיוק מוחלט.
                    </p>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <button
                            onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
                            className="group bg-white text-black px-8 py-5 rounded-full font-black text-lg flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all w-full sm:w-max shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(52,211,153,0.4)] hover:scale-105 active:scale-95 cursor-pointer"
                        >
                            הזמן תור עכשיו
                            <ArrowDownLeft className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
                        </button>

                        <div className="flex gap-3 justify-center sm:justify-start">
                            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-emerald-500 hover:text-black hover:border-transparent transition-all cursor-pointer">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-emerald-500 hover:text-black hover:border-transparent transition-all cursor-pointer">
                                <TikTokIcon className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Owner Image */}
                <div className="absolute top-0 -left-16 w-[130%] h-[110%] z-0 pointer-events-none lg:static lg:w-full lg:h-full lg:pointer-events-auto">
                    <img
                        src="/nave.png"
                        className="w-full h-full object-cover object-top mask-gradient opacity-50 mix-blend-hard-light animate-float lg:mask-none lg:opacity-80 lg:rounded-[3rem] lg:object-center"
                        alt="Owner"
                    />
                </div>
            </header>

            {/* Marquee Divider */}
            <Marquee />

            <Gallery />

            {/* Booking Section */}
            <section id="booking" className="px-4 py-10 relative z-10 max-w-7xl mx-auto w-full">
                <div className="flex justify-between items-end mb-10 px-2">
                    <h2 className="text-5xl font-black text-white tracking-tighter">THE <br /> TEAM</h2>
                    <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-emerald-400 font-mono text-sm animate-spin-slow">
                        03
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {barbers.map(barber => (
                        <BarberCard key={barber.id} barber={barber} onClick={setSelectedBarber} />
                    ))}
                </div>
            </section>

            {/* Shop Section */}
            <section className="py-16 bg-gradient-to-b from-transparent to-black/50">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="flex justify-between items-end mb-10 px-6">
                        <h2 className="text-4xl font-black text-white">ESSENTIALS</h2>
                        <button onClick={() => navigate('/shop')} className="text-emerald-400 text-sm font-bold tracking-widest uppercase hover:text-white transition-colors cursor-pointer">ראה הכל</button>
                    </div>

                    <div className="flex overflow-x-auto gap-5 px-6 pb-8 no-scrollbar snap-x md:grid md:grid-cols-4 md:snap-none">
                        {PRODUCTS.map(product => (
                            <ProductCard key={product.id} product={product} onAdd={onAddToCart} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Course Teaser */}
            <section className="px-4 mb-32">
                <div
                    onClick={() => navigate('/course')}
                    className="glass-panel rounded-[3rem] p-10 relative overflow-hidden text-center group cursor-pointer border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-500 active:scale-95"
                >
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070')] bg-cover bg-center opacity-20 group-hover:opacity-40 transition-opacity duration-700 group-hover:scale-105"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>

                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-emerald-500 transition-all duration-300 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                            <Play className="w-8 h-8 text-white fill-current ml-1" />
                        </div>
                        <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tight">Master Class</h2>
                        <p className="text-gray-300 font-light">למד את הטכניקות הסודיות של הדירוג</p>
                    </div>
                </div>
            </section>

            {/* Booking Bottom Sheet */}
            <BottomSheet
                isOpen={!!selectedBarber}
                onClose={handleBookingClose}
                title={selectedBarber ? `תור ל${selectedBarber.name}` : ''}
            >
                {isBooked ? (
                    <div className="text-center py-10 animate-fade-in">
                        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
                            <Check className="w-10 h-10 text-black" />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-2">התור נקבע!</h3>
                        <p className="text-gray-400">
                            {selectedDate && `${selectedDate.getDate()}.${selectedDate.getMonth() + 1}`} בשעה {selectedTime}
                        </p>
                    </div>
                ) : showUserForm ? (
                    <div className="space-y-6 animate-fade-in">
                        {/* User Form Content - Unchanged */}
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">פרטים אישיים</h3>
                            <p className="text-gray-400 text-sm">פעם ראשונה? נשמח להכיר אותך!</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">שם מלא</label>
                                <input
                                    type="text"
                                    value={userDetails.name}
                                    onChange={e => setUserDetails({ ...userDetails, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none transition-colors text-right"
                                    placeholder="ישראל ישראלי"
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">מספר נייד</label>
                                <input
                                    type="tel"
                                    value={userDetails.phone}
                                    onChange={e => setUserDetails({ ...userDetails, phone: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none transition-colors text-right"
                                    placeholder="050-0000000"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => handleFinalizeBooking()}
                            disabled={!userDetails.name || !userDetails.phone}
                            className={`w-full font-black py-4 rounded-xl text-lg transition-all shadow-lg flex items-center justify-center gap-2 mt-4
                                ${userDetails.name && userDetails.phone
                                    ? 'bg-emerald-500 text-black hover:bg-emerald-400 cursor-pointer'
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                        >
                            שמור וקבע תור
                        </button>
                    </div>
                ) : !selectedService ? (
                    <div className="space-y-4 animate-fade-in">
                        <p className="text-gray-400 text-center mb-4">בחר סוג טיפול</p>
                        <div className="grid gap-3">
                            {services.map(service => (
                                <button
                                    key={service.id}
                                    onClick={() => setSelectedService(service)}
                                    className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between hover:bg-white/10 hover:border-emerald-500/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                            <Scissors className="w-5 h-5" />
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-white">{service.name}</div>
                                            <div className="text-xs text-gray-400 flex flex-col">
                                                <span>{service.duration} דקות</span>
                                                {service.note && <span className="text-emerald-400/80 mt-1">{service.note}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-emerald-400">₪{service.price}</div>
                                </button>
                            ))}
                            {services.length === 0 && (
                                <p className="text-center text-gray-500">טוען טיפולים...</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in">

                        {/* Selected Service Badge */}
                        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black">
                                    <Scissors className="w-4 h-4" />
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-xs text-emerald-400 uppercase tracking-wider">טיפול נבחר</div>
                                    <div className="font-bold text-white">{selectedService.name}</div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedService(null)} className="text-xs text-gray-400 hover:text-white underline">
                                שנה
                            </button>
                        </div>

                        {/* Date Selection */}
                        <div className="mb-6">
                            <label className="text-gray-400 text-sm mb-3 block pr-2">בחר תאריך</label>
                            <CustomDatePicker
                                selectedDate={selectedDate || new Date()}
                                onChange={(date) => {
                                    setSelectedDate(date);
                                    setSelectedTime(null);
                                }}
                                excludeDates={blockedDates
                                    .filter(d => !d.barberId || (selectedBarber && d.barberId === selectedBarber.id))
                                    .map(d => d.date)
                                }
                                workingDays={schedule?.workingDays || [0, 1, 2, 3, 4, 5]}
                            />
                        </div>

                        {/* Time Selection */}
                        <div className={`transition-opacity duration-300 ${selectedDate ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                            <p className="text-gray-400 text-sm mb-3">בחר שעה</p>
                            <div className="grid grid-cols-3 gap-3">
                                {(() => {
                                    if (!selectedDate || !schedule) return <p className="col-span-3 text-center text-gray-400">אנא בחר תאריך</p>;

                                    const dayIndex = selectedDate.getDay();
                                    const dayConfig = schedule.hours[dayIndex] || { start: '10:00', end: '20:00' };

                                    // Generate slots
                                    const slots: { time: string, available: boolean }[] = [];
                                    let [startHour, startMin] = dayConfig.start.split(':').map(Number);
                                    let [endHour, endMin] = dayConfig.end.split(':').map(Number);

                                    // Initialize current checking time based on SELECTED DATE
                                    let current = new Date(selectedDate);
                                    current.setHours(startHour, startMin, 0, 0);

                                    const end = new Date(selectedDate);
                                    end.setHours(endHour, endMin, 0, 0);

                                    const slotGridDuration = schedule.slotDuration || 30;
                                    const now = new Date();

                                    while (current < end) {
                                        // Filter past times ONLY if selected date is today
                                        if (isSameDay(selectedDate, now) && current < now) {
                                            current.setMinutes(current.getMinutes() + slotGridDuration);
                                            continue;
                                        }

                                        const timeString = current.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });

                                        // Availability Check
                                        const isAvailable = isSlotAvailable(current, selectedService.duration);

                                        slots.push({ time: timeString, available: isAvailable });

                                        current.setMinutes(current.getMinutes() + slotGridDuration);
                                    }

                                    // Sort slots by time just in case (though loop is chronological)
                                    // slots.sort(...) 

                                    if (slots.length === 0) {
                                        return <p className="col-span-3 text-center text-gray-500 bg-white/5 p-4 rounded-xl">אין תורים פנויים ביום זה</p>;
                                    }

                                    return slots.map(({ time, available }) => (
                                        <button
                                            key={time}
                                            disabled={!available}
                                            onClick={() => available && setSelectedTime(time)}
                                            className={`py-3 border rounded-xl text-lg font-bold transition-all relative overflow-hidden flex flex-col items-center justify-center gap-1
                                                    ${!available
                                                    ? 'opacity-50 cursor-not-allowed bg-red-500/10 border-red-500/20 text-gray-500' // Disabled State
                                                    : selectedTime === time
                                                        ? 'bg-white text-black border-transparent shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105'
                                                        : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            {time}
                                            {!available && (
                                                <span className="text-[10px] font-normal text-red-400">תפוס</span>
                                            )}
                                        </button>
                                    ));
                                })()}
                            </div>
                        </div>

                        <button
                            onClick={handleConfirmBooking}
                            disabled={!selectedTime || !selectedDate}
                            className={`w-full font-black py-5 rounded-2xl text-xl transition-all shadow-lg flex items-center justify-center gap-2
                                    ${selectedTime && selectedDate
                                    ? 'bg-emerald-500 text-black hover:bg-emerald-400 cursor-pointer'
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                        >
                            המשך
                            <Check className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </BottomSheet>

            {/* ... Rest of components ... */}


            {/* Admin Shortcut - ALWAYS VISIBLE BUTTON */}
            <button
                onClick={() => navigate('/admin')}
                className="fixed bottom-6 left-6 z-50 bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/10 shadow-lg hover:bg-white/20 transition-all opacity-50 hover:opacity-100"
                title="ניהול"
            >
                <Settings className="w-6 h-6 text-emerald-500" />
            </button>

            {/* Vacation Mode Overlay */}
            {vacationMode && (
                <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 text-center">
                    <div className="max-w-md">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Sun className="w-12 h-12 text-orange-500 animate-pulse-glow" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2">אנחנו בחופשה!</h2>
                        <p className="text-gray-400 text-lg mb-8">המספרה סגורה כרגע לקביעת תורים. נחזור לפעילות בקרוב.</p>
                        {isAdmin && (
                            <button
                                onClick={() => navigate('/admin')}
                                className="bg-white/10 px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-all"
                            >
                                כניסה לניהול
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Custom Modal for Messages */}
            <Modal
                isOpen={!!modalMessage}
                onClose={() => setModalMessage(null)}
                title={modalMessage?.type === 'error' ? 'שגיאה' : 'הצלחה'}
                text={modalMessage?.text || ''}
                type={modalMessage?.type || 'success'}
            />
        </>
    );
};

