import { CanvasResizerRelative } from "./util/CanvasResizer";
import "./util/imgReady";
import { ready } from "./util/ready";
import { scrollPosition } from "./util/scrollPosition";



/**
 *
 */
function renderBackground() {
  const scrollRel = document.getElementById("bind-scroll") as HTMLElement;
  const scroll = scrollPosition(scrollRel, true);

  //get the canvas
  const canvas = document.getElementById("bind-cv") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

  let red_ch = 0;
  if (scroll != null && scroll > 0) {
    red_ch = Math.floor(255 * scroll);
  }

  ctx.fillStyle = `rgb(${red_ch}, 0, 0)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}


ready(() => {
  new CanvasResizerRelative(1.1, 1.1, "bind-cv");

  window.addEventListener("scroll", () => {
    renderBackground();
  });

  window.addEventListener("resize", () => {
    renderBackground();
  });

  renderBackground();


});
