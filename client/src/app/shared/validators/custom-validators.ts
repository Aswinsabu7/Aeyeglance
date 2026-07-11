import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// ── XSS Pattern List ──────────────────────────────────────────────────────────
const XSS_PATTERNS: RegExp[] = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /<\s*iframe/gi,
  /<\s*object/gi,
  /<\s*embed/gi,
  /eval\s*\(/gi,
  /expression\s*\(/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /&#x[0-9a-fA-F]+;/gi,
  /&#[0-9]+;/gi
];

function hasXss(value: string): boolean {
  return XSS_PATTERNS.some(p => { p.lastIndex = 0; return p.test(value); });
}

// ── Validators ────────────────────────────────────────────────────────────────

/** Rejects values containing XSS payloads. */
export const xssValidator = (): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value || typeof value !== 'string') return null;
    return hasXss(value) ? { xss: { message: 'Input contains potentially unsafe content' } } : null;
  };
};

/** Ensures only letters, spaces, hyphens and apostrophes. */
export const nameValidator = (): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;
    const valid = /^[a-zA-Z\s'\-]+$/.test(value);
    return valid ? null : { invalidName: { message: 'Name may only contain letters, spaces, hyphens or apostrophes' } };
  };
};

/** Disallows pure whitespace values. */
export const noWhitespaceValidator = (): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value as string) ?? '';
    const isWhitespace = value.trim().length === 0 && value.length > 0;
    return isWhitespace ? { whitespace: { message: 'Value cannot be blank whitespace' } } : null;
  };
};
