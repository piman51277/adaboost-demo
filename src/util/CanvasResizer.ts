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
