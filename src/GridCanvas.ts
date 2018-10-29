import { Config, defaultConfig } from './Config';
import { Rect, GeometricRect } from './Rect';
import UIOverlay from './UiController';
import ResizeObserver from 'resize-observer-polyfill';

// TODO: Add layers
// A user interface on canvas
export default class GridCanvas {
  // HTML elements
  /** Grid paper container, the div element to initialize on */
  container: HTMLElement;
  /** UI control conponents */
  uiOverlay: UIOverlay;
  /** Canvas to draw */
  canvas: HTMLCanvasElement;

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
    this.drawGridLines();
  }

  constructor(config: Config) {
    let bound = config.bound || defaultConfig.bound;
    this.gridSeries = config.gridSeries || defaultConfig.gridSeries;
    this.majorGridDensity = config.majorGridDensity || defaultConfig.majorGridDensity;
    this.aspectLock = config.aspeckLocked || defaultConfig.aspeckLocked;
    this.showGridsFlag = config.showGrid || defaultConfig.showGrid;

    // UI and canvas container
    var container = document.getElementById(config.elementID);
    this.container = container;
    this.container.style.textAlign = 'left';
    this.container.style.position = 'relative';

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.id = (this.container.id ? this.container.id : 'preview-container') + '-canvas';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.container.appendChild(this.canvas);
    var resizeCallback = () => {
      const [ oldWidth, oldHeight ] = [ this.canvas.width, this.canvas.height ];
      const newWidth = this.canvas.width = this.container.clientWidth;
      const newHeight = this.canvas.height = this.container.clientHeight;
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
        let newDisplayWidth = (this.displayRect.maxY - this.displayRect.minY)/newHeight*newHeight;
        this.displayRect.minX = midX - newDisplayWidth/2;
        this.displayRect.maxX = midX + newDisplayWidth/2;
      }
      
      this.uiOverlay.updateDifferences();
      this.uiOverlay.syncView();
      this.display();
    }
    // Usage of ResizeObserver, see: https://wicg.github.io/ResizeObserver/
    const ro = new ResizeObserver(resizeCallback);
    ro.observe(this.canvas);

    let parent = this;
    // Display rect
    (window as any).displayRect = this.displayRect = {
      _minx: bound.minX, _maxx: bound.maxX, _maxy: bound.maxY,
      _miny: bound.maxY - (bound.maxX - bound.minX) / this.canvas.width * this.canvas.height,
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
  /** Scaling the display rectangle */
  zoomDisplay(projectX: number, projectY: number, scale: number): void;
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
        let expectedDx = (this.bound.maxY - this.bound.minY) / this.canvas.height * this.canvas.width;
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
        let expectedDx = (this.bound.maxY - this.bound.minY) / this.canvas.height * this.canvas.width;
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
        let expectedDy = (this.bound.maxX - this.bound.minX) / this.canvas.width * this.canvas.height;
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
        let expectedDy = (this.bound.maxX - this.bound.minX) / this.canvas.width * this.canvas.height;
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
  }

  scrollHorizontally(offset: number) {
    if (this.displayRect.minX + offset < this.bound.minX) offset = this.bound.minX - this.displayRect.minX;
    if (this.displayRect.maxX + offset > this.bound.maxX) offset = this.bound.maxX - this.displayRect.maxX;
    this.displayRect.minX += offset;
    this.displayRect.maxX += offset;
    this.uiOverlay.syncView();
  }

  scrollVertically(offset: number) {
    if (this.displayRect.minY + offset < this.bound.minY) offset = this.bound.minY - this.displayRect.minY;
    if (this.displayRect.maxY + offset > this.bound.maxY) offset = this.bound.maxY - this.displayRect.maxY;
    this.displayRect.minY += offset;
    this.displayRect.maxY += offset;
    this.uiOverlay.syncView();
  }

  drawGridLines() {
    let ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if(!this.showGridsFlag) return;

    // Number of max horizontal grid lines
    let nMaxHorizontal = Math.ceil(this.majorGridDensity * this.canvas.height);
    // Number of max vertical grid lines
    let nMaxVertical = Math.ceil(this.majorGridDensity * this.canvas.width);
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

    let [w, h] = [this.canvas.width, this.canvas.height];
    let minProjectDiff = Math.min.apply(this, useableGrid);
    let minViewDiff = Math.min.apply(this, useableGrid)/(this.displayRect.maxX - this.displayRect.minX)*this.canvas.width;
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
    let maxViewDiff = Math.max.apply(this, useableGrid)/(this.displayRect.maxX - this.displayRect.minX)*this.canvas.width;
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

  v2pX(viewX: number): number {
    return viewX/this.canvas.width*(this.displayRect.maxX - this.displayRect.minX) + this.displayRect.minX;
  }
  v2pY(viewY: number): number {
    return this.displayRect.maxY - viewY/this.canvas.height*(this.displayRect.maxY - this.displayRect.minY);
  }
  p2vX(projectX: number): number {
    return (projectX - this.displayRect.minX)/(this.displayRect.maxX - this.displayRect.minX)*this.canvas.width;
  }
  p2vY(projectY: number): number {
    return (this.displayRect.maxY - projectY)/(this.displayRect.maxY - this.displayRect.minY) * this.canvas.height;
  }

  destruct(): void {
    this.container.removeChild(this.uiOverlay.container);
    this.container.removeChild(this.canvas);
  }
};  