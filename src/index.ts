import { datasets, fetchDigits } from "./dataset/fetchDigits";
import { CanvasResizerRelative } from "./util/CanvasResizer";
import "./util/imgReady";
import { ready } from "./util/ready";
import { scrollPosition } from "./util/scrollPosition";

import datasetMain from "./sections/dataset";
import classifierMain from "./sections/classifier";
import { AdaBoost } from "./adaboost/adaboost";
import { Classifier } from './adaboost/classifier';

ready(async () => {

  console.log("Starting to fetch digits dataset...");
  await fetchDigits();
  console.log("Digits dataset fetched successfully.");

  datasetMain();
  classifierMain();

  // try out the adaboost classifier

  const adaboost = new AdaBoost();

  for (let i = 0; i < 50; i++) {
    console.log(`Starting iteration ${i}`);

    const classifier = adaboost.trainClassifier();
    console.log("Trained classifier");

    const individualAccuracy = classifier.evaluateAll(datasets.train);
    console.log("Individual accuracy: ", individualAccuracy);

    let finished = false;
    while (!finished) {
      finished = adaboost.testClassifier();
    }
    console.log("Tested classifier");

    adaboost.updateClassifier();
    console.log("Updated classifier");

    console.log("Classifier weight: ", adaboost.currentClassifierWeight);

    adaboost.updateWeights();
    console.log("Updated weights");

    adaboost.nextIteration();
    console.log("Added to forest");
  }

  console.log("Finished training");

  const finalAccuracy = adaboost.evaluateSet(datasets.test);
  console.log("Final accuracy: ", finalAccuracy);
});
