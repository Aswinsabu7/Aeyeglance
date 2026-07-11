import { Directive, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Directive that strips XSS-relevant characters from an input field on blur
 * and marks the control as touched. Attach with `appXssPrevent`.
 */
@Directive({
  selector: '[appXssPrevent]',
  standalone: true
})
export class XssPreventDirective {
  private readonly ngControl = inject(NgControl, { optional: true });

  @HostListener('blur', ['$event.target'])
  onBlur(input: HTMLInputElement): void {
    if (!input?.value) return;

    // Strip the most common injection characters while keeping readability
    const sanitised = input.value
      .replace(/<[^>]*>/g, '')          // Strip all HTML tags
      .replace(/javascript\s*:/gi, '')   // Remove javascript: URIs
      .replace(/on\w+\s*=/gi, '')        // Remove event handlers
      .trim();

    if (sanitised !== input.value) {
      input.value = sanitised;
      this.ngControl?.control?.setValue(sanitised, { emitEvent: true });
    }
  }
}
