// src/app/shared/pipes/score.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'score',
  standalone: true
})
export class ScorePipe implements PipeTransform {
  transform(value: any, field: string): any {
    try {
      const data = JSON.parse(value);
      return data[field] || 0;
    } catch (e) {
      return 0;
    }
  }
}