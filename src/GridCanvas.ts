/**
 * @author  Celestial Phineas
 * @license MIT
 */
import { Config, defaultConfig } from './Config';
import { Rect, GeometricRect } from './Rect';
import UIOverlay from './UiController';
import ResizeObserver from 'resize-observer-polyfill';

/**
 * GridCanvas is an experimental preview window in Cartesian system with friendly controls
 * @class
 * @property  aspectLocked  Toggle if the aspect ratio of the viewport is mutable
 * @property  showGrids     Toggle grid display
 */
export default class GridCanvas {
  // HTML elements
  /** GridCanvas container, the div element to initialize on */
  container: HTMLElement;
  /**  UI control conponents */
  uiOverlay: UIOverlay;

  // Layers
  /** The layer on the top of the grid layer */
  upperLayer: HTMLCanvasElement;
  /**
   * Redraw function of the upper layer
   * You can modify this function by re-defining it
   * The redraw function is called when the viewport is changed
   */
  redrawUpper(ctx: CanvasRenderingContext2D): void {}
  /** The grid layer of the window, in essence an HTML canvas element */
  gridLayer: HTMLCanvasElement;
  /** The layer on the bottom of the grid layer */
  lowerLayer: HTMLCanvasElement;
  /**
   * Redraw function of the lower layer
   * You can modify this function by re-defining it
   * The redraw function is called when the viewport is changed
   */
  redrawLower(ctx: CanvasRenderingContext2D): void {}

  // Geometric properties
  /** The coordinary boundary of the project */
  bound: GeometricRect;
  /** Rectangular area indicating current display */
  displayRect: GeometricRect;
  /** Zoom factor of current view: display/bound */
  get zoomFactor() { return (this.displayRect.maxX - this.displayRect.minX) / (this.bound.maxX - this.bound.minX); }

  // Grid styles
  /** Major grid color */
  majorGridColor = '#cccccc';
  /** Major grid line width */
  majorGridWidth = 0.5;
  /** Minor grid color */
  minorGridColor = '#dddddd';
  /** Minor grid line width */
  minorGridWidth = 0.4;

  // Grid properties
  /** Max major grid density, number of lines/pixel */
  majorGridDensity: number;
  /** Grid series */
  gridSeries: number[][];

  // Flags
  private aspectLock = true;
  /** Canvas aspect locked */
  get aspectLocked() { return this.aspectLock; }
  set aspectLocked(newVal) { this.aspectLock = newVal; }
  //
  private showGridsFlag = true;
  /** Flag to toggle grid display */
  get showGrids() { return this.showGridsFlag; }
  set showGrids(newVal) { this.showGridsFlag = newVal; this.display(); }
  

  /** Update canvas geometric settings */
  display() {
    let [minX, maxX, minY, maxY] = [
      this.displayRect.minX,
      this.displayRect.maxX,
      this.displayRect.minY,
      this.displayRect.maxY
    ];
    this.redrawLower(this.lowerLayer.getContext('2d'));
    this.drawGridLines();
    this.redrawUpper(this.upperLayer.getContext('2d'));
  }

