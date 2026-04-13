"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import OTPInput from "@/components/OTPInput";
import { ProfileChangeType, requestProfileOtp, verifyProfileOtp } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type ExtraField = {
  label: string;
  name: string;
  type: string;
};

type OTPVerifySheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  changeType: ProfileChangeType;
  title: string;
  description: string;
  extraField?: ExtraField;
};

function endpointPayload(changeType: ProfileChangeType, extraField?: ExtraField, extraValue?: string): {
  new_email?: string;
  phone?: string;
} {
  if (!extraField || !extraValue) {
    return {};
  }
  if (changeType === "EMAIL_CHANGE") {
    return { new_email: extraValue };
  }
  if (changeType === "PHONE_CHANGE") {
    return { phone: extraValue };
  }
  return {};
}

export default function OTPVerifySheet({
  isOpen,
  onClose,
  onSuccess,
  changeType,
  title,
  description,
  extraField,
}: OTPVerifySheetProps) {
  const { updateUser } = useAuth();
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [otp, setOtp] = useState("");
  const [extraValue, setExtraValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setOtpSent(false);
      setCountdown(30);
      setOtp("");
      setExtraValue("");
      setSubmitting(false);
      setAttemptsRemaining(3);
      setMessage(null);
      setError(null);
      setShowSuccess(false);
      setShake(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!otpSent || countdown === 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpSent, countdown]);

  const isResendVisible = otpSent && countdown === 0;
  const needsExtraValue = Boolean(extraField);
  const verifyDisabled = submitting || otp.length !== 6 || (needsExtraValue && !extraValue.trim());

  const attemptsText = useMemo(() => {
    return `${attemptsRemaining} attempts remaining`;
  }, [attemptsRemaining]);

  const handleSendOtp = async () => {
    setError(null);
    setMessage(null);
    if (needsExtraValue && !extraValue.trim()) {
      setError(`${extraField?.label ?? "Field"} is required.`);
      return;
    }

    try {
      setSubmitting(true);
      await requestProfileOtp(changeType, endpointPayload(changeType, extraField, extraValue.trim()));
      setOtpSent(true);
      setCountdown(30);
      setAttemptsRemaining(3);
      setMessage("OTP sent successfully.");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send OTP");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    setMessage(null);

    try {
      setSubmitting(true);
      const payload: {
        otp: string;
        change_type: ProfileChangeType;
        new_password?: string;
      } = {
        otp,
        change_type: changeType,
      };

      if (changeType === "PASSWORD_CHANGE") {
        payload.new_password = extraValue;
      }

      const response = await verifyProfileOtp(payload);
      updateUser({
        name: response.user.name,
        email: response.user.email,
        phone: (response.user as { phone?: string | null }).phone ?? undefined,
        avatar_url: response.user.avatar_url,
        bio: response.user.bio ?? null,
        about_me: response.user.about_me ?? response.user.bio ?? null,
        location: response.user.location,
        email_verified: (response.user as { email_verified?: boolean }).email_verified,
      });
      setShowSuccess(true);
      window.setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (verifyError) {
      const errMessage = verifyError instanceof Error ? verifyError.message : "Invalid OTP";
      setError(errMessage);
      setAttemptsRemaining((prev) => Math.max(0, prev - 1));
      setShake(true);
      window.setTimeout(() => setShake(false), 450);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70"
          onClick={onClose}
        />

        <div className="absolute inset-0 flex items-end justify-center p-4 sm:items-center">
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              <p className="mt-1 text-sm text-slate-300">{description}</p>
            </div>

            {extraField && (
              <div className="mb-4">
                <label className="mb-1 block text-sm text-slate-200">{extraField.label}</label>
                <input
                  type={extraField.type}
                  value={extraValue}
                  onChange={(event) => setExtraValue(event.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-[#121523] px-3 py-2 text-white outline-none ring-2 ring-transparent focus:ring-amber-500/35"
                />
              </div>
            )}

            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={submitting}
                className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Sending..." : "Send OTP"}
              </button>
            ) : (
              <div className="space-y-4">
                <motion.div
                  animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <OTPInput onComplete={setOtp} disabled={submitting} />
                </motion.div>

                <div className="flex items-center justify-between text-xs">
                  <p className="text-slate-400">{attemptsText}</p>
                  {isResendVisible ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={submitting}
                      className="font-semibold text-amber-300 transition hover:text-amber-200"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    <p className="text-slate-400">Resend in {countdown}s</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifyDisabled}
                  className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Verifying..." : "Verify & Apply Change"}
                </button>
              </div>
            )}

            {message && <p className="mt-3 text-sm text-emerald-300">{message}</p>}
            {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

            {showSuccess && (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-4 flex flex-col items-center justify-center gap-2 text-emerald-300"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <p className="text-sm font-medium">Change applied successfully</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
