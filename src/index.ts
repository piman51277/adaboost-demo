import { fetchDigits } from "./dataset/fetchDigits";
import "./util/imgReady";
import { ready } from "./util/ready";

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