  /**
   * @constructor
   * @param elementID   The element id of the div to initialize
   * @param config      Configuration options
   */
  constructor(elementID: string, config?: Config) {
    let bound = (config? config.bound : undefined) || defaultConfig.bound;
    this.gridSeries = (config? config.gridSeries : undefined) || defaultConfig.gridSeries;
    this.majorGridDensity = (config? config.majorGridDensity : undefined) || defaultConfig.majorGridDensity;
    this.aspectLock = (config? config.aspeckLocked : undefined) || defaultConfig.aspeckLocked;
    this.showGridsFlag = (config? config.showGrid : undefined) || defaultConfig.showGrid;

    // UI and canvas container
    var container = document.getElementById(elementID);
    this.container = container;
    this.container.style.textAlign = 'left';
    this.container.style.position = 'relative';

    // Create lower layer
    this.lowerLayer = document.createElement('canvas');
    this.lowerLayer.style.position = 'absolute';
    this.lowerLayer.id = (this.container.id||'preview-container') + '-upper';
    this.lowerLayer.style.width = '100%';
    this.lowerLayer.style.height = '100%';
    this.container.appendChild(this.lowerLayer);
    this.lowerLayer.width = this.lowerLayer.clientWidth;
    this.lowerLayer.height = this.lowerLayer.clientHeight;
    // Create canvas
    this.gridLayer = document.createElement('canvas');
    this.gridLayer.style.position = 'absolute';
    this.gridLayer.id = (this.container.id||'preview-container') + '-canvas';
    this.gridLayer.style.width = '100%';
    this.gridLayer.style.height = '100%';
    this.container.appendChild(this.gridLayer);
    this.gridLayer.width = this.gridLayer.clientWidth;
    this.gridLayer.height = this.gridLayer.clientHeight;
    // Create upper layer
    this.upperLayer = document.createElement('canvas');
    this.upperLayer.style.position = 'absolute';
    this.upperLayer.id = (this.container.id||'preview-container') + '-upper';
    this.upperLayer.style.width = '100%';
    this.upperLayer.style.height = '100%';
    this.container.appendChild(this.upperLayer);
    this.upperLayer.width = this.upperLayer.clientWidth;
    this.upperLayer.height = this.upperLayer.clientHeight;

    var resizeCallback = () => {
      const [ oldWidth, oldHeight ] = [ this.gridLayer.width, this.gridLayer.height ];
      const newWidth = this.upperLayer.width = this.lowerLayer.width = this.gridLayer.width = this.container.clientWidth;
      const newHeight = this.upperLayer.width = this.lowerLayer.width = this.gridLayer.height = this.container.clientHeight;
      // If the new width is larger than scaling with aspect fixed
      if(newWidth > newHeight / oldHeight * oldWidth) {
        // Make the display rect width fixed
        let midY = (this.displayRect.minY + this.displayRect.maxY)/2;
        let newDisplayHeight = (this.displayRect.maxX - this.displayRect.minX)/newWidth*newHeight;
        this.displayRect.minY = midY - newDisplayHeight/2;
        this.displayRect.maxY = midY + newDisplayHeight/2;
      } else {
        // Make the dispaly rect height fixed
        let midX = (this.displayRect.minX + this.displayRect.maxX)/2;
        let newDisplayWidth = (this.displayRect.maxY - this.displayRect.minY)/newHeight*newWidth;
        this.displayRect.minX = midX - newDisplayWidth/2;
        this.displayRect.maxX = midX + newDisplayWidth/2;
      }
      
      this.uiOverlay.updateDifferences();
      this.uiOverlay.syncView();
      this.display();
    }
    // Usage of ResizeObserver, see: https://wicg.github.io/ResizeObserver/
    const ro = new ResizeObserver(resizeCallback);
    ro.observe(this.gridLayer);

    let parent = this;
    // Display rect
    this.displayRect = {
      _minx: bound.minX, _maxx: bound.maxX, _maxy: bound.maxY,
      _miny: bound.maxY - (bound.maxX - bound.minX) / this.gridLayer.width * this.gridLayer.height,
      get minX() { return this._minx; },
      get maxX() { return this._maxx; },
      get minY() { return this._miny; },
      get maxY() { return this._maxy; },
      set minX(newVal: number) {
        this.setMinX(newVal);
        if (parent.uiOverlay) { parent.uiOverlay.syncView(); }
        parent.display();
      },
      set maxX(newVal: number) {
        this.setMaxX(newVal);
        if (parent.uiOverlay) { parent.uiOverlay.syncView(); }
        parent.display();
      },
      set minY(newVal: number) {
        this.setMinY(newVal);
        if (parent.uiOverlay) { parent.uiOverlay.syncView(); }
        parent.display();
      },
      set maxY(newVal: number) {
        this.setMaxY(newVal);
        if (parent.uiOverlay) { parent.uiOverlay.syncView(); }
        parent.display();
      },
      // These setting functions have no callbacks
      setMinX(newVal: number) { this._minx = newVal; },
      setMaxX(newVal: number) { this._maxx = newVal; },
      setMinY(newVal: number) { this._miny = newVal; },
      setMaxY(newVal: number) { this._maxy = newVal; }
    };
    if((bound.maxX - bound.minX)/(bound.maxY - bound.minY) > this.gridLayer.width/this.gridLayer.height) {
      this.displayRect._maxy = bound.maxY;
      this.displayRect._minx = bound.maxX - (bound.maxY - bound.minY) / this.gridLayer.height * this.gridLayer.width;
    }

    // Bound rect
    this.bound = {
      _minx: bound.minX, _maxx: bound.maxX, _miny: bound.minY, _maxy: bound.maxY,
      get minX() { return this._minx; },
      get maxX() { return this._maxx; },
      get minY() { return this._miny; },
      get maxY() { return this._maxy; },
      set minX(newVal: number) {
        if (parent.uiOverlay) { parent.uiOverlay.syncView(); }
        this.setMinX(newVal);
        parent.display();
      },
      set maxX(newVal: number) {
        if (parent.uiOverlay) { parent.uiOverlay.syncView(); }
        this.setMaxX(newVal);
        parent.display();
      },
      set minY(newVal: number) {
        if (parent.uiOverlay) { parent.uiOverlay.syncView(); }
        this.setMinY(newVal);
        parent.display();
      },
      set maxY(newVal: number) {
        if (parent.uiOverlay) { parent.uiOverlay.syncView(); }
        this.setMaxY(newVal);
        parent.display();
      },
      // These setting functions have no callbacks
      setMinX(newVal: number) { this._minx = newVal; },
      setMaxX(newVal: number) { this._maxx = newVal; },
      setMinY(newVal: number) { this._miny = newVal; },
      setMaxY(newVal: number) { this._maxy = newVal; }
    };

    // Create UI overlay
    this.uiOverlay = new UIOverlay(this);
    this.display();
  }

