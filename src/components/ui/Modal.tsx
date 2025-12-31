import React from 'react';
import { Check, AlertCircle, X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    text: string;
    type?: 'success' | 'error' | 'warning';
    showConfirmButton?: boolean;
    confirmText?: string;
    cancelText?: string;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    text,
    type = 'success',
    showConfirmButton = false,
    confirmText = 'אישור',
    cancelText = 'ביטול'
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'error': return <AlertCircle className="w-8 h-8 text-red-500" />;
            case 'warning': return <AlertCircle className="w-8 h-8 text-orange-500" />;
            default: return <Check className="w-8 h-8 text-emerald-500" />;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case 'error': return 'bg-red-500/10 text-red-500';
            case 'warning': return 'bg-orange-500/10 text-orange-500';
            default: return 'bg-emerald-500/10 text-emerald-500';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative glass-panel bg-[#1a1a1a] p-8 rounded-3xl max-w-sm w-full text-center border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] transform transition-all scale-100">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${getBgColor()}`}>
                    {getIcon()}
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-300 mb-8 font-medium leading-relaxed">{text}</p>

                <div className="flex gap-3">
                    {showConfirmButton && onConfirm && (
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="flex-1 bg-emerald-500 text-black font-black py-3 rounded-xl hover:bg-emerald-400 transition-colors"
                        >
                            {confirmText}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className={`flex-1 font-bold py-3 rounded-xl transition-colors ${showConfirmButton
                                ? 'bg-white/10 text-white hover:bg-white/20'
                                : 'bg-white text-black hover:bg-gray-200'
                            }`}
                    >
                        {showConfirmButton ? cancelText : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
