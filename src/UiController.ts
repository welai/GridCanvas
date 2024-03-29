import GridCanvas from './GridCanvas';
import { DualHRangeBar, DualVRangeBar } from 'dual-range-bar';
import './style.css';

/**
 * UI control elements
 * @class
 */
export default class UIOverlay {
  /** UI Overlay Container */
  container: HTMLElement;
  /** This area lies below the UI components, and works as the event receiver */
  eventActiveArea: HTMLElement;
  /** Horizontal dual range bar */
  horizontalBar: DualHRangeBar;
  /** Vertical dual range bar */
  verticalBar: DualVRangeBar;
  /** Toggling grid button container */
  buttonContainer: HTMLElement;
  /** Button to toggle grid display */
  gridButton: HTMLButtonElement;

  // The grid canvas pointer (real bad practice)
  private gridCanvas: GridCanvas;
  // Flags
  private ctrlDownFlag  = false;
  private altDownFlag   = false;
  private shiftDownFlag = false;
  private mouseOver     = false;

  constructor(gridCanvas: GridCanvas) {
    this.gridCanvas = gridCanvas;

    // Create UI Overlay
    this.container = document.createElement('div');
    this.container.style.position = 'relative';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    gridCanvas.container.appendChild(this.container);

    // Horizontal dual range bar for scrolling
    let hbarContainer = document.createElement('div');
    hbarContainer.className = 'hbar-container';
    hbarContainer.style.height = '20px';
    hbarContainer.style.width = 'calc(100% - 125px)';
    hbarContainer.style.margin = '20px 40px';
    hbarContainer.style.position = 'absolute';
    hbarContainer.style.bottom = '0px';
    hbarContainer.style.zIndex = '1';
    let hbar = document.createElement('div');
    hbar.id = `horizontal-scrolling-bar-${new Date().getTime()}`;
    hbar.style.height = '100%';
    hbar.style.width = '100%';
    hbar.style.position = 'relative';
    hbarContainer.appendChild(hbar);
    this.container.appendChild(hbarContainer);
    this.horizontalBar = new DualHRangeBar(hbar, { 
      minimizes: true, lowerBound: 0, upperBound: 1 });
    // Vertical dual range bar for scrolling
    let vbarContainer = document.createElement('div');
    vbarContainer.className = 'vbar-container';
    vbarContainer.style.height = 'calc(100% - 120px)';
    vbarContainer.style.width = '20px';
    vbarContainer.style.margin = '40px 20px';
    vbarContainer.style.position = 'absolute';
    vbarContainer.style.right = '0px';
    vbarContainer.style.zIndex = '1';
    let vbar = document.createElement('div');
    vbar.id = `vertical-scrolling-bar-${new Date().getTime()}`;
    vbar.style.height = '100%';
    vbar.style.width = '100%';
    vbar.style.position = 'relative';
    vbarContainer.appendChild(vbar);
    this.container.appendChild(vbarContainer);
    this.verticalBar = new DualVRangeBar(vbar, {
      minimizes: true, lowerBound: 0, upperBound: 1 });
    
    // Grid toggling button
    let buttonContainer = this.buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.style.width = '42px';
    buttonContainer.style.height = '42px';
    buttonContainer.style.position = 'absolute';
    buttonContainer.style.right = '0px';
    buttonContainer.style.bottom = '0px';
    buttonContainer.style.margin = '10px';
    buttonContainer.style.zIndex = '1';
    let gridButton = this.gridButton = document.createElement('button');
    gridButton.className = 'grid-button';
    if(gridCanvas.showGrids) {
      gridButton.classList.add('grid-on');
    } else {
      gridButton.classList.add('grid-off');
    }
    gridButton.style.width = '42px';
    gridButton.style.height = '42px';
    gridButton.style.display = 'flex';
    gridButton.style.alignItems = 'center';
    gridButton.style.justifyContent = 'center';
    gridButton.innerHTML = `
  <svg version="1.1" class="icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
  viewBox="0 0 100 100" style="width:42px;height:42px" xml:space="preserve">
    <rect x="10" y="10" width="24" height="24"/>
    <rect x="40" y="10" width="24" height="24"/>
    <rect x="70" y="10" width="24" height="24"/>
    <rect x="10" y="40" width="24" height="24"/>
    <rect x="40" y="40" width="24" height="24"/>
    <rect x="70" y="40" width="24" height="24"/>
    <rect x="10" y="70" width="24" height="24"/>
    <rect x="40" y="70" width="24" height="24"/>
    <rect x="70" y="70" width="24" height="24"/>
  </svg>`
    gridButton.addEventListener('click', (event) => {
      gridCanvas.showGrids = !gridCanvas.showGrids;
      if(gridCanvas.showGrids)
        gridButton.classList.replace('grid-off', 'grid-on');
      else
        gridButton.classList.replace('grid-on', 'grid-off');
    })
    buttonContainer.appendChild(gridButton);
    this.container.appendChild(buttonContainer);

    this.updateDifferences();

    this.horizontalBar.addEventListener('update', this.syncViewByHorizontal);
    this.verticalBar.addEventListener('update', this.syncViewByVertical);

    // Binding preview window area events
    var mac = false;
    if(window.navigator.userAgent.search('Mac') > 0) mac = true;
    // Event active area
    this.eventActiveArea = document.createElement('div');
    this.eventActiveArea.style.position = 'relative';
    this.eventActiveArea.style.width = '100%';
    this.eventActiveArea.style.height = '100%';
    this.eventActiveArea.style.zIndex = '0';
    this.container.appendChild(this.eventActiveArea);
    this.eventActiveArea.addEventListener('mouseover', (event: MouseEvent) => this.mouseOver = true);
    this.eventActiveArea.addEventListener('mouseout', (event: MouseEvent) => this.mouseOver = false);
    window.addEventListener('keydown', (event) => {
      if(this.mouseOver) {
        if(event.key === 'Alt')   this.altDownFlag    = true;
        if(event.key === 'Shift') this.shiftDownFlag  = true;
        if(mac) { if(event.key === 'Meta')      this.ctrlDownFlag = true; }
        else    { if(event.key === 'Control')   this.ctrlDownFlag = true; }
      } else {
        this.altDownFlag = false; this.shiftDownFlag = false; this.ctrlDownFlag = false;
      }
    });
    window.addEventListener('keyup', (event) => {
      if(this.mouseOver) {
        if(event.key === 'Alt')   this.altDownFlag    = false;
        if(event.key === 'Shift') this.shiftDownFlag  = false;
        if(mac) { if(event.key === 'Meta')      this.ctrlDownFlag = false; }
        else    { if(event.key === 'Control')   this.ctrlDownFlag = false; }
      } else {
        this.altDownFlag = false; this.shiftDownFlag = false; this.ctrlDownFlag = false;
      }
    });
    this.eventActiveArea.addEventListener('wheel', (event) => {
      event.preventDefault();

      let r = gridCanvas.zoomFactor;
      if(this.altDownFlag) {
        // TODO: Mouse location to global location
        let d = event.deltaY;
        let [x, y] = [event.offsetX * this.gridCanvas.resolution, event.offsetY * this.gridCanvas.resolution];
        gridCanvas.zoomDisplay(gridCanvas.v2pX(x), gridCanvas.v2pY(y), Math.exp(d/400));
      } else {
        if(this.shiftDownFlag) {
          let d = event.deltaY/r;
          if(d === 0) d = event.deltaX/r;
          gridCanvas.scrollHorizontally(d);
        } else {
          let d = -event.deltaY/r;
          gridCanvas.scrollVertically(d);
        }
      }
    });
  }

