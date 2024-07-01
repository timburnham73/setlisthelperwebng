import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LyricViewWrapperComponent } from './lyric-view-wrapper.component';

describe('LyricViewWrapperComponent', () => {
  let component: LyricViewWrapperComponent;
  let fixture: ComponentFixture<LyricViewWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LyricViewWrapperComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LyricViewWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
