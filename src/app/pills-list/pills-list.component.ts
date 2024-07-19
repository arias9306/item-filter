import { JsonPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  OnDestroy,
  Renderer2,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { produce } from 'immer';
import { debounceTime, skip, Subject, Subscription, tap } from 'rxjs';

@Component({
  selector: 'app-pills-list',
  standalone: true,
  imports: [JsonPipe],
  templateUrl: './pills-list.component.html',
  styleUrl: './pills-list.component.css',
})
export class PillsListComponent implements AfterViewInit, OnDestroy {
  private readonly renderer = inject(Renderer2);

  pills = model.required<string[]>();
  showInfo = input<boolean>(false);

  private containerResizeSubject: Subject<void> = new Subject<void>();
  private containerResizeObserver!: ResizeObserver;
  private resizeChangeSubscription!: Subscription;

  protected pillsElements = viewChildren<ElementRef<HTMLDivElement>>('pill');
  protected pillContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('pillContainer');
  protected moreItemsPill =
    viewChild<ElementRef<HTMLDivElement>>('moreItemsPill');

  protected overflowStartIndex = signal<number>(-1);
  protected overflowedItems = computed(() => {
    if (this.overflowStartIndex() !== -1) {
      return this.pills().length - this.overflowStartIndex();
    }
    return 0;
  });

  protected calculateOverflow = effect(() => this.checkPills('effect'), {
    allowSignalWrites: true,
  });

  ngAfterViewInit() {
    this.createResizeObserver();
  }

  ngOnDestroy() {
    this.containerResizeObserver?.disconnect();
    this.resizeChangeSubscription?.unsubscribe();
  }

  removeItem(index: number) {
    this.pills.update((items) =>
      produce(items, (draft) => {
        draft.splice(index, 1);
      })
    );
  }

  removeOverflowedItems() {
    this.pills.update((items) =>
      produce(items, (draft) => {
        draft.length = draft.length - this.overflowedItems();
      })
    );
  }

  removeAllItems() {
    this.pills.update((items) =>
      produce(items, (draft) => {
        draft.length = 0;
      })
    );
    this.overflowStartIndex.set(-1);
  }

  private createResizeObserver() {
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

  private showAllItems() {
    this.pillsElements().forEach(({ nativeElement: element }) => {
      this.renderer.removeClass(element, 'hide');
    });
  }

  private hideOverflowingItems(index: number) {
    const length = this.pillsElements().length - 1;
    for (let i = length; i >= index; i--) {
      const el = this.pillsElements()[i].nativeElement;
      this.renderer.addClass(el, 'hide');
    }
  }

  private checkPills(from: string) {
    console.log('calling checkPills from', from);
    // Make items visible first and restart overflow start index
    this.showAllItems();

    const pillContainerElement = this.pillContainer();

    if (pillContainerElement && this.pills().length > 0) {
      const containerWidth = pillContainerElement.nativeElement.offsetWidth;

      // Get Index of first item that overflows
      let firstItemOverflowIndex = this.pillsElements().findIndex(
        ({ nativeElement: element }) =>
          element.offsetLeft + element.offsetWidth > containerWidth
      );

      if (firstItemOverflowIndex !== -1) {
        // avoid track more item pills signal
        let moreItemPillsElement = undefined;
        untracked(() => {
          moreItemPillsElement = this.moreItemsPill()?.nativeElement;
        });

        // If More Items pill is visible
        if (moreItemPillsElement) {
          let moreItemsOverflowing = true;

          // Hide last visible item until "More Items pill" does not overflow
          while (moreItemsOverflowing && firstItemOverflowIndex >= 0) {
            const { offsetLeft, offsetWidth } = moreItemPillsElement;
            const moreItemsEndPosition = offsetLeft + offsetWidth;
            if (moreItemsEndPosition > containerWidth) {
              firstItemOverflowIndex -= 1;
              this.hideOverflowingItems(firstItemOverflowIndex);
            } else {
              moreItemsOverflowing = false;
            }
          }
        } else {
          // Hide all elements with index >= overflowStartIndex
          this.hideOverflowingItems(firstItemOverflowIndex);
        }
      }
      this.overflowStartIndex.set(firstItemOverflowIndex);
    }
  }
}
