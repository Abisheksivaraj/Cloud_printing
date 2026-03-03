import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    const Icon = type === 'success' ? CheckCircle : XCircle;

    return (
        <div className={`fixed bottom-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-white transition-all transform animate-in slide-in-from-right duration-300 ${bgColor}`}>
            <Icon size={20} />
            <span className="font-bold text-sm">{message}</span>
            <button
                onClick={onClose}
                className="ml-2 hover:bg-white/20 p-1 rounded transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
