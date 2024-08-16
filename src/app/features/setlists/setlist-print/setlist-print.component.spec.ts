import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetlistPrintComponent } from './setlist-print.component';

describe('SetlistPrintComponent', () => {
  let component: SetlistPrintComponent;
  let fixture: ComponentFixture<SetlistPrintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetlistPrintComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetlistPrintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
