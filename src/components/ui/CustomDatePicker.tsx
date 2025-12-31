import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDatePickerProps {
    selectedDate: Date | null;
    onChange: (date: Date) => void;
    className?: string;
    excludeDates?: Date[];
    workingDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
}

const DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ selectedDate, onChange, className = "", excludeDates = [], workingDays = [0, 1, 2, 3, 4, 5] }) => {
    const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const isBlocked = (date: Date) => {
        // Check if date is in excludeDates
        const isExcluded = excludeDates.some(blocked => isSameDay(blocked, date));
        // Check if day of week is in workingDays
        const isNotWorkingDay = !workingDays.includes(date.getDay());

        return isExcluded || isNotWorkingDay;
    }

    const isDateNotWorking = (date: Date) => !workingDays.includes(date.getDay());

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);

    // Create grid array including empty slots for start of month
    const grid = [];
    for (let i = 0; i < firstDay; i++) {
        grid.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        grid.push(i);
    }

    return (
        <div className={`p-4 bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl ${className}`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-4 text-white">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <ChevronRight className="w-5 h-5" />
                </button>
                <div className="font-bold text-lg">
                    {currentMonth.toLocaleString('he-IL', { month: 'long', year: 'numeric' })}
                </div>
                <button onClick={handleNextMonth} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 mb-2">
                {DAYS.map(day => (
                    <div key={day} className="text-center text-xs text-gray-400 font-bold py-1">{day}</div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {grid.map((day, index) => {
                    if (!day) return <div key={`empty-${index}`} className="p-2" />;

                    const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const isSelected = selectedDate && isSameDay(dayDate, selectedDate);
                    const isToday = isSameDay(new Date(), dayDate);
                    const isBlockedDay = isBlocked(dayDate);
                    const isNotWorkingDay = isDateNotWorking(dayDate);

                    // Check if date is in the past (before today)
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    const isPast = dayDate < now;

                    const isDisabled = isBlockedDay || isPast;

                    return (
                        <button
                            key={day}
                            onClick={() => !isDisabled && onChange(dayDate)}
                            disabled={isDisabled}
                            className={`h-10 w-full rounded-lg text-sm font-bold transition-all relative
                                ${isDisabled
                                    ? isNotWorkingDay || isPast
                                        ? 'bg-white/5 text-gray-600 cursor-not-allowed opacity-50' // Non-working days or Past days
                                        : 'bg-red-500/10 text-red-500 cursor-not-allowed border border-red-500/20' // Manually blocked dates
                                    : isSelected
                                        ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                                        : 'text-gray-300 hover:bg-white/10'
                                }
                                ${isToday && !isSelected && !isDisabled ? 'text-emerald-400 border border-emerald-500/30' : ''}
                            `}
                        >
                            <span className={isDisabled && !isNotWorkingDay && !isPast ? "line-through opacity-70" : ""}>{day}</span>
                            {/* Removed diagonal line */}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
