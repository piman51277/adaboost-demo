export class CanvasResizer {
  targetWidth: number;
  targetHeight: number;
  aspectRatio: number;
  canvas: HTMLCanvasElement;

  constructor(targetWidth: number, targetHeight: number, id: string) {
    this.targetWidth = targetWidth;
    this.targetHeight = targetHeight;
    this.aspectRatio = targetWidth / targetHeight;
    this.canvas = document.getElementById(id) as HTMLCanvasElement;

    this.canvas.width = targetWidth;
    this.canvas.height = targetHeight;

    this.resize();

    window.addEventListener("resize", this.resize.bind(this));
  }

  /**
   * Resize and scale the canvas to preserve the aspect ratio
   */
  private resize(): void {
    const { targetWidth, canvas } = this;

    //get the width of the parent element
    const width = Math.min(canvas.parentElement!.clientWidth, targetWidth);

    //compute the new height
    const height = width / this.aspectRatio;
    this.canvas.style.height = `${height}px`;
  }
}

export class CanvasResizerRelative {
  relX: number;
  relY: number;
  canvas: HTMLCanvasElement;

  constructor(relX: number, relY: number, id: string) {
    this.relX = relX;
    this.relY = relY;
    this.canvas = document.getElementById(id) as HTMLCanvasElement;

    this.resize();
    window.addEventListener("resize", this.resize.bind(this));
  }

  /**
   * Resize and scale the canvas relative to viewport
   */
  private resize(): void {
    const { relX, relY, canvas } = this;

    //get viewport width and height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    //compute the new width and height
    const width = Math.floor(viewportWidth * relX);
    const height = Math.floor(viewportHeight * relY);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = width;
    canvas.height = height;
  }
}
