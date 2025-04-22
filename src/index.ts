import { datasets, fetchDigits } from "./dataset/fetchDigits";
import { CanvasResizerRelative } from "./util/CanvasResizer";
import "./util/imgReady";
import { ready } from "./util/ready";
import { scrollPosition } from "./util/scrollPosition";

import datasetMain from "./sections/dataset";
import classifierMain from "./sections/classifier";
import boostMain from "./sections/boost";
ready(async () => {

  console.log("Starting to fetch digits dataset...");
  await fetchDigits();
  console.log("Digits dataset fetched successfully.");

  datasetMain();
  classifierMain();
  boostMain();
});
