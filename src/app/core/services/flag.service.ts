import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';

export interface Flag {
  id: string;
  name: string;
  meaning: string;
  category: 'letters' | 'numbers' | 'pennants' | 'special-pennants' | 'substitutes';
  imagePath: string;
}

export interface FlagsData {
  flags: Flag[];
}



@Injectable({
  providedIn: 'root'
})
export class FlagService {
  private readonly flagsData$: Observable<Flag[]>;

  constructor(private readonly http: HttpClient) {
    this.flagsData$ = this.http.get<FlagsData>('assets/data/flags.json').pipe(
      map(data => data.flags),
      shareReplay(1)
    );
  }

  /**
   * Get all flags
   */
  getAllFlags(): Observable<Flag[]> {
    return this.flagsData$;
  }

  /**
   * Get flags by category
   */
  getFlagsByCategory(category: string): Observable<Flag[]> {
    return this.flagsData$.pipe(
      map(flags => flags.filter(flag => flag.category === category))
    );
  }

  /**
   * Get a flag by ID
   */
  getFlagById(id: string): Observable<Flag | undefined> {
    return this.flagsData$.pipe(
      map(flags => flags.find(flag => flag.id === id))
    );
  }

  /**
   * Get random flags
   */
  getRandomFlags(count: number): Observable<Flag[]> {
    return this.flagsData$.pipe(
      map(flags => {
        const shuffled = [...flags].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
      })
    );
  }

  /**
   * Get all categories
   */
  getCategories(): Observable<string[]> {
    return this.flagsData$.pipe(
      map(flags => {
        const categories = new Set(flags.map(flag => flag.category));
        return Array.from(categories);
      })
    );
  }
}