  // View controlling
  /**
   * Scaling the display rectangle
   * @param projectX    X coordinate in the project space
   * @param projectY    Y coordinate in the project space
   * @param scale       Zoom scale
   */
  zoomDisplay(projectX: number, projectY: number, scale: number): void;
  // Implementation
  zoomDisplay(...args: any[]) {
    // First case
    var x, y: number;
    x = args[0] as number;
    y = args[1] as number;
    let scale = args.pop();
    // Nothing to scale
    if (scale === 1) return;
    // Too big to scale
    if (scale > 1 && (this.displayRect.minX === this.bound.minX && this.displayRect.maxX === this.bound.maxX
      || this.displayRect.minY === this.bound.minY && this.displayRect.maxY === this.bound.maxY))
      return;
    // Too small to scale
    if (scale < 1 && this.uiOverlay.horizontalBar.upperRange - this.uiOverlay.horizontalBar.lowerRange < this.uiOverlay.horizontalBar.minDifference)
      return;
    if (scale < 1 && this.uiOverlay.verticalBar.upperRange - this.uiOverlay.verticalBar.lowerRange < this.uiOverlay.verticalBar.minDifference)
      return;
    let offsets: Rect = {
      minX: this.displayRect.minX - x,
      maxX: this.displayRect.maxX - x,
      minY: this.displayRect.minY - y,
      maxY: this.displayRect.maxY - y
    };
    offsets.minX *= scale; offsets.maxX *= scale;
    offsets.minY *= scale; offsets.maxY *= scale;
    let expected: Rect = {
      minX: offsets.minX + x,
      maxX: offsets.maxX + x,
      minY: offsets.minY + y,
      maxY: offsets.maxY + y
    }
    if (expected.minY < this.bound.minY) {
      let d = this.bound.minY - expected.minY;
      expected.minY = this.bound.minY;
      expected.maxY += d;
      if (expected.maxY > this.bound.maxY) {
        expected.maxY = this.bound.maxX;
        let expectedDx = (this.bound.maxY - this.bound.minY) / this.gridLayer.height * this.gridLayer.width;
        let diff = expectedDx - (expected.maxX - expected.minX);
        expected.maxX += diff / 2; expected.minX -= diff / 2;
      }
    }
    if (expected.maxY > this.bound.maxY) {
      let d = expected.maxY - this.bound.maxY;
      expected.maxY = this.bound.maxY;
      expected.minY -= d;
      if (expected.minY < this.bound.minY) {
        expected.minY = this.bound.minY;
        let expectedDx = (this.bound.maxY - this.bound.minY) / this.gridLayer.height * this.gridLayer.width;
        let diff = expectedDx - (expected.maxX - expected.minX);
        expected.minX += diff / 2; expected.minX -= diff / 2;
      }
    }
    if (expected.minX < this.bound.minX) {
      let d = this.bound.minX - expected.minX;
      expected.minX = this.bound.minX;
      expected.maxX += d;
      if (expected.maxX > this.bound.maxX) {
        expected.maxX = this.bound.maxX;
        let expectedDy = (this.bound.maxX - this.bound.minX) / this.gridLayer.width * this.gridLayer.height;
        let diff = expectedDy - (expected.maxY - expected.minY);
        expected.maxY += diff / 2; expected.minY -= diff / 2;
      }
    }
    if (expected.maxX > this.bound.maxX) {
      let d = expected.maxX - this.bound.maxX;
      expected.maxX = this.bound.maxX;
      expected.minX -= d;
      if (expected.minX < this.bound.minX) {
        expected.minX = this.bound.minX;
        let expectedDy = (this.bound.maxX - this.bound.minX) / this.gridLayer.width * this.gridLayer.height;
        let diff = expectedDy - (expected.maxY - expected.minY);
        expected.maxY += diff / 2; expected.minY -= diff / 2;
      }
    }

    // Update view
    this.displayRect.minX = expected.minX;
    this.displayRect.maxX = expected.maxX;
    this.displayRect.minY = expected.minY;
    this.displayRect.maxY = expected.maxY;
    this.uiOverlay.syncView();
    this.display();
  }

