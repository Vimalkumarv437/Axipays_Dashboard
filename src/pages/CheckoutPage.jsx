import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { initiatePayment } from '../api/paymentApi';
import { validateLuhn } from '../utils/luhnValidator';
import { generateHash } from '../utils/hashGenerator';
import { PaymentModal } from '../components/modal/PaymentModal';
import { Lock, Mail, User, MapPin, Phone, DollarSign, Globe, Eye, ShieldCheck, Check } from 'lucide-react';

export const CheckoutPage = () => {
  const [formData, setFormData] = useState({
    cardHolder: '',
    email: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    amount: '',
    currency: 'USD',
    country: '',
    address: '',
    phoneCode: 'US +1',
    phone: ''
  });

  const [displayCard, setDisplayCard] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [showCvv, setShowCvv] = useState(false);

  const secretKey = import.meta.env.SECRET_KEY;

  const handleCardChange = (e) => {
    let val = e.target.value;
    if (val.length < displayCard.length) {
      const newLen = val.replace(/\s+/g, '').length;
      const digitsOnly = formData.cardNumber.substring(0, newLen);
      updateCardState(digitsOnly);
      return;
    }
    const newChar = val.slice(-1);
    if (/\d/.test(newChar)) {
      const digitsOnly = (formData.cardNumber + newChar).substring(0, 16);
      updateCardState(digitsOnly);
    }
  };

  const updateCardState = (digitsOnly) => {
    setFormData({ ...formData, cardNumber: digitsOnly });
    if (digitsOnly.length === 0) {
      setDisplayCard('');
      return;
    }
    let masked = '';
    for (let i = 0; i < digitsOnly.length; i++) {
      if (i >= 6 && i < 12) {
        masked += '•';
      } else {
        masked += digitsOnly[i];
      }
    }
    const parts = [];
    for (let i = 0; i < masked.length; i += 4) {
      parts.push(masked.substring(i, i + 4));
    }
    setDisplayCard(parts.join(' '));
  };

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === 'phone') {
      value = value.replace(/\D/g, '');
      const maxLen = formData.phoneCode.includes('UK') ? 11 : 10;
      if (value.length > maxLen) value = value.slice(0, maxLen);
    } else if (name === 'phoneCode') {
      const maxLen = value.includes('UK') ? 11 : 10;
      if (formData.phone.length > maxLen) {
        setFormData(prev => ({ ...prev, [name]: value, phone: prev.phone.slice(0, maxLen) }));
        return;
      }
    } else if (name === 'cvv') {
      value = value.replace(/\D/g, '').slice(0, 3);
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.cardNumber.length < 13 || !validateLuhn(formData.cardNumber)) {
      toast.error("Invalid card number. Please check and try again.");
      return;
    }

    if (formData.cvv.length !== 3) {
      toast.error("CVV must be exactly 3 digits.");
      return;
    }

    // Email domain validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address with a proper domain (e.g., .com, .net).");
      return;
    }

    // Phone length validation based on country code
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (formData.phoneCode.includes('US') && phoneDigits.length !== 10) {
      toast.error("US phone numbers must be exactly 10 digits.");
      return;
    }
    if (formData.phoneCode.includes('IN') && phoneDigits.length !== 10) {
      toast.error("Indian phone numbers must be exactly 10 digits.");
      return;
    }
    if (formData.phoneCode.includes('UK') && (phoneDigits.length < 10 || phoneDigits.length > 11)) {
      toast.error("UK phone numbers must be 10 or 11 digits.");
      return;
    }

    setLoading(true);
    const hash = generateHash(formData.cardNumber, formData.email, secretKey);

    if (!hash) {
      toast.error("Could not generate secure hash.");
      setLoading(false);
      return;
    }

    try {
      const countryMap = {
        'US': 'United States',
        'UK': 'United Kingdom',
        'IN': 'India',
        'AE': 'UAE'
      };

      const payload = {
        orderId: `ORD${Math.floor(1000 + Math.random() * 9000)}`,
        cardHolderName: formData.cardHolder,
        email: formData.email,
        cardNumber: formData.cardNumber.replace(/\s+/g, ''),
        expiryMonth: formData.expiryMonth,
        expiryYear: formData.expiryYear.length === 2 ? `20${formData.expiryYear}` : formData.expiryYear,
        cardCVC: formData.cvv,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        country: countryMap[formData.country] || formData.country,
        address: formData.address,
        phone: formData.phone
      };

      const response = await initiatePayment(payload, hash);

      if (response && (response.redirect_url || response.redirection_url)) {
        setRedirectUrl(response.redirect_url || response.redirection_url);
        setPaymentStatus('Pending');
        setModalOpen(true);

        // Check the status/message from the response
        const isSuccess = response.status === 'Success' ||
          response.status === 'success' ||
          (response.message && response.message.toLowerCase().includes('success'));

        // If the API indicates success, automatically show the result (party pop) after a brief delay
        if (isSuccess) {
          setTimeout(() => {
            setPaymentStatus('Success');
          }, 3000); // Give the iframe 3 seconds to load before showing success
        }
      } else if (response && (response.status === 'Success' || (response.message && response.message.toLowerCase().includes('success')))) {
        // Fallback: If no redirect URL but successful
        setRedirectUrl('');
        setPaymentStatus('Success');
        setModalOpen(true);
      } else {
        toast.error("Payment initiation failed. No redirect URL provided.");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred during payment.");
    } finally {
      setLoading(false);
    }
  };

  // Format amount for button
  const formattedAmount = formData.amount ? `${parseFloat(formData.amount).toFixed(2)}` : '0.00';

  return (
    <div className="bg-[#f4f7f9] min-h-screen py-10 px-4 font-sans flex flex-col items-center">

      {/* Header section */}
      <div className="flex flex-col items-center mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center text-[#1e293b] font-bold text-3xl tracking-tight mb-2">
          <div className="w-10 h-10 bg-[#2563eb] text-white rounded-xl flex items-center justify-center mr-3 relative overflow-hidden shadow-sm">
            <span className="font-serif italic text-2xl leading-none z-10 font-bold ml-1 mt-1">N</span>
            <div className="absolute inset-0 bg-[#1d4ed8] opacity-30 transform -rotate-12 scale-150 translate-x-1 translate-y-1"></div>
          </div>
          AXIPAYS
        </div>
        <h2 className="text-slate-500 font-medium mb-3">Secure Checkout</h2>
        <div className="inline-flex items-center bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
          <Lock className="w-3 h-3 mr-1.5" /> 256-bit SSL Encrypted
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center justify-center space-x-2 mb-10 w-full max-w-md animate-in fade-in duration-700">
        <div className="flex items-center text-[#1e3a8a] text-xs font-bold tracking-widest">
          <div className="w-2 h-2 rounded-full bg-[#1e3a8a] mr-2"></div> DETAILS
        </div>
        <div className="h-px bg-slate-300 w-16 mx-2"></div>
        <div className="flex items-center text-slate-300 text-xs font-bold tracking-widest">
          <div className="w-2 h-2 rounded-full bg-slate-300 mr-2"></div> CONFIRM
        </div>
        <div className="h-px bg-slate-300 w-16 mx-2"></div>
        <div className="flex items-center text-slate-300 text-xs font-bold tracking-widest">
          <div className="w-2 h-2 rounded-full bg-slate-300 mr-2"></div> DONE
        </div>
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-[550px] relative animate-in fade-in slide-in-from-bottom-8 duration-700">

        {/* Virtual Credit Card */}
        <div className="absolute -top-16 sm:-top-20 left-1/2 transform -translate-x-1/2 w-[90%] max-w-[420px] aspect-[1.75/1] sm:h-[240px] sm:aspect-auto rounded-2xl p-5 sm:p-6 text-white shadow-2xl z-10 overflow-hidden group hover:-translate-y-2 transition-all duration-300"
          style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)' }}>

          {/* Glass Reflection Pass on Hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 group-hover:[animation:shine_1.5s_ease-in-out_infinite] pointer-events-none -translate-x-[150%] z-20"></div>

          {/* Card Shine Effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full filter blur-3xl transform translate-x-20 -translate-y-10"></div>

          <div className="flex flex-col justify-between h-full relative z-10">
            {/* Top row */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[0.55rem] sm:text-[0.65rem] text-slate-300 tracking-widest font-semibold opacity-80 uppercase">AXIPAYS</p>
                <p className="font-bold tracking-wide text-base sm:text-lg">Secure Card</p>
              </div>
              <p className="text-[0.55rem] sm:text-[0.65rem] text-slate-300 tracking-widest font-semibold opacity-80">CARD</p>
            </div>

            {/* Middle: Chip and Number */}
            <div>
              <div className="w-10 h-7 sm:w-12 sm:h-8 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-md mb-2 sm:mb-6 shadow-sm relative flex items-center justify-center opacity-90">
                <div className="w-full h-px bg-yellow-700/30 absolute"></div>
                <div className="w-px h-full bg-yellow-700/30 absolute"></div>
              </div>
              <div className="text-[1.1rem] sm:text-xl tracking-[0.15em] sm:tracking-[0.2em] font-mono text-slate-100">
                {displayCard || '•••• •••• •••• ••••'}
              </div>
            </div>

            {/* Bottom Row */}
            <div className="flex justify-between items-end mt-1">
              <div>
                <p className="text-[0.5rem] sm:text-[0.6rem] text-slate-400 tracking-widest uppercase mb-0.5 sm:mb-1">Cardholder</p>
                <p className="font-bold tracking-wider uppercase text-xs sm:text-sm truncate w-32 sm:w-48">{formData.cardHolder || 'YOUR NAME'}</p>
              </div>
              <div className="text-right">
                <p className="text-[0.5rem] sm:text-[0.6rem] text-slate-400 tracking-widest uppercase mb-0.5 sm:mb-1">Expires</p>
                <p className="font-bold tracking-wider text-xs sm:text-sm">{formData.expiryMonth || 'MM'}/{formData.expiryYear || 'YY'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* White Form Box */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 pt-48 sm:pt-52 pb-8 px-6 sm:px-8 relative z-0">

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Card Information Section */}
            <div>
              <h3 className="text-[0.7rem] font-bold text-slate-400 tracking-widest uppercase mb-4">Card Information</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[0.8rem] font-semibold text-slate-700 mb-1.5">Cardholder Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="cardHolder"
                      required
                      value={formData.cardHolder}
                      onChange={handleChange}
                      className="pl-10 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[0.8rem] font-semibold text-slate-700 mb-1.5">Card Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <div className="w-5 h-3.5 border-2 border-slate-400 rounded-sm"></div>
                    </div>
                    <input
                      type="text"
                      required
                      value={displayCard}
                      onChange={handleCardChange}
                      maxLength={19}
                      className="pl-11 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 font-mono text-sm tracking-widest outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all"
                      placeholder="1234 5678 9012 3456"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                      <div className="w-5 h-3.5 border-2 border-slate-300 rounded-sm flex items-center justify-center opacity-50"><div className="w-3 h-0.5 bg-slate-300"></div></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[0.8rem] font-semibold text-slate-700 mb-1.5">Expiry</label>
                    <div className="flex space-x-2">
                      <select
                        name="expiryMonth"
                        required
                        value={formData.expiryMonth}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1e3a8a] text-slate-600 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1em_1em] transition-all"
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")` }}
                      >
                        <option value="" disabled>MM</option>
                        {Array.from({ length: 12 }, (_, i) => {
                          const m = (i + 1).toString().padStart(2, '0');
                          return <option key={m} value={m}>{m}</option>;
                        })}
                      </select>
                      <select
                        name="expiryYear"
                        required
                        value={formData.expiryYear}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1e3a8a] text-slate-600 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1em_1em] transition-all"
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")` }}
                      >
                        <option value="" disabled>YY</option>
                        {Array.from({ length: 10 }, (_, i) => {
                          const y = (new Date().getFullYear() + i).toString().slice(-2);
                          return <option key={y} value={y}>{y}</option>;
                        })}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[0.8rem] font-semibold text-slate-700 mb-1.5 flex justify-between">
                      <span>CVV</span>
                      <span className="w-3 h-3 border border-slate-400 rounded-full flex items-center justify-center text-[0.5rem] text-slate-400 mt-0.5">i</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCvv ? "text" : "password"}
                        name="cvv"
                        required
                        maxLength={3}
                        value={formData.cvv}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 font-mono tracking-widest text-sm outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all"
                        placeholder="•••"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button type="button" onClick={() => setShowCvv(!showCvv)} className="text-slate-400 hover:text-slate-600 focus:outline-none">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-100 my-6" />

            {/* Contact & Billing Section */}
            <div>
              <h3 className="text-[0.7rem] font-bold text-slate-400 tracking-widest uppercase mb-4">Contact & Billing</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[0.8rem] font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[0.8rem] font-semibold text-slate-700 mb-1.5">Phone Number</label>
                  <div className="flex space-x-2">
                    <select
                      name="phoneCode"
                      value={formData.phoneCode}
                      onChange={handleChange}
                      className="w-1/3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1e3a8a] text-slate-600 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1em_1em] transition-all"
                      style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")` }}
                    >
                      <option value="US +1">US +1</option>
                      <option value="UK +44">UK +44</option>
                      <option value="IN +91">IN +91</option>
                    </select>
                    <div className="relative w-2/3">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        maxLength={formData.phoneCode.includes('UK') ? 11 : 10}
                        className="pl-10 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all"
                        placeholder={formData.phoneCode.includes('UK') ? "11 digit number" : "10 digit number"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-100 my-6" />

            {/* Payment Details Section */}
            <div>
              <h3 className="text-[0.7rem] font-bold text-slate-400 tracking-widest uppercase mb-4">Payment Details</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[0.8rem] font-semibold text-slate-700 mb-1.5">Amount</label>
                  <div className="flex space-x-2">
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="w-1/3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1e3a8a] text-slate-600 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1em_1em] transition-all"
                      style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")` }}
                    >
                      <option value="USD">US USD</option>
                      <option value="EUR">EU EUR</option>
                      <option value="GBP">UK GBP</option>
                      <option value="INR">IN INR</option>
                    </select>
                    <div className="relative w-2/3">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <span className="text-slate-600 font-bold">$</span>
                      </div>
                      <input
                        type="number"
                        name="amount"
                        required
                        min="0.01"
                        step="0.01"
                        value={formData.amount}
                        onChange={handleChange}
                        className="pl-8 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-base font-bold outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all"
                        placeholder="250.00"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[0.8rem] font-semibold text-slate-700 mb-1.5">Country</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Globe className="h-4 w-4 text-slate-400" />
                    </div>
                    <select
                      name="country"
                      required
                      value={formData.country}
                      onChange={handleChange}
                      className="pl-10 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1e3a8a] text-slate-600 appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em_1em] transition-all"
                      style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")` }}
                    >
                      <option value="" disabled>Select Country</option>
                      <option value="US">us United States</option>
                      <option value="UK">uk United Kingdom</option>
                      <option value="IN">in India</option>
                      <option value="AE">ae UAE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[0.8rem] font-semibold text-slate-700 mb-1.5">Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className="pl-10 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all"
                      placeholder="Street, city, state, postal code"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-white font-semibold text-base transition-all shadow-md ${loading ? 'bg-[#1e3a8a]/70 cursor-not-allowed' : 'bg-[#1e3a8a] hover:bg-[#152b6b] hover:shadow-lg'
                  }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Lock className="w-4 h-4 mr-2 stroke-[2.5]" /> Pay ${formattedAmount} Securely
                  </span>
                )}
              </button>
            </div>

            {/* Badges under button */}
            <div className="flex items-center justify-center space-x-6 pt-4">
              <div className="flex items-center text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider">
                <Lock className="w-3 h-3 mr-1" /> SSL Secured
              </div>
              <div className="flex items-center text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 mr-1" /> PCI Compliant
              </div>
              <div className="flex items-center text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider">
                <Check className="w-3 h-3 mr-1" /> 256-bit Encryption
              </div>
            </div>

          </form>
        </div>
      </div>

      {/* Footer text */}
      <div className="text-center mt-6 sm:mt-8 text-xs text-slate-500 font-medium pb-8 w-full max-w-sm sm:max-w-none">
        Powered by <span className="font-bold text-[#1e3a8a]">AXIPAYS</span>
        <span className="hidden sm:inline"> • </span>
        <br className="block sm:hidden my-1" />
        <span className="inline-block mt-1 sm:mt-0">Your payment info is encrypted end-to-end.</span>
      </div>

      <PaymentModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          if (paymentStatus === 'Success') {
            setFormData({
              cardHolder: '',
              email: '',
              cardNumber: '',
              expiryMonth: '',
              expiryYear: '',
              cvv: '',
              amount: '',
              currency: 'USD',
              country: '',
              address: '',
              phoneCode: 'US +1',
              phone: ''
            });
            setDisplayCard('');
          }
        }}
        redirectUrl={redirectUrl}
        status={paymentStatus}
        onStatusSimulate={(status) => setPaymentStatus(status)}
      />
    </div>
  );
};
