const phonePattern = /^\+?[\d\s().-]+$/;

export function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, '').length;
  return phonePattern.test(value) && digits >= 7 && digits <= 15;
}
