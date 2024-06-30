import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutNoSidebarChildViewComponent } from './layout-no-sidebar-child-view.component';

describe('LayoutNoSidebarComponent', () => {
  let component: LayoutNoSidebarChildViewComponent;
  let fixture: ComponentFixture<LayoutNoSidebarChildViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [LayoutNoSidebarChildViewComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(LayoutNoSidebarChildViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
