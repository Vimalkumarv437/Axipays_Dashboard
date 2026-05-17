import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export const Navbar = () => {
  const location = useLocation();

  return (
    <header className="bg-white border-b border-slate-200 min-h-[64px] flex flex-wrap items-center justify-between px-4 sm:px-8 sticky top-0 z-50 py-3 md:py-0">
      {/* Left: Logo */}
      <div className="flex items-center text-[#1e293b] font-bold text-lg sm:text-xl tracking-tight md:w-1/4 w-1/2">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#2563eb] text-white rounded-lg flex items-center justify-center mr-2 relative overflow-hidden shadow-sm">
          <span className="font-serif italic text-base sm:text-lg leading-none z-10 font-bold ml-0.5 mt-0.5">N</span>
          <div className="absolute inset-0 bg-[#1d4ed8] opacity-30 transform -rotate-12 scale-150 translate-x-1 translate-y-1"></div>
        </div>
        AXIPAYS
      </div>

      {/* Right: PCI & User Profile (Moved to keep logo and profile on top row on mobile) */}
      <div className="flex items-center justify-end space-x-4 sm:space-x-6 md:w-1/4 w-1/2">
        <div className="hidden lg:flex items-center text-emerald-600 text-xs font-semibold tracking-wide">
          <ShieldCheck className="w-4 h-4 mr-1.5 stroke-[2.5]" />
          PCI-DSS Certified
        </div>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1e40af] flex items-center justify-center text-white font-semibold text-xs shadow-sm ring-2 ring-white">
          AD
        </div>
      </div>

      {/* Center: Navigation Pill (Wraps to bottom on mobile) */}
      <div className="flex flex-1 justify-center w-full md:w-auto mt-4 md:mt-0 order-3 md:order-none">
        <div className="flex items-center bg-slate-50/80 p-1 rounded-full border border-slate-200 w-full sm:w-auto justify-center">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-4 sm:px-6 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex-1 text-center sm:flex-none ${isActive
                ? 'bg-white text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                : 'text-slate-500 hover:text-slate-700'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/checkout"
            className={({ isActive }) =>
              `px-4 sm:px-6 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex-1 text-center sm:flex-none ${isActive
                ? 'bg-white text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                : 'text-slate-500 hover:text-slate-700'
              }`
            }
          >
            Checkout
          </NavLink>
        </div>
      </div>
    </header>
  );
};
