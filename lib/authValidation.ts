export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/;
export const OTP_REGEX = /^\d{6}$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(normalizeEmail(value));
}

export function isValidPhone(value: string): boolean {
  return PHONE_REGEX.test(normalizePhone(value));
}

export function validatePassword(value: string): boolean {
  return value.trim().length >= 8;
}

export function getIdentifierType(value: string): "email" | "phone" | null {
  const trimmed = value.trim();
  if (trimmed.includes("@")) {
    return isValidEmail(trimmed) ? "email" : null;
  }
  return isValidPhone(trimmed) ? "phone" : null;
}

export function normalizeIdentifier(value: string): string | null {
  const type = getIdentifierType(value);
  if (type === "email") return normalizeEmail(value);
  if (type === "phone") return normalizePhone(value);
  return null;
}

export function maskIdentifier(value: string, type: "email" | "phone"): string {
  if (type === "email") {
    const normalized = normalizeEmail(value);
    const [local, domain] = normalized.split("@");
    if (!local || !domain) return normalized;
    const visible = local.slice(0, 2);
    return `${visible}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
  }

  const normalized = normalizePhone(value);
  if (normalized.length <= 4) return normalized;
  return `${"*".repeat(normalized.length - 4)}${normalized.slice(-4)}`;
}