  /** Update min and max differences of dual range bars */
  updateDifferences() {
    const gridCanvas = this.gridCanvas;
    // Min differences of the range bars
    let rx = gridCanvas.gridLayer.width / (gridCanvas.bound.maxX - gridCanvas.bound.minX);
    let ry = gridCanvas.gridLayer.height / (gridCanvas.bound.maxY - gridCanvas.bound.minY);
    if (rx > ry) {
      this.horizontalBar.minSpan = 0.1 * rx / ry;
      this.horizontalBar.maxSpan = 1.0;
      this.verticalBar.minSpan = 0.1;
      this.verticalBar.maxSpan = 1.0 * ry / rx;
    } else {
      this.horizontalBar.minSpan = 0.1;
      this.horizontalBar.maxSpan = 1.0 * rx / ry;
      this.verticalBar.minSpan = 0.1 * ry / rx;
      this.verticalBar.maxSpan = 1.0;
    }
  }

  /** Synchronize UI components with the geometric properties */
  syncView() {
    const gridCanvas = this.gridCanvas;
    let boundWidth  = gridCanvas.bound.maxX - gridCanvas.bound.minX;
    let boundHeight = gridCanvas.bound.maxY - gridCanvas.bound.minY;
    let minX = (gridCanvas.displayRect.minX - gridCanvas.bound.minX)/boundWidth;
    let maxX = (gridCanvas.displayRect.maxX - gridCanvas.bound.minX)/boundWidth;
    let minY = (gridCanvas.bound.maxY - gridCanvas.displayRect.maxY)/boundHeight;
    let maxY = (gridCanvas.bound.maxY - gridCanvas.displayRect.minY)/boundHeight;
    this.horizontalBar.lower = minX < 0 ? 0 : minX;
    this.horizontalBar.upper = maxX > 1 ? 1 : maxX;
    this.verticalBar.lower = minY < 0 ? 0 : minY;
    this.verticalBar.upper = maxY > 1 ? 1 : maxY;
  }

