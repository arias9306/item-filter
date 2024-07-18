import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PillsListComponent } from './pills-list.component';

describe('PillsListComponent', () => {
  let component: PillsListComponent;
  let fixture: ComponentFixture<PillsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PillsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PillsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
