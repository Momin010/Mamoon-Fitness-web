import { Exercise, ExerciseLevel, ExerciseCategory } from '../types/fitness';
import exercisesData from './data/exercises.json';

class ExerciseService {
  private exercises: Exercise[];
  
  constructor() {
    this.exercises = exercisesData as Exercise[];
  }

  /**
   * Get all exercises
   */
  getAll(): Exercise[] {
    return this.exercises;
  }

  /**
   * Get total count
   */
  getCount(): number {
    return this.exercises.length;
  }

  /**
   * Get exercise by ID
   */
  getById(id: string): Exercise | undefined {
    return this.exercises.find(e => e.id === id);
  }

  /**
   * Get exercises by experience level
   */
  getByLevel(level: ExerciseLevel): Exercise[] {
    return this.exercises.filter(e => e.level === level);
  }

  /**
   * Get exercises by primary muscle
   */
  getByPrimaryMuscle(muscle: string): Exercise[] {
    return this.exercises.filter(e => 
      e.primaryMuscles.includes(muscle.toLowerCase())
    );
  }

  /**
   * Get exercises by any muscle (primary or secondary)
   */
  getByMuscle(muscle: string): Exercise[] {
    const muscleLower = muscle.toLowerCase();
    return this.exercises.filter(e => 
      e.primaryMuscles.includes(muscleLower) || 
      e.secondaryMuscles.includes(muscleLower)
    );
  }

  /**
   * Get exercises by equipment
   */
  getByEquipment(equipment: string): Exercise[] {
    return this.exercises.filter(e => 
      e.equipment?.toLowerCase() === equipment.toLowerCase()
    );
  }

  /**
   * Get bodyweight exercises only
   */
  getBodyweight(): Exercise[] {
    return this.exercises.filter(e => 
      e.equipment === 'body only' || e.equipment === null
    );
  }

  /**
   * Get exercises by category
   */
  getByCategory(category: ExerciseCategory): Exercise[] {
    return this.exercises.filter(e => e.category === category);
  }

  /**
   * Get exercises by force type (push/pull)
   */
  getByForce(force: 'push' | 'pull'): Exercise[] {
    return this.exercises.filter(e => e.force === force);
  }

  /**
   * Get compound exercises
   */
  getCompound(): Exercise[] {
    return this.exercises.filter(e => e.mechanic === 'compound');
  }

  /**
   * Get isolation exercises
   */
  getIsolation(): Exercise[] {
    return this.exercises.filter(e => e.mechanic === 'isolation');
  }

  /**
   * Search exercises by name
   */
  search(query: string): Exercise[] {
    const queryLower = query.toLowerCase();
    return this.exercises.filter(e => 
      e.name.toLowerCase().includes(queryLower)
    );
  }

  /**
   * Get all unique muscle groups
   */
  getAllMuscles(): string[] {
    const muscles = new Set<string>();
    this.exercises.forEach(e => {
      e.primaryMuscles.forEach(m => muscles.add(m));
      e.secondaryMuscles.forEach(m => muscles.add(m));
    });
    return Array.from(muscles).sort();
  }

  /**
   * Get all unique equipment types
   */
  getAllEquipment(): string[] {
    const equipment = new Set<string>();
    this.exercises.forEach(e => {
      if (e.equipment) equipment.add(e.equipment);
    });
    return Array.from(equipment).sort();
  }

  /**
   * Get exercises filtered by multiple criteria
   */
  filter(options: {
    level?: ExerciseLevel;
    muscle?: string;
    equipment?: string;
    category?: ExerciseCategory;
    force?: 'push' | 'pull';
    mechanic?: 'compound' | 'isolation';
  }): Exercise[] {
    return this.exercises.filter(e => {
      if (options.level && e.level !== options.level) return false;
      if (options.muscle) {
        const muscleLower = options.muscle.toLowerCase();
        if (!e.primaryMuscles.includes(muscleLower) && 
            !e.secondaryMuscles.includes(muscleLower)) {
          return false;
        }
      }
      if (options.equipment && e.equipment?.toLowerCase() !== options.equipment.toLowerCase()) {
        return false;
      }
      if (options.category && e.category !== options.category) {
        return false;
      }
      if (options.force && e.force !== options.force) {
        return false;
      }
      if (options.mechanic && e.mechanic !== options.mechanic) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get random exercises
   */
  getRandom(count: number, options?: {
    level?: ExerciseLevel;
    muscle?: string;
    category?: ExerciseCategory;
  }): Exercise[] {
    let filtered = this.exercises;
    
    if (options) {
      filtered = this.filter(options);
    }
    
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Get exercises suitable for a beginner full body workout
   */
  getBeginnerFullBody(): {
    push: Exercise[];
    pull: Exercise[];
    legs: Exercise[];
    core: Exercise[];
  } {
    const beginner = this.getByLevel('beginner');
    
    return {
      push: beginner.filter(e => 
        e.force === 'push' && 
        ['chest', 'shoulders', 'triceps'].some(m => 
          e.primaryMuscles.includes(m)
        )
      ).slice(0, 10),
      pull: beginner.filter(e => 
        e.force === 'pull' && 
        ['lats', 'biceps', 'middle back', 'traps'].some(m => 
          e.primaryMuscles.includes(m)
        )
      ).slice(0, 10),
      legs: beginner.filter(e => 
        ['quadriceps', 'hamstrings', 'glutes', 'calves'].some(m => 
          e.primaryMuscles.includes(m)
        )
      ).slice(0, 10),
      core: beginner.filter(e => 
        e.primaryMuscles.includes('abdominals')
      ).slice(0, 10)
    };
  }
}

// Export singleton instance
export const exerciseService = new ExerciseService();

// Also export class for testing
export { ExerciseService };
