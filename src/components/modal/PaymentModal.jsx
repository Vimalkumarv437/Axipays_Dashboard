import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { CheckCircle2, XCircle, AlertCircle, X, ShieldCheck } from 'lucide-react';

export const PaymentModal = ({ isOpen, onClose, redirectUrl, status, onStatusSimulate }) => {
  const [windowDimension, setWindowDimension] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowDimension({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      {status === 'Success' && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <Confetti
            width={windowDimension.width}
            height={windowDimension.height}
            recycle={false}
            numberOfPieces={600}
            gravity={0.15}
            initialVelocityY={20}
          />
        </div>
      )}
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col relative transition-all" style={{ height: '85vh' }}>
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100 bg-white shadow-sm z-10">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center">
            {status === 'Pending' && <><AlertCircle className="w-5 h-5 mr-2 text-blue-500 animate-pulse" /> Complete Your Payment</>}
            {status === 'Success' && <><CheckCircle2 className="w-5 h-5 mr-2 text-green-500" /> Payment Successful</>}
            {status === 'Failed' && <><XCircle className="w-5 h-5 mr-2 text-red-500" /> Payment Failed</>}
          </h2>
          <div className="flex items-center space-x-4">
            {status === 'Pending' && <span className="flex items-center text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full"><ShieldCheck className="w-3 h-3 mr-1 text-green-600"/> Secure Checkout</span>}
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-50 relative overflow-hidden">
          {status === 'Pending' && redirectUrl ? (
            <iframe 
              src={redirectUrl} 
              className="w-full h-full border-none bg-white"
              title="Payment Checkout"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in slide-in-from-bottom-4 duration-500">
              {status === 'Success' && (
                <>
                  <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-100">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">Payment Successful!</h3>
                  <p className="text-slate-500 text-lg max-w-md">Your transaction has been completed securely and your receipt has been sent.</p>
                  <button 
                    onClick={onClose}
                    className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5"
                  >
                    Return to Dashboard
                  </button>
                </>
              )}
              {status === 'Failed' && (
                <>
                  <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-100">
                    <XCircle className="w-12 h-12" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">Payment Failed</h3>
                  <p className="text-slate-500 text-lg max-w-md">We couldn't process your payment. Please check your card details and try again.</p>
                  <button 
                    onClick={onClose}
                    className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        
        {status === 'Pending' && (
          <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-center space-x-3 items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-10">
            <span className="text-xs text-slate-400 font-medium">Demo Testing Actions:</span>
            <button 
              onClick={() => onStatusSimulate('Failed')}
              className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors"
            >
              Simulate Failure
            </button>
            <button 
              onClick={() => onStatusSimulate('Success')}
              className="px-3 py-1.5 bg-white border border-green-200 text-green-600 hover:bg-green-50 rounded-lg text-xs font-semibold transition-colors"
            >
              Simulate Success
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
