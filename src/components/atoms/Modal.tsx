import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Card } from './Card';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#2D3B42]/50 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal Dialog */}
      <div className={`relative w-full ${maxWidthStyles[maxWidth]} z-10 animate-scale-up`}>
        <Card variant="solid" padding="lg" className="rounded-3xl border border-[#2D3B42]/10 bg-white/95 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-start justify-between pb-4 border-b border-[#2D3B42]/10">
            <div>
              <h3 className="text-xl font-bold text-[#2D3B42] font-serif tracking-tight">{title}</h3>
              {subtitle && <p className="text-xs text-[#2D3B42]/60 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#2D3B42]/50 hover:text-[#EF4623] hover:bg-[#EF4623]/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="pt-4 text-[#2D3B42]">
            {children}
          </div>
        </Card>
      </div>
    </div>
  );
};
