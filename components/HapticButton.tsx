
import React from 'react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  impact?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
}

export const HapticButton: React.FC<Props> = ({ children, onClick, impact = 'medium', className, ...props }) => {
  const triggerHaptic = () => {
    if (!('vibrate' in navigator)) return;
    
    switch (impact) {
      case 'light': navigator.vibrate(15); break;
      case 'medium': navigator.vibrate(30); break;
      case 'heavy': navigator.vibrate([40, 30, 40]); break;
      case 'success': navigator.vibrate([20, 50, 20]); break;
      case 'error': navigator.vibrate([10, 80, 10, 80]); break;
      default: navigator.vibrate(30);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerHaptic();
    onClick?.(e);
  };

  return (
    <button 
      onClick={handleClick} 
      className={`active:scale-95 transition-all duration-200 select-none ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};
