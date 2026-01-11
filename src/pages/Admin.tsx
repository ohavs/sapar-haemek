import React, { useState, useEffect } from 'react';
import { PRODUCTS } from '../data';
import { Calendar, Package, Clock, LogOut, Trash2, Plus, BarChart3, ChevronRight, Settings, AlertCircle, ChevronDown, Check, Phone, Sun, Moon, Scissors, User, Edit2, X, Camera, Lock, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CustomDatePicker } from '../components/ui/CustomDatePicker';
import { Modal } from '../components/ui/Modal';
import type { Booking, BlockedDate } from '../services/booking';
import type { AdminSettings, WeeklySchedule, Service, GalleryImage } from '../services/settings';
import { getAdminSettings, updateAdminSettings, subscribeToSettings, getScheduleSettings, updateScheduleSettings, subscribeToSchedule, getServices, addService, deleteService, updateService, subscribeToGallery, addGalleryImage, deleteGalleryImage, updateGalleryImage } from '../services/settings';
import { blockDate as blockDateService, getBlockedDates, deleteBlockedDate, subscribeToFutureBookings, deleteBooking, updateBooking, checkSlotAvailability } from '../services/booking';
import { subscribeToBarbers, updateBarber, addBarber, deleteBarber, type Barber } from '../services/barbers';


const TABS = [
    { id: 'schedule', label: 'ניהול יומן', icon: Settings },
    { id: 'services', label: 'טיפולים', icon: Scissors },
    { id: 'appointments', label: 'תורים', icon: Calendar },
    { id: 'products', label: 'מוצרים', icon: Package },
    { id: 'gallery', label: 'גלריה', icon: ImageIcon },
    { id: 'reports', label: 'דוחות', icon: BarChart3 },
    { id: 'general', label: 'הגדרות', icon: Lock },
];

// No MOCK needed


const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

// --- Custom Components ---

