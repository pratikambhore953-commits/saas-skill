"use client";

import { useRef, useState } from "react";

type OTPInputProps = {
  onComplete: (otp: string) => void;
  disabled?: boolean;
};

export default function OTPInput({ onComplete, disabled = false }: OTPInputProps) {
  const [values, setValues] = useState<string[]>(Array(6).fill(""));
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const emitIfComplete = (next: string[]) => {
    if (next.every((digit) => digit.length === 1)) {
      onComplete(next.join(""));
    }
  };

  const handleChange = (index: number, input: string) => {
    const digit = input.replace(/\D/g, "").slice(-1);
    const next = [...values];
    next[index] = digit;
    setValues(next);

    if (digit && index < 5) {
      refs.current[index + 1]?.focus();
    }
    emitIfComplete(next);
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !values[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = Array(6)
      .fill("")
      .map((_, i) => pasted[i] ?? "");
    setValues(next);
    refs.current[Math.min(5, pasted.length)]?.focus();
    emitIfComplete(next);
  };

  return (
    <div className="flex items-center gap-2">
      {values.map((value, index) => (
        <input
          key={`otp-${index}`}
          ref={(el) => {
            refs.current[index] = el;
          }}
          value={value}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          className={`h-14 w-12 rounded-lg border bg-[#111a33] text-center text-xl font-semibold text-white outline-none transition ${
            value
              ? "border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)]"
              : "border-white/20 focus:border-amber-400"
          }`}
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
