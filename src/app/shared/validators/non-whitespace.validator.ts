import { AbstractControl, ValidationErrors } from "@angular/forms";

export function nonWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (typeof value !== "string") {
    return null;
  }
  return value.trim().length === 0 ? { whitespace: true } : null;
}