const CustomSelect = ({
    value,
    onChange,
    options,
    className = "",
    placeholder = ""
}: {
    value: string;
    onChange: (val: string) => void;
    options: { value: string, label: string }[];
    className?: string;
    placeholder?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white flex items-center justify-between hover:bg-white/10 transition-colors"
            >
                <span>{options.find(o => o.value === value)?.label || placeholder || value}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute top-full mt-2 left-0 w-full bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-[101] max-h-48 overflow-y-auto no-scrollbar animate-fade-in">
                        {options.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-right px-4 py-2 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors ${value === opt.value ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-300'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const TimePicker = ({
    time,
    onChange,
    disabled = false
}: {
    time: string;
    onChange: (time: string) => void;
    disabled?: boolean;
}) => {
    const [h, m] = time.split(':');

    const handleHChange = (newH: string) => onChange(`${newH}:${m}`);
    const handleMChange = (newM: string) => onChange(`${h}:${newM}`);

    return (
        <div className={`flex items-center gap-1 ${disabled ? 'opacity-30 pointer-events-none' : ''}`} dir="ltr">
            <CustomSelect
                value={h}
                onChange={handleHChange}
                options={HOURS.map(h => ({ value: h, label: h }))}
                className="w-20"
            />
            <span className="text-gray-500">:</span>
            <CustomSelect
                value={m}
                onChange={handleMChange}
                options={MINUTES.map(m => ({ value: m, label: m }))}
                className="w-20"
            />
        </div>
    );
};

// --- Main Component ---

export const Admin: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('schedule');
    const [barbers, setBarbers] = useState<Barber[]>([]); // Dynamic Barbers
    const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
    const [products] = useState(PRODUCTS);

    // Barber Management State
    const [isBarberModalOpen, setIsBarberModalOpen] = useState(false);
    const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
    const [barberForm, setBarberForm] = useState({ name: '', specialty: '' });

    // Load Barbers
    useEffect(() => {
        const unsub = subscribeToBarbers((updatedBarbers) => {
            setBarbers(updatedBarbers);
            // Default select first barber if none selected
            setSelectedBarber(prev => {
                if (prev) {
                    // Update current selected barber object if it changed
                    const found = updatedBarbers.find(b => b.id.toString() === prev.id.toString());
                    return found || updatedBarbers[0] || null;
                }
                return updatedBarbers[0] || null;
            });
        });
        return () => unsub();
    }, []);


    const [settings, setSettings] = useState<AdminSettings>({ adminPassword: '123', vacationMode: false });
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [isWeeklyHoursOpen, setIsWeeklyHoursOpen] = useState(false);
    const [isBreaksOpen, setIsBreaksOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    // Blocked Dates State
    const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

    useEffect(() => {
        const unsubGallery = subscribeToGallery(setGalleryImages);
        return () => unsubGallery();
    }, []);

    // Gallery Editing State
    const [editingImageId, setEditingImageId] = useState<string | null>(null);
    const [imageTag, setImageTag] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isBlocking, setIsBlocking] = useState(false);
    const [blockBarberId, setBlockBarberId] = useState<string>('all');

    // Sync "Add Break" barber with global selected barber
    useEffect(() => {
        if (selectedBarber) {
            setNewBreakBarberId(selectedBarber.id.toString());
        } else {
            setNewBreakBarberId('all');
        }
    }, [selectedBarber]);

    // Live Data
    const [appointments, setAppointments] = useState<Booking[]>([]);

    // Schedule State
    const [duration, setDuration] = useState('30');
    const [buffer, setBuffer] = useState('5');
    const [schedule, setSchedule] = useState<WeeklySchedule['hours']>({});
    const [workingDays, setWorkingDays] = useState<number[]>([]);

    // Breaks State
    const [breaks, setBreaks] = useState<{ start: string, end: string, barberId?: string }[]>([]);
    const [newBreakStart, setNewBreakStart] = useState('13:00');
    const [newBreakEnd, setNewBreakEnd] = useState('13:30');
    const [newBreakBarberId, setNewBreakBarberId] = useState<string>('all'); // 'all' or specific barber id

    // Blocking State
    const [isFullDayBlock, setIsFullDayBlock] = useState(true);
    const [blockStartTime, setBlockStartTime] = useState('09:00');
    const [blockEndTime, setBlockEndTime] = useState('17:00');

    // UI State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        text: string;
        type?: 'success' | 'error' | 'warning';
        onConfirm?: () => void;
        showConfirmButton?: boolean;
    }>({ isOpen: false, title: '', text: '' });


    // Services State
    const [services, setServices] = useState<Service[]>([]);
    const [newService, setNewService] = useState<Partial<Service>>({ name: '', price: 0, duration: 30 });
    const [isAddingService, setIsAddingService] = useState(false);
    const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [editDate, setEditDate] = useState<Date | null>(null);
    const [editTime, setEditTime] = useState<string | null>(null);
    const [editBarberId, setEditBarberId] = useState<string | null>(null);
    const [isSavingBooking, setIsSavingBooking] = useState(false);
    const [editAvailableSlots, setEditAvailableSlots] = useState<string[]>([]);

    // Calculate available slots for editing
    useEffect(() => {
        if (!editingBooking || !editDate || !editBarberId || !schedule) return;

        const calcSlots = async () => {
            const dayIndex = editDate.getDay();
            const dayConfig = schedule[dayIndex]; // Ensure schedule is Hours map? Yes it is Record<number, {start, end}>

            if (!dayConfig) {
                setEditAvailableSlots([]);
                return;
            }
            let [startHour, startMin] = dayConfig.start.split(':').map(Number);
            let [endHour, endMin] = dayConfig.end.split(':').map(Number);

            let current = new Date(editDate);
            current.setHours(startHour, startMin, 0, 0);

            const end = new Date(editDate);
            end.setHours(endHour, endMin, 0, 0);

            // Fetch availability for all generated slots
            // Optimization: checkSlotAvailability is one-by-one.
            // We can iterate.

            const validSlots: string[] = [];

            while (current < end) {
                const timeStr = current.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

                // Don't check availability for the CURRENT booking's own slot (if same time/barber/date)
                const isOwnSlot = timeStr === editingBooking.time &&
                    editDate.getTime() === editingBooking.date.getTime() && // editingBooking.date might be Timestamp date obj
                    // Wait, editingBooking.date comes from Firestore logic, it's a Date object in our app state per previous mapping.
                    // But `isSameDay` check is better.
                    editDate.getDate() === editingBooking.date.getDate() &&
                    editDate.getMonth() === editingBooking.date.getMonth() &&
                    Number(editBarberId) === editingBooking.barberId; // editBarberId is string

                if (isOwnSlot) {
                    validSlots.push(timeStr);
                } else {
                    const isFree = await checkSlotAvailability(editDate, timeStr, parseInt(editBarberId));
                    if (isFree) validSlots.push(timeStr);
                }

                current.setMinutes(current.getMinutes() + 30); // Hardcoded 30 for now or fetch from setting? Settings removed. Default 30.
            }
            setEditAvailableSlots(validSlots);
        };

        calcSlots();
    }, [editDate, editBarberId, schedule, editingBooking]);

    // Loading & Initialization
    useEffect(() => {
        const init = async () => {
            // Auth check - bypassed
            // const isAuth = localStorage.getItem('sapar_admin_auth') === 'true';
            // setIsAuthenticated(isAuth);

            // Load initial settings
            const s = await getAdminSettings();
            setSettings(s);

            // Load blocked dates
            await loadBlockedDates();

            // Load Services
            await loadServices();

            // Load initial schedule
            const sched = await getScheduleSettings();
            setSchedule(sched.hours);
            setWorkingDays(sched.workingDays);
            // Load breaks from first working day (assuming global consistency for now)
            const firstDay = sched.workingDays[0] || 0;
            setBreaks(sched.breaks[firstDay] || []);
            setDuration(sched.slotDuration.toString());
            setBuffer(sched.bufferTime.toString());
        };
        init();

        // Subscriptions
        const unsubSettings = subscribeToSettings((newSettings) => {
            setSettings(newSettings);
        });

        const unsubSchedule = subscribeToSchedule((newSched) => {
            setSchedule(newSched.hours);
            setWorkingDays(newSched.workingDays);
            setDuration(newSched.slotDuration.toString());
            setBuffer(newSched.bufferTime.toString());
        });

        return () => {
            unsubSettings();
            unsubSchedule();
        };
    }, []);

    useEffect(() => {
        // Subscribe to ALL FUTURE appointments
        const unsubscribe = subscribeToFutureBookings((data) => {
            setAppointments(data);
        });
        return () => unsubscribe();
    }, []);

    // Helper functions
    const loadBlockedDates = async () => {
        const dates = await getBlockedDates();
        setBlockedDates(dates);
    };

    const loadServices = async () => {
        const s = await getServices();
        setServices(s);
    };

    const handleSaveService = async () => {
        if (!newService.name || !newService.price || !newService.duration) return;
        setIsAddingService(true);
        try {
            if (editingServiceId) {
                // Update
                await updateService(editingServiceId, {
                    name: newService.name,
                    price: Number(newService.price),
                    duration: Number(newService.duration),
                    note: newService.note
                });
                setModalConfig({ isOpen: true, title: 'הצלחה', text: 'הטיפול עודכן בהצלחה', showConfirmButton: false });
            } else {
                // Create
                await addService({
                    name: newService.name,
                    price: Number(newService.price),
                    duration: Number(newService.duration),
                    note: newService.note
                });
                setModalConfig({ isOpen: true, title: 'הצלחה', text: 'הטיפול נוסף בהצלחה', showConfirmButton: false });
            }
            await loadServices();
            setNewService({ name: '', price: 0, duration: 30, note: '' });
            setEditingServiceId(null);
        } catch (e) {
            setModalConfig({ isOpen: true, title: 'שגיאה', text: 'אירעה שגיאה בשמירת הטיפול', type: 'error' });
        } finally {
            setIsAddingService(false);
        }
    };

    const handleEditService = (service: Service) => {
        setNewService({ ...service });
        setEditingServiceId(service.id!);
        // Scroll to form (optional, but good UX if form is far)
    };

    const handleDeleteService = async (id: string, name: string) => {
        setModalConfig({
            isOpen: true,
            title: 'מחיקת טיפול',
            text: `האם למחוק את הטיפול "${name}"?`,
            type: 'warning',
            showConfirmButton: true,
            onConfirm: async () => {
                await deleteService(id);
                await loadServices();
            }
        });
    };


    const [error, setError] = useState('');

    // Strict Auth Check on Mount
    useEffect(() => {
        const checkAuth = () => {
            const auth = localStorage.getItem('sapar_admin_auth');
            if (auth !== 'true') {
                navigate('/');
            }
        };
        checkAuth();
        // Also listen for storage events in case they log out in another tab
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, [navigate]);

    const handleExit = () => {
        navigate('/');
    };

    const handleLogout = () => {
        localStorage.removeItem('sapar_admin_auth');
        navigate('/');
    };

    const handleVacationToggle = async () => {
        const newMode = !settings.vacationMode;
        setSettings(prev => ({ ...prev, vacationMode: newMode }));
        await updateAdminSettings({ vacationMode: newMode });
    };

    const handleChangePassword = async () => {
        if (!newPassword) return;
        try {
            await updateAdminSettings({ adminPassword: newPassword });
            setSettings(prev => ({ ...prev, adminPassword: newPassword }));
            setNewPassword('');
            setShowPasswordChange(false);
            setError('');
            setModalConfig({
                isOpen: true,
                title: 'הצלחה',
                text: 'הסיסמה שונתה בהצלחה',
                type: 'success',
                showConfirmButton: false
            });
        } catch (e) {
            setError('שגיאה בשינוי סיסמה');
        }
    };

    const createBreaksMap = (days: number[], currentBreaks: { start: string, end: string, barberId?: string }[]) => {
        return days.reduce((acc, day) => {
            acc[day] = currentBreaks;
            return acc;
        }, {} as Record<number, { start: string, end: string, barberId?: string }[]>);
    };

    const toggleDay = async (dayIndex: number) => {
        let newWorkingDays;
        if (workingDays.includes(dayIndex)) {
            newWorkingDays = workingDays.filter(d => d !== dayIndex);
        } else {
            newWorkingDays = [...workingDays, dayIndex].sort();
        }

        setWorkingDays(newWorkingDays);
        await updateScheduleSettings({
            workingDays: newWorkingDays,
            hours: schedule,
            breaks: createBreaksMap(newWorkingDays, breaks),
            slotDuration: parseInt(duration),
            bufferTime: parseInt(buffer)
        });
    };

    const updateDayTime = async (dayIndex: number, type: 'start' | 'end', value: string) => {
        const currentDay = schedule[dayIndex] || { start: '10:00', end: '20:00' };
        const newSchedule = {
            ...schedule,
            [dayIndex]: { ...currentDay, [type]: value }
        };

        setSchedule(newSchedule);
        await updateScheduleSettings({
            workingDays,
            hours: newSchedule,
            breaks: createBreaksMap(workingDays, breaks),
            slotDuration: parseInt(duration),
            bufferTime: parseInt(buffer)
        });
    };




    const addBreak = async () => {
        const newBreaks = [...breaks, { start: newBreakStart, end: newBreakEnd, barberId: newBreakBarberId === 'all' ? undefined : newBreakBarberId }];
        setBreaks(newBreaks);
        await updateScheduleSettings({
            workingDays,
            hours: schedule,
            breaks: createBreaksMap(workingDays, newBreaks),
            slotDuration: parseInt(duration),
            bufferTime: parseInt(buffer)
        });
    };

    const removeBreak = async (index: number) => {
        const newBreaks = breaks.filter((_, i) => i !== index);
        setBreaks(newBreaks);
        await updateScheduleSettings({
            workingDays,
            hours: schedule,
            breaks: createBreaksMap(workingDays, newBreaks),
            slotDuration: parseInt(duration),
            bufferTime: parseInt(buffer)
        });
    };



    const handleOpenBarberModal = (barber: Barber | null) => {
        setEditingBarber(barber);
        setBarberForm({ name: barber?.name || '', specialty: barber?.specialty || '' });
        setIsBarberModalOpen(true);
    };

    const handleSaveBarber = async () => {
        if (!barberForm.name) return;

        try {
            if (editingBarber) {
                await updateBarber(editingBarber.id.toString(), barberForm);
            } else {
                await addBarber({
                    ...barberForm,
                    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d6f4e8d?q=80&w=2070&auto=format&fit=crop'
                });
            }
            setIsBarberModalOpen(false);
        } catch (e) {
            console.error(e);
            alert('שגיאה בשמירת נתונים');
        }
    };

    const [barberToDelete, setBarberToDelete] = useState<{ id: string, name: string } | null>(null);
    const [deletePassword, setDeletePassword] = useState('');

    const handleDeleteBarberClick = (id: string, name: string) => {
        setBarberToDelete({ id, name });
        setDeletePassword('');
    };

    const confirmDeleteBarber = async () => {
        if (!barberToDelete) return;

        if (deletePassword !== settings.adminPassword) {
            alert('סיסמה שגויה');
            return;
        }

        try {
            await deleteBarber(barberToDelete.id);
            setBarberToDelete(null);
            setDeletePassword('');
        } catch (e) {
            alert('שגיאה במחיקת ספר');
        }
    };

    const handleImageUpload = async (barberId: string | number, file?: File) => {
        if (!file) return;

        // Limit size 500kb
        if (file.size > 500000) {
            alert('התמונה גדולה מדי. מקסימום 500KB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            await updateBarber(barberId.toString(), { image: base64 });
        };
        reader.readAsDataURL(file);
    };

    const handleGalleryUpload = async (file?: File) => {
        if (!file) return;
        if (file.size > 750000) { // 750KB limit (safety for Base64 overhead < 1MB Firestore limit)
            alert('התמונה גדולה מדי. מקסימום 750KB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const base64 = reader.result as string;
                await addGalleryImage(base64);
                // Simple success handling (subscription will update UI)
            } catch (error) {
                console.error("Gallery upload error:", error);
                alert('אירעה שגיאה בהעלאת התמונה. נסה שנית או הקטן את הקובץ.');
            }
        };
        reader.readAsDataURL(file);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'schedule':
                return (
                    <div className="space-y-8 animate-fade-in pb-10 mx-auto w-full">
                        {/* Barber Selector */}
                        <div className="flex gap-4 overflow-x-auto pb-4 pt-6 px-4 no-scrollbar items-center">
                            {barbers.map(barber => (
                                <div key={barber.id} className="relative group shrink-0">
                                    <button
                                        onClick={() => setSelectedBarber(barber)}
                                        className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all min-w-max border ${selectedBarber?.id === barber.id
                                            ? 'bg-emerald-500 text-black border-transparent shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        <img src={barber.image} alt={barber.name} className="w-10 h-10 rounded-full object-cover" />
                                        <div className="text-right">
                                            <div className="font-bold">{barber.name}</div>
                                            <div className="text-xs opacity-70">{barber.specialty}</div>
                                        </div>
                                    </button>

                                    {/* Action Buttons Overlay */}
                                    <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none group-hover:pointer-events-auto">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenBarberModal(barber); }}
                                            className="p-1.5 bg-blue-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                                        >
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteBarberClick(barber.id.toString(), barber.name); }}
                                            className="p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>

                                    <label className="absolute bottom-2 right-2 p-1.5 bg-black/60 hover:bg-black/90 rounded-full cursor-pointer text-white transition-opacity opacity-0 group-hover:opacity-100 z-10 backdrop-blur-sm">
                                        <Camera className="w-4 h-4" />
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(barber.id, e.target.files?.[0])}
                                        />
                                    </label>
                                </div>
                            ))}

                            {/* Add Button */}
                            <button
                                onClick={() => handleOpenBarberModal(null)}
                                className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all min-w-max shrink-0 group"
                            >
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                    <Plus className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-gray-400 group-hover:text-white">הוסף ספר</div>
                                    <div className="text-xs opacity-0">...</div>
                                </div>
                            </button>
                        </div>


                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start h-full">
                            {/* Working Hours */}
                            <div className="glass-panel p-6 rounded-3xl relative z-10 transition-all">
                                <button
                                    onClick={() => setIsWeeklyHoursOpen(!isWeeklyHoursOpen)}
                                    className="w-full flex items-center justify-between text-xl font-bold group"
                                >
                                    <div className="flex items-center gap-2 group-hover:text-emerald-400 transition-colors">
                                        <Clock className="w-5 h-5 text-emerald-400" />
                                        שעות שבועיות
                                    </div>
                                    <div className={`transition-transform duration-300 ${isWeeklyHoursOpen ? 'rotate-180' : ''}`}>
                                        <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-emerald-400" />
                                    </div>
                                </button>

                                {isWeeklyHoursOpen && (
                                    <div className="space-y-3 mt-6 animate-fade-in">
                                        {[0, 1, 2, 3, 4, 5].map((dayIndex) => { // 0=Sunday
                                            const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
                                            const dayName = days[dayIndex];
                                            const dayConfig = schedule[dayIndex] || { start: '10:00', end: '20:00' }; // Default fallback
                                            const isOpen = workingDays.includes(dayIndex);

                                            return (
                                                <div key={dayIndex} className={`flex flex-col xl:flex-row xl:items-center justify-between p-4 rounded-2xl border transition-all ${isOpen ? 'bg-white/5 border-white/5' : 'bg-white/2 border-transparent opacity-50'}`}>
                                                    <div className="flex items-center justify-between mb-2 xl:mb-0 xl:gap-2 w-full xl:w-auto">
                                                        <span className="font-bold text-sm min-w-[40px] text-right">{dayName}</span>
                                                        <button
                                                            onClick={() => toggleDay(dayIndex)}
                                                            className={`w-10 h-6 rounded-full relative transition-colors ${isOpen ? 'bg-emerald-500' : 'bg-white/10'}`}
                                                        >
                                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${isOpen ? 'left-1' : 'left-5'}`}></div>
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center gap-2 justify-end w-full xl:w-auto">
                                                        {isOpen ? (
                                                            <div className="flex flex-col sm:flex-row gap-2 items-center w-full xl:w-auto">
                                                                <div>
                                                                    <TimePicker time={dayConfig.start} onChange={(t) => updateDayTime(dayIndex, 'start', t)} />
                                                                </div>
                                                                <span className="text-gray-500 hidden sm:inline">-</span>
                                                                <span className="text-gray-500 text-xs sm:hidden">עד</span>
                                                                <div>
                                                                    <TimePicker time={dayConfig.end} onChange={(t) => updateDayTime(dayIndex, 'end', t)} />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500 font-mono text-xs uppercase">Closed</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Breaks & Exceptions */}
                            <div className="glass-panel p-6 rounded-3xl relative z-20 transition-all">
                                <button
                                    onClick={() => setIsBreaksOpen(!isBreaksOpen)}
                                    className="w-full flex items-center justify-between text-xl font-bold group"
                                >
                                    <div className="flex items-center gap-2 group-hover:text-emerald-400 transition-colors">
                                        <AlertCircle className="w-5 h-5 text-emerald-400" />
                                        חריגות והפסקות
                                    </div>
                                    <div className={`transition-transform duration-300 ${isBreaksOpen ? 'rotate-180' : ''}`}>
                                        <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-emerald-400" />
                                    </div>
                                </button>

                                {isBreaksOpen && (
                                    <div className="space-y-6 mt-6 animate-fade-in">
                                        {/* Breaks List */}
                                        <div className="border-b border-white/10 pb-6">
                                            <label className="text-gray-400 text-sm mb-4 block font-bold">הפסקות קבועות</label>

                                            {/* List */}
                                            <div className="space-y-2 mb-4">
                                                {breaks.map((brk, idx) => (
                                                    <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-xl animate-fade-in">
                                                        <div className="flex items-center gap-3">
                                                            <div className="font-mono text-sm">{brk.start} - {brk.end}</div>
                                                            <div className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                                {brk.barberId ? (barbers.find(b => b.id.toString() === brk.barberId)?.name || 'לא ידוע') : 'כל המספרה'}
                                                            </div>
                                                        </div>
                                                        <button onClick={() => removeBreak(idx)} className="text-red-400 p-1 hover:bg-white/10 rounded-lg">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Add Input */}
                                            <div className="flex flex-col md:flex-row gap-2 items-end md:items-center">
                                                <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
                                                    <div>
                                                        <span className="text-xs text-gray-500 mb-1 block">משעה</span>
                                                        <TimePicker time={newBreakStart} onChange={setNewBreakStart} />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-gray-500 mb-1 block">עד שעה</span>
                                                        <TimePicker time={newBreakEnd} onChange={setNewBreakEnd} />
                                                    </div>
                                                </div>

                                                <div className="w-full md:w-40 ml-auto md:ml-0" dir="rtl">
                                                    <CustomSelect
                                                        value={newBreakBarberId}
                                                        onChange={setNewBreakBarberId}
                                                        options={[
                                                            { value: 'all', label: 'כל המספרה' },
                                                            ...barbers.map(b => ({ value: b.id.toString(), label: b.name }))
                                                        ]}
                                                        placeholder="בחר ספר"
                                                    />
                                                </div>

                                                <button
                                                    onClick={addBreak}
                                                    className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl hover:bg-emerald-500/20 w-full md:w-auto flex justify-center transition-colors"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Blocked Dates List */}
                                        <div className="border-b border-white/10 pb-6">
                                            <label className="text-gray-400 text-sm mb-4 block font-bold">תאריכים חסומים</label>
                                            <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                                                {blockedDates.length === 0 ? (
                                                    <p className="text-gray-500 text-sm">אין תאריכים חסומים</p>
                                                ) : (
                                                    blockedDates.map(date => {
                                                        const barberName = date.barberId
                                                            ? barbers.find(b => b.id.toString() === date.barberId?.toString())?.name || 'לא ידוע'
                                                            : 'כל המספרה';

                                                        return (
                                                            <div key={date.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                                                                <div className="flex flex-col">
                                                                    <span className="font-mono text-sm">
                                                                        {date.date.toLocaleDateString('he-IL')}
                                                                        {date.start && date.end ? (
                                                                            <span className="text-emerald-400 text-xs mr-2">
                                                                                {date.start} - {date.end}
                                                                            </span>
                                                                        ) : <span className="text-gray-500 text-xs mr-2">(כל היום)</span>}
                                                                    </span>
                                                                    <span className="text-xs text-gray-400">{barberName}</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        if (!date.id) return;
                                                                        setModalConfig({
                                                                            isOpen: true,
                                                                            title: 'ביטול חסימה',
                                                                            text: 'האם אתה בטוח שברצונך לבטל חסימה זו?',
                                                                            type: 'warning',
                                                                            showConfirmButton: true,
                                                                            onConfirm: async () => {
                                                                                if (!date.id) return; // TS check
                                                                                setBlockedDates(prev => prev.filter(d => d.id !== date.id)); // Optimistic
                                                                                await deleteBlockedDate(date.id);
                                                                                await loadBlockedDates(); // Sync
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>

                                        {/* Block Date */}
                                        <div>
                                            <label className="text-gray-400 text-sm mb-4 block font-bold">חסום תאריך חדש</label>

                                            <CustomDatePicker
                                                selectedDate={selectedDate || new Date()}
                                                onChange={setSelectedDate}
                                                excludeDates={blockedDates
                                                    .filter(d => blockBarberId === 'all' ? !d.barberId : (d.barberId?.toString() === blockBarberId || !d.barberId))
                                                    .map(d => d.date)
                                                }
                                                workingDays={workingDays}
                                            />

                                            <div className="mt-6 flex flex-col gap-4">

                                                {/* Blocking Options Row */}
                                                <div className="flex flex-col md:flex-row gap-4 items-end justify-between bg-white/5 p-4 rounded-xl">

                                                    {/* Left: Toggles & Times */}
                                                    <div className="flex flex-col gap-2 w-full md:w-auto">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => setIsFullDayBlock(!isFullDayBlock)}
                                                                className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors border ${isFullDayBlock ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-transparent text-gray-500 border-white/10'}`}
                                                            >
                                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isFullDayBlock ? 'border-emerald-400' : 'border-gray-500'}`}>
                                                                    {isFullDayBlock && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                                                                </div>
                                                                חסימת יום מלא
                                                            </button>
                                                        </div>

                                                        {!isFullDayBlock && (
                                                            <div className="flex items-center gap-3 animate-fade-in" dir="ltr">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[10px] text-gray-500 text-center font-bold">מ...</span>
                                                                    <TimePicker time={blockStartTime} onChange={setBlockStartTime} />
                                                                </div>
                                                                <span className="text-gray-500 pt-5">-</span>
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[10px] text-gray-500 text-center font-bold">עד...</span>
                                                                    <TimePicker time={blockEndTime} onChange={setBlockEndTime} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Right: Barber & Action */}
                                                    <div className="flex gap-4 items-end w-full md:w-auto">
                                                        <div className="w-full md:w-48">
                                                            <label className="text-xs text-gray-500 mb-1 block">ספר</label>
                                                            <CustomSelect
                                                                value={blockBarberId}
                                                                onChange={setBlockBarberId}
                                                                options={[
                                                                    { value: 'all', label: 'כל המספרה' },
                                                                    ...barbers.map(b => ({ value: b.id.toString(), label: b.name }))
                                                                ]}
                                                                placeholder="בחר למי לחסום"
                                                            />
                                                        </div>

                                                        <button
                                                            disabled={!selectedDate || isBlocking}
                                                            onClick={async () => {
                                                                if (!selectedDate) return;
                                                                setIsBlocking(true);
                                                                try {
                                                                    const bId = blockBarberId === 'all' ? undefined : parseInt(blockBarberId);
                                                                    const start = isFullDayBlock ? undefined : blockStartTime;
                                                                    const end = isFullDayBlock ? undefined : blockEndTime;

                                                                    // Optimistic add (with temp ID)
                                                                    const tempBlock: BlockedDate = {
                                                                        id: 'temp-' + Date.now(),
                                                                        date: selectedDate,
                                                                        barberId: bId,
                                                                        reason: 'Blocked by Admin',
                                                                        start,
                                                                        end
                                                                    };
                                                                    setBlockedDates(prev => [...prev, tempBlock]);

                                                                    await blockDateService(selectedDate, 'Blocked by Admin', bId, start, end);
                                                                    await loadBlockedDates(); // Re-fetch for real ID
                                                                } catch (e) {
                                                                    // Revert on fail
                                                                    await loadBlockedDates();
                                                                } finally {
                                                                    setIsBlocking(false);
                                                                    setSelectedDate(null);
                                                                }
                                                            }}
                                                            className={`
                                                        px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                                                        ${!selectedDate || isBlocking
                                                                    ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                                                    : 'bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600'
                                                                }
                                                    `}
                                                        >
                                                            {isBlocking ? (
                                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-5 h-5" />
                                                            )}
                                                            <span>{isBlocking ? 'חוסם...' : 'חסום תאריך'}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'services':
                return (
                    <div className="space-y-6 animate-fade-in pb-10 mx-auto w-full">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">ניהול טיפולים</h3>
                        </div>

                        {/* Add/Edit Service Form */}
                        <div className="glass-panel p-6 rounded-3xl mb-6">
                            <h4 className="font-bold mb-4 text-emerald-400">
                                {editingServiceId ? 'עריכת טיפול' : 'הוסף טיפול חדש'}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div>
                                    <label className="text-gray-400 text-xs mb-2 block">שם הטיפול</label>
                                    <input
                                        type="text"
                                        value={newService.name}
                                        onChange={e => setNewService({ ...newService, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                                        placeholder="לדוגמה: תספורת גבר"
                                    />
                                </div>
                                <div>
                                    <label className="text-gray-400 text-xs mb-2 block">מחיר (₪)</label>
                                    <input
                                        type="number"
                                        value={newService.price || ''}
                                        onChange={e => setNewService({ ...newService, price: Number(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-gray-400 text-xs mb-2 block">משך זמן (דקות)</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="number"
                                            step="5"
                                            value={newService.duration || ''}
                                            onChange={e => setNewService({ ...newService, duration: Number(e.target.value) })}
                                            className="w-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none text-center"
                                            placeholder="30"
                                        />
                                        <div className="flex gap-1 overflow-x-auto no-scrollbar">
                                            {[15, 20, 30, 40, 45, 60, 90].map(m => (
                                                <button
                                                    key={m}
                                                    onClick={() => setNewService({ ...newService, duration: m })}
                                                    className={`px-3 py-2 rounded-lg text-sm border transition-all ${newService.duration === m ? 'bg-emerald-500 text-black border-emerald-500 font-bold' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                                >
                                                    {m}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="md:col-span-4">
                                    <label className="text-gray-400 text-xs mb-2 block">הערה ללקוח (אופציונלי)</label>
                                    <textarea
                                        value={newService.note || ''}
                                        onChange={e => setNewService({ ...newService, note: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 outline-none h-20 resize-none text-sm"
                                        placeholder="הערה שתוצג ללקוח בעת בחירת הטיפול..."
                                    />
                                </div>
                                <div className="flex gap-2 md:col-start-4">
                                    <button
                                        onClick={handleSaveService}
                                        disabled={isAddingService || !newService.name}
                                        className="flex-1 bg-emerald-500 text-black font-black py-3 rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                                    >
                                        {editingServiceId ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                        {isAddingService ? 'שומר...' : (editingServiceId ? 'עדכן' : 'הוסף')}
                                    </button>
                                    {editingServiceId && (
                                        <button
                                            onClick={() => {
                                                setNewService({ name: '', price: 0, duration: 30, note: '' });
                                                setEditingServiceId(null);
                                            }}
                                            className="bg-white/10 text-white p-3 rounded-xl hover:bg-white/20 transition-all"
                                        >
                                            <LogOut className="w-5 h-5 rotate-180" /> {/* Reusing an icon for cancel */}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>


                        {/* Services List */}
                        <div className="grid gap-3">
                            {services.map(service => (
                                <div key={service.id} className={`glass-panel p-4 rounded-2xl flex items-center justify-between group transition-all ${editingServiceId === service.id ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-emerald-500">
                                            <Scissors className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">{service.name}</h4>
                                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {service.duration} דקות
                                                </span>
                                                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                                                    ₪{service.price}
                                                </span>
                                            </div>
                                            {service.note && (
                                                <p className="text-xs text-gray-500 italic mt-1 max-w-[200px] truncate">{service.note}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEditService(service)}
                                            className="p-3 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-colors"
                                        >
                                            <Settings className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => service.id && handleDeleteService(service.id, service.name)}
                                            className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {services.length === 0 && (
                                <p className="text-center text-gray-500 py-10">לא הוגדרו טיפולים עדיין.</p>
                            )}
                        </div>
                    </div >
                );
            case 'general':
                return (
                    <div className="space-y-6 animate-fade-in pb-10 mx-auto w-full">
                        {/* Global Status Card */}
                        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold">מצב מספרה</h3>
                                    <p className="text-gray-400 text-xs mt-1">
                                        {settings.vacationMode ? "המספרה בחופשה. תורים חסומים." : "המספרה פעילה ומקבלת תורים."}
                                    </p>
                                </div>
                                <button
                                    onClick={handleVacationToggle}
                                    className={`p-3 rounded-xl transition-colors ${settings.vacationMode ? 'bg-orange-500 text-black' : 'bg-white/10 text-gray-400'
                                        }`}
                                >
                                    {settings.vacationMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>

                        {/* Security Settings */}
                        <div className="glass-panel p-6 rounded-3xl">
                            <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowPasswordChange(!showPasswordChange)}>
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-gray-400" />
                                    הגדרות אבטחה
                                </h3>
                                <ChevronDown className={`w-5 h-5 transition-transform ${showPasswordChange ? 'rotate-180' : ''}`} />
                            </div>

                            {showPasswordChange && (
                                <div className="mt-4 space-y-3 pt-4 border-t border-white/10">
                                    <input
                                        type="password"
                                        placeholder="סיסמה חדשה"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                                    />
                                    <button
                                        onClick={handleChangePassword}
                                        className="w-full bg-emerald-500 text-black font-bold py-3 rounded-xl hover:bg-emerald-400"
                                    >
                                        שמור סיסמה חדשה
                                    </button>
                                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'appointments':
                return (
                    <div className="space-y-4 animate-fade-in pb-10 mx-auto w-full">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xl font-bold">תורים להיום</h3>
                            <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
                                {appointments.length} תורים
                            </span>
                        </div>

                        {appointments.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>אין תורים להיום</p>
                            </div>
                        ) : (
                            appointments.map(apt => (
                                <div key={apt.id} className="glass-panel p-4 rounded-2xl flex items-center justify-between group overflow-hidden relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center font-bold text-lg font-oswald text-emerald-400">
                                            {apt.time}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">{apt.customerName}</h4>
                                            <div className="flex items-center gap-3 text-sm text-gray-400 flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {apt.barberName}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {apt.customerPhone}
                                                </span>
                                                {apt.service && (
                                                    <span className="flex items-center gap-1 text-emerald-500/70">
                                                        <Scissors className="w-3 h-3" />
                                                        {apt.service}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingBooking(apt);
                                                setEditDate(apt.date);
                                                setEditTime(apt.time);
                                                setEditBarberId(apt.barberId.toString());
                                            }}
                                            className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 text-blue-400 transition-all"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setModalConfig({
                                                    isOpen: true,
                                                    title: 'ביטול תור',
                                                    text: 'האם אתה בטוח שברצונך לבטל תור זה?',
                                                    type: 'warning',
                                                    showConfirmButton: true,
                                                    onConfirm: async () => {
                                                        if (apt.id) await deleteBooking(apt.id);
                                                    }
                                                });
                                            }}
                                            className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 text-red-500 transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                );
            case 'products':
                return (
                    <div className="space-y-6 animate-fade-in pb-10 mx-auto w-full">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">ניהול מלאי</h3>
                            <button className="bg-emerald-500 text-black px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm hover:bg-emerald-400 transition-colors">
                                <Plus className="w-4 h-4" />
                                הוסף מוצר
                            </button>
                        </div>
                        <div className="grid gap-4">
                            {PRODUCTS.map(product => (
                                <div key={product.id} className="glass-panel p-4 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <img src={product.image} alt={product.name} className="w-16 h-16 rounded-xl object-cover" />
                                        <div>
                                            <h4 className="font-bold">{product.name}</h4>
                                            <p className="text-emerald-400 font-mono">₪{product.price}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );


            case 'gallery':
                return (
                    <div className="space-y-6 animate-fade-in pb-10 mx-auto w-full">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">ניהול גלריה</h3>
                            <label className="bg-emerald-500 text-black px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm hover:bg-emerald-400 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20">
                                <Plus className="w-5 h-5" />
                                הוסף תמונה
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleGalleryUpload(e.target.files?.[0])}
                                />
                            </label>
                        </div>

                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {galleryImages.map(img => (
                                <div key={img.id} className="relative group rounded-2xl overflow-hidden aspect-[3/4] border border-white/10 bg-white/5">
                                    <img src={img.url} alt="Gallery" className="w-full h-full object-cover" />

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
                                        {editingImageId === img.id ? (
                                            <div className="flex flex-col gap-2 w-full animate-fade-in" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="text"
                                                    value={imageTag}
                                                    onChange={(e) => setImageTag(e.target.value)}
                                                    placeholder="תגית (לדוגמה: תספורת אופנתית)"
                                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm text-white focus:border-emerald-500 outline-none text-center"
                                                    autoFocus
                                                />
                                                <div className="flex gap-2 justify-center">
                                                    <button
                                                        onClick={() => {
                                                            if (img.id) updateGalleryImage(img.id, { tag: imageTag });
                                                            setEditingImageId(null);
                                                        }}
                                                        className="p-2 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingImageId(null)}
                                                        className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {img.tag && (
                                                    <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-bold mb-2">
                                                        {img.tag}
                                                    </span>
                                                )}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingImageId(img.id || null);
                                                            setImageTag(img.tag || '');
                                                        }}
                                                        className="p-3 bg-blue-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                                                    >
                                                        <Edit2 className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setModalConfig({
                                                                isOpen: true,
                                                                title: 'מחיקת תמונה',
                                                                text: 'האם אתה בטוח שברצונך למחוק תמונה זו מהגלריה?',
                                                                type: 'warning',
                                                                showConfirmButton: true,
                                                                onConfirm: () => img.id && deleteGalleryImage(img.id)
                                                            });
                                                        }}
                                                        className="p-3 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {galleryImages.length === 0 && (
                                <div className="col-span-full py-10 text-center text-gray-500">
                                    אין תמונות בגלריה
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'reports':
                return (
                    <div className="grid grid-cols-2 gap-4 animate-fade-in">
                        <div className="glass-panel p-6 rounded-3xl">
                            <div className="text-gray-400 text-sm mb-2">הכנסות החודש</div>
                            <div className="text-3xl font-black text-emerald-400">₪42,500</div>
                            <div className="text-xs text-emerald-500 mt-2">+12% מחודש שעבר</div>
                        </div>
                        <div className="glass-panel p-6 rounded-3xl">
                            <div className="text-gray-400 text-sm mb-2">תורים שבוצעו</div>
                            <div className="text-3xl font-black text-white">142</div>
                        </div>
                        <div className="glass-panel p-6 rounded-3xl col-span-2">
                            <div className="text-gray-400 text-sm mb-4">מוצרים נמכרים ביותר</div>
                            <div className="space-y-3">
                                {products.slice(0, 2).map((p, i) => (
                                    <div key={p.id} className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-gray-500">0{i + 1}</span>
                                            <span className="text-sm">{p.name}</span>
                                        </div>
                                        <span className="text-emerald-400 text-sm font-bold">24 יח'</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };



    return (
        <div className="min-h-screen bg-black text-white pb-24 pt-14">
            <Modal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                title={modalConfig.title}
                text={modalConfig.text}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
                showConfirmButton={modalConfig.showConfirmButton}
            />

            {editingBooking && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
                        <button
                            onClick={() => setEditingBooking(null)}
                            className="absolute top-4 left-4 text-gray-400 hover:text-white p-2"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <h2 className="text-2xl font-black mb-6 pr-2 border-r-4 border-emerald-500">עריכת תור</h2>

                        <div className="space-y-6">
                            {/* Date */}
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">תאריך</label>
                                <CustomDatePicker
                                    selectedDate={editDate || new Date()}
                                    onChange={setEditDate}
                                    excludeDates={blockedDates.filter(d => !d.barberId || (editBarberId && d.barberId.toString() === editBarberId)).map(d => d.date)}
                                    workingDays={workingDays}
                                />
                            </div>

                            {/* Barber */}
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">ספר</label>
                                <CustomSelect
                                    value={editBarberId || ''}
                                    onChange={setEditBarberId}
                                    options={barbers.map(b => ({ value: b.id.toString(), label: b.name }))}
                                />
                            </div>

                            {/* Time */}
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">שעה</label>
                                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto custom-scrollbar bg-black/20 p-2 rounded-xl">
                                    {editAvailableSlots.length === 0 ? (
                                        <p className="col-span-4 text-center text-gray-500 text-sm py-4">אין תורים פנויים לתאריך/ספר זה</p>
                                    ) : (
                                        editAvailableSlots.map(time => (
                                            <button
                                                key={time}
                                                onClick={() => setEditTime(time)}
                                                className={`py-2 rounded-lg text-sm font-bold transition-all ${editTime === time
                                                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                                                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                                    }`}
                                            >
                                                {time}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={async () => {
                                        if (!editingBooking?.id || !editDate || !editTime || !editBarberId) return;
                                        setIsSavingBooking(true);
                                        try {
                                            const barberName = barbers.find(b => b.id.toString() === editBarberId)?.name || '';
                                            await updateBooking(editingBooking.id, {
                                                date: editDate,
                                                time: editTime,
                                                barberId: editBarberId,
                                                barberName
                                            });
                                            setEditingBooking(null);
                                        } catch (e) {
                                            console.error(e);
                                        } finally {
                                            setIsSavingBooking(false);
                                        }
                                    }}
                                    disabled={isSavingBooking || !editTime}
                                    className="flex-1 bg-emerald-500 text-black font-black py-3 rounded-xl hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isSavingBooking ? 'שומר...' : 'שמור שינויים'}
                                </button>
                                <button
                                    onClick={() => setEditingBooking(null)}
                                    className="bg-white/10 text-white font-bold py-3 px-6 rounded-xl hover:bg-white/20 transition-all"
                                >
                                    ביטול
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            {/* Header */}
            <div className="z-20 px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-black">ניהול</h1>
                <div className="flex gap-2">
                    <button onClick={handleExit} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-gray-300" title="יציאה לדף הבית">
                        <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                    <button onClick={handleLogout} className="p-2 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors text-red-500" title="התנתק/י">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Navigation Tabs - Floating Pill Style */}
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-auto max-w-[95vw]">
                <div className="glass-nav rounded-full px-2 py-2 flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto no-scrollbar shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-xl bg-black/60">
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative group flex flex-col items-center justify-center p-3 sm:px-4 rounded-full transition-all duration-300 min-w-[60px] sm:min-w-[70px] ${isActive
                                    ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-105'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <tab.icon
                                    className={`w-5 h-5 sm:w-6 sm:h-6 mb-0.5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span className={`text-[9px] sm:text-[10px] font-bold leading-none ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-white'}`}>
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
            {/* Content */}
            <div className="px-6 space-y-6">
                {renderContent()}
            </div>

            {/* Barber Modal */}
            {isBarberModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
                        <button
                            onClick={() => setIsBarberModalOpen(false)}
                            className="absolute top-4 left-4 text-gray-400 hover:text-white p-2"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <h2 className="text-2xl font-black mb-6 text-emerald-400">{editingBarber ? 'עריכת ספר' : 'הוספת ספר'}</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">שם מלא</label>
                                <input
                                    type="text"
                                    value={barberForm.name}
                                    onChange={e => setBarberForm({ ...barberForm, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                                    placeholder="שם הספר..."
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">התמחות</label>
                                <input
                                    type="text"
                                    value={barberForm.specialty}
                                    onChange={e => setBarberForm({ ...barberForm, specialty: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                                    placeholder="לדוגמה: תספורות גברים..."
                                />
                            </div>

                            <button
                                onClick={handleSaveBarber}
                                className="w-full bg-emerald-500 text-black font-black py-4 rounded-xl hover:bg-emerald-400 mt-4 shadow-lg shadow-emerald-500/20"
                            >
                                {editingBarber ? 'שמור שינויים' : 'הוסף ספר'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Barber Confirmation Modal */}
            {barberToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-fade-in">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setBarberToDelete(null)}></div>
                    <div className="glass-panel p-8 rounded-3xl w-full max-w-sm relative z-10 text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">מחיקת ספר</h3>
                        <p className="text-gray-400 mb-6">האם אתה בטוח שברצונך למחוק את {barberToDelete.name}? פעולה זו אינה הפיכה.</p>

                        <input
                            type="password"
                            placeholder="סיסמת ניהול לאישור"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-center mb-6 focus:outline-none focus:border-red-500"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={confirmDeleteBarber}
                                className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors"
                            >
                                מחק
                            </button>
                            <button
                                onClick={() => setBarberToDelete(null)}
                                className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-colors"
                            >
                                ביטול
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
