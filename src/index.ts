import { fetchDigits } from "./dataset/fetchDigits";
import "./util/imgReady";
import { ready } from "./util/ready";
import datasetMain from "./sections/dataset";
import classifierMain from "./sections/classifier";
import boostMain from "./sections/boost";
import { byID } from "./util/shorthands";


/**
 * Locks the application
 */
function lockApplication(): void {
  const content = byID("main-content");
  content.style.display = "none";
}

/**
 * Unlocks the application
 */
function unlockApplication(): void {
  const content = byID("main-content");
  content.style.display = "block";

  const barrier = byID("loading-screen");
  barrier.style.opacity = "0";

  //navigate to the top of the page
  const link = document.createElement("a");
  link.href = "#section-titlecard";
  link.click();

  //set scroll position to top
  window.scrollTo(0, 0);

  setTimeout(() => {
    barrier.style.zIndex = "-999";
  }, 500);
}


ready(async () => {

  lockApplication();
  console.log("Starting to fetch digits dataset...");
  await fetchDigits();
  console.log("Digits dataset fetched successfully.");
  unlockApplication();

  datasetMain();
  classifierMain();
  boostMain();
});