  /** Synchronize the display rect with the UI elements & v.v. */
  // But these function do not actually refresh the view
  syncViewByHorizontal = () => {
    const gridCanvas = this.gridCanvas;
    let lower = this.horizontalBar.lower;
    let upper = this.horizontalBar.upper;
    let minX = lower * (gridCanvas.bound.maxX - gridCanvas.bound.minX) + gridCanvas.bound.minX;
    let maxX = upper * (gridCanvas.bound.maxX - gridCanvas.bound.minX) + gridCanvas.bound.minX;
    gridCanvas.displayRect.setMinX(minX);
    gridCanvas.displayRect.setMaxX(maxX);
    // Calculate the veritcal bar
    if (gridCanvas.aspectLocked) {
      let displayAspect = gridCanvas.gridLayer.width / gridCanvas.gridLayer.height;
      let verticalDiff = (maxX - minX) / displayAspect;
      let verticalMid = (gridCanvas.displayRect.minY + gridCanvas.displayRect.maxY) / 2;
      if (verticalMid - verticalDiff / 2 < gridCanvas.bound.minY) {
        gridCanvas.displayRect.setMinY(gridCanvas.bound.minY);
        gridCanvas.displayRect.setMaxY(gridCanvas.bound.minY + verticalDiff);
        gridCanvas.display();
      } else if (verticalMid + verticalDiff / 2 > gridCanvas.bound.maxY) {
        gridCanvas.displayRect.setMinY(gridCanvas.bound.maxY - verticalDiff);
        gridCanvas.displayRect.setMaxY(gridCanvas.bound.maxY);
        gridCanvas.display();
      } else {
        gridCanvas.displayRect.setMinY(verticalMid - verticalDiff / 2);
        gridCanvas.displayRect.setMaxY(verticalMid + verticalDiff / 2);
        gridCanvas.display();
      }
    }
    this.syncView();
  }
  /** Synchronize the display rect with the UI elements & v.v. */
  syncViewByVertical = () => {
    const gridCanvas = this.gridCanvas;
    let lower = 1 - this.verticalBar.upper;
    let upper = 1 - this.verticalBar.lower;
    let minY = lower * (gridCanvas.bound.maxY - gridCanvas.bound.minY) + gridCanvas.bound.minY;
    let maxY = upper * (gridCanvas.bound.maxY - gridCanvas.bound.minY) + gridCanvas.bound.minY;
    gridCanvas.displayRect.setMinY(minY);
    gridCanvas.displayRect.setMaxY(maxY);
    // Calculate the vertical bar
    if (gridCanvas.aspectLocked) {
      let displayAspect = gridCanvas.gridLayer.width / gridCanvas.gridLayer.height;
      let horizontalDiff = (maxY - minY) * displayAspect;
      let horizontalMid = (gridCanvas.displayRect.minX + gridCanvas.displayRect.maxX) / 2;
      if (horizontalMid - horizontalDiff / 2 < gridCanvas.bound.minX) {
        gridCanvas.displayRect.setMinX(gridCanvas.bound.minX);
        gridCanvas.displayRect.setMaxX(gridCanvas.bound.minX + horizontalDiff);
        gridCanvas.display();
      } else if (horizontalMid + horizontalDiff / 2 > gridCanvas.bound.maxX) {
        gridCanvas.displayRect.setMinX(gridCanvas.bound.maxX - horizontalDiff);
        gridCanvas.displayRect.setMaxX(gridCanvas.bound.maxX);
        gridCanvas.display();
      } else {
        gridCanvas.displayRect.setMinX(horizontalMid - horizontalDiff / 2);
        gridCanvas.displayRect.setMaxX(horizontalMid + horizontalDiff / 2);
        gridCanvas.display();
      }
    }
    this.syncView();
  }
}