  /**
   * Scroll the view horizontally
   * @param offset      Horizontal scrolling offset
   */
  scrollHorizontally(offset: number) {
    if (this.displayRect.minX + offset < this.bound.minX) offset = this.bound.minX - this.displayRect.minX;
    if (this.displayRect.maxX + offset > this.bound.maxX) offset = this.bound.maxX - this.displayRect.maxX;
    this.displayRect.minX += offset;
    this.displayRect.maxX += offset;
    this.uiOverlay.syncView();
    this.display();
  }

  /**
   * Scroll the view vertically
   * @param offset      Vertically scrolling offset
   */
  scrollVertically(offset: number) {
    if (this.displayRect.minY + offset < this.bound.minY) offset = this.bound.minY - this.displayRect.minY;
    if (this.displayRect.maxY + offset > this.bound.maxY) offset = this.bound.maxY - this.displayRect.maxY;
    this.displayRect.minY += offset;
    this.displayRect.maxY += offset;
    this.uiOverlay.syncView();
    this.display();
  }

  private drawGridLines() {
    let ctx = this.gridLayer.getContext('2d');
    ctx.clearRect(0, 0, this.gridLayer.width, this.gridLayer.height);
    if(!this.showGridsFlag) return;

    // Number of max horizontal grid lines
    let nMaxHorizontal = Math.ceil(this.majorGridDensity * this.gridLayer.height);
    // Number of max vertical grid lines
    let nMaxVertical = Math.ceil(this.majorGridDensity * this.gridLayer.width);
    // Check if the grid series is useable
    const checkGridUseability = (a: number[]) => {
      let max = Math.max.apply(this, a);
      if (max * nMaxHorizontal > this.displayRect.maxY - this.displayRect.minY
        && max * nMaxVertical > this.displayRect.maxX - this.displayRect.minX) return true;
      else return false;
    }
    // Number of major grid lines
    let nHMajorGridLines = 0, nVMajorGridLines = 0;
    // Number of minor grid lines
    let nHMinorGridLines = 0, nVMinorGridLines = 0;
    let useableGrid: number[] = [0, 0];
    for (let i in this.gridSeries) {
      let max = Math.max.apply(this, this.gridSeries[i]);
      let min = Math.min.apply(this, this.gridSeries[i]);
      if (checkGridUseability(this.gridSeries[i])) {
        useableGrid = this.gridSeries[i];
        nHMajorGridLines = Math.ceil((this.displayRect.maxY - this.displayRect.minY) / max);
        nVMajorGridLines = Math.ceil((this.displayRect.maxX - this.displayRect.minX) / max);
        nHMinorGridLines = Math.ceil((this.displayRect.maxY - this.displayRect.minY) / min);
        nVMinorGridLines = Math.ceil((this.displayRect.maxX - this.displayRect.minX) / min);
        break;
      }
    }

    let [w, h] = [this.gridLayer.width, this.gridLayer.height];
    let minProjectDiff = Math.min.apply(this, useableGrid);
    let minViewDiff = Math.min.apply(this, useableGrid)/(this.displayRect.maxX - this.displayRect.minX)*this.gridLayer.width;
    let firstMinorHLineY = this.p2vY(Math.ceil(this.displayRect.minY / minProjectDiff) * minProjectDiff);
    ctx.fillStyle = this.minorGridColor;
    for(let i = 0; i < nHMinorGridLines; i++) {
      ctx.fillRect(0, firstMinorHLineY - i * minViewDiff - this.minorGridWidth/2, w, this.minorGridWidth);
    }
    let firstMinorVLineX = this.p2vX(Math.ceil(this.displayRect.minX / minProjectDiff) * minProjectDiff);
    for(let i = 0; i < nVMinorGridLines; i++) {
      ctx.fillRect(firstMinorVLineX + i * minViewDiff - this.minorGridWidth/2, 0, this.minorGridWidth, h);
    }
    let maxProjectDiff = Math.max.apply(this, useableGrid);
    let maxViewDiff = Math.max.apply(this, useableGrid)/(this.displayRect.maxX - this.displayRect.minX)*this.gridLayer.width;
    let firstMajorHLineY = this.p2vY(Math.ceil(this.displayRect.minY / maxProjectDiff) * maxProjectDiff);
    ctx.fillStyle = this.majorGridColor;
    for(let i = 0; i < nHMajorGridLines; i++) {
      ctx.fillRect(0, firstMajorHLineY - i * maxViewDiff - this.majorGridWidth/2, w, this.majorGridWidth);
    }
    let firstMajorVLineX = this.p2vX(Math.ceil(this.displayRect.minX / maxProjectDiff) * maxProjectDiff);
    for(let i = 0; i < nVMajorGridLines; i++) {
      ctx.fillRect(firstMajorVLineX + i * maxViewDiff - this.majorGridWidth/2, 0, this.majorGridWidth, h);
    }
  }
  /**
   * Convert the X coordinate in the view to the project coordinate
   * @param viewX       X coordinate in the viewport
   */
  v2pX(viewX: number): number {
    return viewX/this.gridLayer.width*(this.displayRect.maxX - this.displayRect.minX) + this.displayRect.minX;
  }
  /**
   * Convert the Y coordinate in the view to the project coordinate
   * @param viewY       Y coordinate in the viewport
   */
  v2pY(viewY: number): number {
    return this.displayRect.maxY - viewY/this.gridLayer.height*(this.displayRect.maxY - this.displayRect.minY);
  }
  /** 
   * Convert the Y coordinate in the project to the view coordinate
   * @param projectX    X coordinate in the project space
   */
  p2vX(projectX: number): number {
    return (projectX - this.displayRect.minX)/(this.displayRect.maxX - this.displayRect.minX)*this.gridLayer.width;
  }
  /** 
   * Convert the Y coordinate in the project to the view coordinate
   * @param projectY    Y coordinate in the project space
   */
  p2vY(projectY: number): number {
    return (this.displayRect.maxY - projectY)/(this.displayRect.maxY - this.displayRect.minY) * this.gridLayer.height;
  }
  /**
   * Convert the project coordinate to the view coordinate
   * @param x           X coordinate in the project space
   * @param y           Y coordinate in the project space
   * @returns {[number, number]} The result coordinate in an array
   */
  projectToView(x: number, y: number): [number, number];
  /**
   * Convert the project coordinate to the view coordinate 
   * @param xy          Project coordinate in array
   * @returns {[number, number]} The result coordinate in an array
   */
  projectToView(xy: number[]): [number, number];
  // Implementation
  projectToView(...args: any[]): [number, number] {
    var x, y: number;
    if(typeof args[0] === 'number') {
      x = args[0]; y = args[1];
    } else if(args[0] as number[]) {
      let arg = args[0] as number[];
      if(arg.length !== 2) {
        throw Error(`Invalid parameter ${arg}`);
      }
      x = arg[0]; y = arg[1];
    }
    return [this.p2vX(x), this.p2vY(y)];
  }
  /**
   * Convert the view coordinate to the project coordinate
   * @param x           X coordinate in the viewport
   * @param y           Y coordinate in the viewport
   * @returns {[number, number]} The result coordinate in an array
   */
  viewToProject(x: number, y: number): [number, number];
  /**
   * Convert the view coordinate to the project coordinate
   * @param xy          Project coordinate in array
   * @returns {[number, number]} The result coordinate in an array
   */
  viewToProject(xy: number[]): [number, number];
  // Implementation
  viewToProject(...args: any[]): [number, number] {
    var x, y: number;
    if(typeof args[0] === 'number') {
      x = args[0]; y = args[1];
    } else if(args[0] as number[]) {
      let arg = args[0] as number[];
      if(arg.length !== 2) {
        throw Error(`Invalid parameter ${arg}`);
      }
      x = arg[0]; y = arg[1];
    }
    return [this.v2pX(x), this.v2pY(y)];
  }

  /** Remove the constructed elements */
  destruct(): void {
    this.container.removeChild(this.uiOverlay.container);
    this.container.removeChild(this.gridLayer);
    this.container.removeChild(this.upperLayer);
    this.container.removeChild(this.lowerLayer);
  }
};  