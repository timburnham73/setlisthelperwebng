import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetlistPrintShowDialogComponent } from './setlist-print-show-dialog.component';

describe('SetlistEditDialogComponent', () => {
  let component: SetlistPrintShowDialogComponent;
  let fixture: ComponentFixture<SetlistPrintShowDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [SetlistPrintShowDialogComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(SetlistPrintShowDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
