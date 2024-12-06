import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LyricsPrintComponent } from './lyrics-print.component';

describe('SetlistPrintComponent', () => {
  let component: LyricsPrintComponent;
  let fixture: ComponentFixture<LyricsPrintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LyricsPrintComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LyricsPrintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
