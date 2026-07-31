import { useEffect, useRef } from 'react';

/**
 * Six-slot OTP input. Auto-advances on digit entry, backspace-deletes into
 * the previous slot, and accepts a 6-digit paste that fills all slots at once.
 * `value` is a string of up to 6 digits; the parent owns state.
 */
export default function OtpInput({ value, onChange, onComplete, autoFocus }) {
  const refs = useRef([]);
  const digits = value.padEnd(6, ' ').split('').slice(0, 6);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const setDigit = (i, digit) => {
    const next = digits.map((d, idx) => (idx === i ? digit : d)).join('').replace(/\s+$/, '');
    onChange(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
    if (next.length === 6) onComplete?.(next);
  };

  const handleChange = (i, e) => {
    const v = e.target.value.replace(/\D/g, '').slice(-1);
    if (v) setDigit(i, v);
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i].trim() && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < 5) {
      refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    refs.current[focusIdx]?.focus();
    if (pasted.length === 6) onComplete?.(pasted);
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={d.trim()}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          className="h-14 w-12 rounded-[10px] border border-gray-700 bg-white text-center text-2xl font-mono font-medium text-gray-100 focus:border-[#1f5c3d] focus:outline-none focus:ring-1 focus:ring-[#1f5c3d]/40"
        />
      ))}
    </div>
  );
}
