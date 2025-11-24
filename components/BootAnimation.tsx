import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import logo from '../assets/logo.png';

interface BootAnimationProps {
  onComplete: () => void;
}

const BootAnimation: React.FC<BootAnimationProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  const systemLogs = [
    "INITIALIZING_KERNEL...",
    "LOADING_MODULES...",
    "CHECKING_PERMISSIONS...",
    "ESTABLISHING_SECURE_CONNECTION...",
    "SYNCING_DATA_STREAMS...",
    "RENDERING_INTERFACE...",
    "SYSTEM_READY"
  ];

  useEffect(() => {
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 5;
        if (next >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return next;
      });
    }, 50);

    // Log messages animation
    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < systemLogs.length) {
        setLogs(prev => [...prev, systemLogs[logIndex]]);
        logIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 300);

    // Complete sequence
    const timeout = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(logInterval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#0D1117] z-[100] flex flex-col items-center justify-center font-mono overflow-hidden">
      {/* Background Grid Effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, black, transparent)'
        }}
      />

      <div className="relative z-10 flex flex-col items-center w-full max-w-md p-6">
        {/* Logo Glitch Effect Container */}
        <div className="mb-12 relative group">
          <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
          <div className="w-20 h-20 bg-white border-4 border-black shadow-[8px_8px_0_0_#13ecc8] flex items-center justify-center relative z-10 animate-bounce-slight">
             <img src={logo} alt="StartinOS" className="w-12 h-12 object-contain" />
          </div>
        </div>

        {/* Terminal Output */}
        <div className="w-full bg-black/50 border-2 border-gray-700 p-4 mb-6 h-32 overflow-hidden flex flex-col justify-end font-display text-xs md:text-sm shadow-inner">
           {logs.map((log, i) => (
             <div key={i} className="text-green-500 mb-1">
               <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {'>'} {log}
             </div>
           ))}
           <div className="animate-pulse text-primary">_</div>
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-2">
           <div className="flex justify-between text-xs font-display text-primary tracking-widest">
              <span>LOADING</span>
              <span>{Math.min(100, Math.round(progress))}%</span>
           </div>
           <div className="h-4 border-2 border-black bg-gray-800 p-0.5 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-75 ease-out relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                {/* Stripes pattern in progress bar */}
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(45deg,rgba(0,0,0,.15) 25%,transparent 25%,transparent 50%,rgba(0,0,0,.15) 50%,rgba(0,0,0,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}></div>
              </div>
           </div>
        </div>

        {/* Footer Text */}
        <div className="mt-8 text-gray-500 text-xs tracking-[0.2em] uppercase animate-pulse">
           StartinOS CRM v1.0
        </div>
      </div>
    </div>
  );
};

export default BootAnimation;
