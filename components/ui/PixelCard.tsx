import React from 'react';

interface PixelCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  color?: 'default' | 'purple' | 'pink' | 'green' | 'cyan';
}

const PixelCard: React.FC<PixelCardProps> = ({ children, title, className = '', color = 'default' }) => {
    let borderColor = 'border-black';
    let shadowColor = 'shadow-black';
    let headerBg = 'bg-retro-surface';

    if (color === 'purple') {
        borderColor = 'border-retro-purple';
        headerBg = 'bg-retro-purple text-black';
    }

  return (
    <div className={`bg-retro-surface border-4 ${borderColor} shadow-pixel ${className}`}>
      {title && (
        <div className={`border-b-4 ${borderColor} px-4 py-2 ${headerBg}`}>
          <h3 className="font-header text-sm uppercase tracking-wider">{title}</h3>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export default PixelCard;