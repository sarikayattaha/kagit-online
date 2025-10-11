export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replace(/[\s()-]/g, '');
  return /^[\d+]{10,15}$/.test(cleanPhone);
}

export function validateNumber(value: string, options?: { min?: number; max?: number }): boolean {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  if (options?.min !== undefined && num < options.min) return false;
  if (options?.max !== undefined && num > options.max) return false;
  return true;
}

export function sanitizeNumber(value: string): string {
  return value.replace(/[^\d.,]/g, '');
}

export function validateRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function validateLength(value: string, min: number, max: number): boolean {
  const length = value.trim().length;
  return length >= min && length <= max;
}
