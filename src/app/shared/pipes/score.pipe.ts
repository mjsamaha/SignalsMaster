
import { Pipe, PipeTransform } from '@angular/core';

/**
 * ScorePipe extracts a numeric field from a JSON string for display in templates.
 * Returns 0 if parsing fails or field is missing.
 */
@Pipe({
  name: 'score',
  standalone: true
})
export class ScorePipe implements PipeTransform {
  /**
   * Transforms a JSON string to extract the specified field value.
   * @param value - JSON string input
   * @param field - Field name to extract
   * @returns Field value or 0 if not found/invalid
   */
  transform(value: any, field: string): any {
    try {
      const data = JSON.parse(value);
      return data[field] || 0;
    } catch (e) {
      return 0;
    }
  }
}