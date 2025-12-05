import { AfterViewInit, Directive, ElementRef } from '@angular/core';

@Directive({
    selector: '[auto-focus]',
    standalone: true
})
export class AutoFocusDirective implements AfterViewInit {
  constructor(private element: ElementRef<HTMLInputElement>) { }
 
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.element.nativeElement.focus();
    }, 300);
    
  }
}
