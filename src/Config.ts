import { Rect } from './Rect';

/**
 * @property {number[number, number][]} gridSeries    A list of ordered pairs indicating the grid units to be drawn
 * @property {Rect}   bound                           Coordinate limits
 * @property {boolean} aspectLocked                   Toggling whether the aspect ratio of the view port should be locked
 * @property {boolean} showGrid                       Show the grid layer or not
 */
export interface Config {
  /** 
   * A list of ordered pairs, indicating the grid units of the grid paper.
   * The ordered pairs start with the major grid unit, and end with the minor.
   * The list should be ranked in increasing order of the major grid units.
   */
  gridSeries?: number[][],
  /** Coordinate limits */
  bound?: Rect,
  /** Maximum major grid density */
  majorGridDensity?: number,
  /** Aspect locked */
  aspeckLocked?: true,
  /** Show grid */
  showGrid?: true
};

export var defaultConfig: Config = {
  gridSeries: [[10, 2], [50, 10], [100, 10], [200, 20]],
  bound: { minX: -500, maxX: 1500, minY: -500, maxY: 1500 },
  majorGridDensity: 0.02,
  aspeckLocked: true,
  showGrid: true
};
