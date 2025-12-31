import React, { useEffect } from 'react';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, children, title }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity cursor-pointer" onClick={onClose}></div>
            <div className="relative w-full max-w-lg bg-[#0a0a0a] border-t border-white/10 rounded-t-[3rem] p-8 animate-slide-up shadow-[0_-20px_60px_rgba(0,0,0,0.9)] max-h-[85vh] overflow-y-auto">
                <div className="w-16 h-1 bg-gray-800 rounded-full mx-auto mb-8"></div>
                <h3 className="text-3xl font-black text-white mb-8 text-center tracking-tight metallic-text">{title}</h3>
                {children}
            </div>
        </div>
    );
};
