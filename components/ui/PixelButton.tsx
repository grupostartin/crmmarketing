import React from 'react';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

const PixelButton: React.FC<PixelButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  let colors = 'bg-retro-cyan text-black border-black hover:bg-white';
  
  if (variant === 'secondary') colors = 'bg-retro-surface text-retro-fg border-retro-comment hover:border-retro-fg';
  if (variant === 'danger') colors = 'bg-retro-red text-black border-black hover:bg-white';
  if (variant === 'success') colors = 'bg-retro-green text-black border-black hover:bg-white';

  return (
    <button
      className={`
        px-4 py-2 font-header text-xs uppercase tracking-wide border-2 shadow-pixel transition-all
        active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
        ${colors} ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default PixelButton;