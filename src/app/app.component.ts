import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { produce } from 'immer';
import { PillsListComponent } from './pills-list/pills-list.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, PillsListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  formBuilder = inject(FormBuilder);
  formControl: FormControl = this.formBuilder.control('');

  items = signal<string[]>([
    'White, Walter (wwhite9)',
    'Walter (wwhite9)',
    'Pinkman, Jesse (jpinkman48)',
    'Jesse (jpinkman48)',
    'John Doe (jdoe448)',
    'John (jdoe448)',
    'Fring, Gustavo (hermanosp22)',
    'Gustavo (hermanosp22)',
    'White, Skyler (swhite448)',
  ]);

  textInputSignal =
    viewChild.required<ElementRef<HTMLInputElement>>('textInput');

  addItem() {
    if (this.formControl.value) {
      this.items.update((items) =>
        produce(items, (draft) => {
          draft.push(this.formControl.value);
        })
      );

      this.formControl.reset();
      this.textInputSignal().nativeElement.focus();
    }
  }
}
