import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  Renderer2,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { produce } from 'immer';
import { debounceTime, noop, skip, Subject, Subscription, tap } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit, OnDestroy {
  // changeDetector = inject(ChangeDetectorRef);
  formBuilder = inject(FormBuilder);
  renderer = inject(Renderer2);

  formControl: FormControl;
  overflowStartIndexSignal = signal<number>(-1);
  containerResizeObserver: ResizeObserver = new ResizeObserver(noop);
  containerResizeSubject: Subject<void> = new Subject<void>();
  resizeChangeSubscription: Subscription = new Subscription();

  items: string[] = [
    'White, Walter (wwhite9)',
    'Walter (wwhite9)',
    'Pinkman, Jesse (jpinkman48)',
    'Jesse (jpinkman48)',
    'John Doe (jdoe448)',
    'John (jdoe448)',
    'Fring, Gustavo (hermanosp22)',
    'Gustavo (hermanosp22)',
    'White, Skyler (swhite448)',
  ];

  textInputSignal =
    viewChild.required<ElementRef<HTMLInputElement>>('textInput');

  pillContainerSignal =
    viewChild.required<ElementRef<HTMLDivElement>>('pillContainer');

  moreItemsPillSignal = viewChild<ElementRef<HTMLDivElement>>('moreItemsPill');

  pillsSignal = viewChildren<ElementRef<HTMLDivElement>>('pill');

  overflowedItemsSignal = computed(() => {
    if (this.overflowStartIndexSignal() !== -1) {
      return this.pillsSignal().length - this.overflowStartIndexSignal();
    }
    return 0;
  });

  calculateOverflow = effect(() => this.checkPills('effect'), {
    allowSignalWrites: true,
  });

  constructor() {
    this.formControl = this.formBuilder.control('');
  }

  checkPills(from: string) {
    console.log('calling checkPills from', from, new Date().getTime());

    // Make items visible first and restart overflow start index
    this.showAllItems();

    if (this.pillContainerSignal() && this.pillsSignal().length > 0) {
      const containerWidth =
        this.pillContainerSignal().nativeElement.offsetWidth;

      // Get Index of first item that overflows
      let index = this.pillsSignal().findIndex(
        ({ nativeElement: el }) =>
          el.offsetLeft + el.offsetWidth > containerWidth
      );

      if (index !== -1) {
        // Hide all elements with index >= overflowStartIndex
        this.hideOverflowingItems(index);

        // If More Items pill is visible
        const moreItemPills = this.moreItemsPillSignal();
        if (moreItemPills?.nativeElement) {
          let moreItemsOverflowing = true;

          // Hide last visible item until "More Items pill" does not overflow
          while (moreItemsOverflowing && index >= 0) {
            const { offsetLeft, offsetWidth } = moreItemPills.nativeElement;
            const moreItemsEndPosition = offsetLeft + offsetWidth;
            if (moreItemsEndPosition > containerWidth) {
              index -= 1;
              this.hideOverflowingItems(index);
            } else {
              moreItemsOverflowing = false;
            }
          }
        }
      }
      this.overflowStartIndexSignal.set(index);
    }
  }

  private showAllItems() {
    this.pillsSignal().forEach(({ nativeElement: el }, index) => {
      this.renderer.removeClass(el, 'hide');
    });
  }

  private hideOverflowingItems(index: number) {
    const length = this.pillsSignal().length - 1;
    if (this.pillsSignal().length > 0 && index != -1) {
      for (let i = length; i >= index; i--) {
        const el = this.pillsSignal()[i].nativeElement;
        this.renderer.addClass(el, 'hide');
      }
    }
  }

  ngAfterViewInit() {
    //this.checkPills('afterViewInit');
    this.resizeChangeSubscription = this.containerResizeSubject
      .asObservable()
      .pipe(
        debounceTime(100),
        skip(1),
        tap(() => this.checkPills('resize observer'))
      )
      .subscribe();
    this.containerResizeObserver = new ResizeObserver(() =>
      this.containerResizeSubject.next()
    );
    this.containerResizeObserver.observe(document.querySelector('.items-box')!);
  }

  ngOnDestroy() {
    this.containerResizeObserver?.disconnect();
  }

  addItem() {
    if (this.formControl.value) {
      this.items = produce(this.items, (draft) => {
        draft.push(this.formControl.value);
      });
      this.formControl.reset();
      this.textInputSignal().nativeElement.focus();
      //this.checkPills('add item');
    }
  }

  removeItem(index: number) {
    this.items = produce(this.items, (draft) => {
      draft.splice(index, 1);
    });
    //this.checkPills('remove item');
  }

  removeOverflowedItems() {
    this.items = produce(this.items, (draft) => {
      draft.length = draft.length - this.overflowedItemsSignal();
    });
    //this.checkPills('remove overflowed items');
  }

  removeAllItems() {
    this.items = produce(this.items, (draft) => {
      draft.length = 0;
    });
    this.overflowStartIndexSignal.set(-1);
    //this.checkPills('remove all items');
  }
}
