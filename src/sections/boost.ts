import { AdaBoost } from "../adaboost/adaboost";
import { datasets } from "../dataset/fetchDigits";
import { renderDigit } from "../dataset/renderDigit";
import { CanvasResizer } from "../util/CanvasResizer";
import { byID } from "../util/shorthands";
import classifier from "./classifier";

let boostInstance = new AdaBoost();

enum TrainingState {
    TRAIN_CLASSIFIER,
    TEST_CLASSIFIER,
    GET_IMPORTANCE,
    UPDATE_DISTRIBUTION,
    ADD_FOREST,
}

//this is the NEXT action that needs to happen
let currentState: TrainingState = TrainingState.TRAIN_CLASSIFIER;

//if the current state is still doing work
let stateProcessing = false;

let sampleViewPage = 0;

/**
 * Update the sample view
 */
function updateSampleView(): void {
    const idxStart = sampleViewPage * 6;

    for (let i = 0; i < 6; i++) {
        const canvas = document.getElementById(`ada-sample-${i}-canvas`) as HTMLCanvasElement;
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

        const digit = datasets.train[idxStart + i];
        renderDigit(digit, ctx, 0, 0, 100);

        const idField = document.getElementById(`ada-sample-${i}-id`) as HTMLParagraphElement;
        idField.innerText = `#${idxStart + i}`;

        const correctField = document.getElementById(`ada-sample-${i}-correct`) as HTMLParagraphElement;

        if (currentState == TrainingState.TRAIN_CLASSIFIER) {
            correctField.innerHTML = "????";
        }
        else if (currentState == TrainingState.TEST_CLASSIFIER) {
            if (boostInstance.trainingProgress >= idxStart + 1) {
                const isCorrect = boostInstance.currentClassifierMatches[idxStart + i];
                correctField.innerHTML = isCorrect ?
                    `<span class="sample-cor">Correct</span>` :
                    `<span class="sample-icor">Incorrect</span>`;
            } else {
                correctField.innerHTML = "????";
            }
        } else {
            const isCorrect = boostInstance.currentClassifierMatches[idxStart + i];
            correctField.innerHTML = isCorrect ?
                `<span class="sample-cor">Correct</span>` :
                `<span class="sample-icor">Incorrect</span>`;
        }

        const weightField = document.getElementById(`ada-sample-${i}-weight`) as HTMLParagraphElement;
        const weight = boostInstance.weights[idxStart + i];
        weightField.innerHTML = `W ${weight.toFixed(5)}`;
    }

    //update the page number
    const pageField = document.getElementById("ada-sample-page") as HTMLParagraphElement;
    pageField.innerHTML = `Page ${sampleViewPage + 1} of ${Math.floor(datasets.train.length / 6)}`;
}

/**
 * Update the step view
 */
function updateStepView(): void {

    const states = [
        TrainingState.TRAIN_CLASSIFIER,
        TrainingState.TEST_CLASSIFIER,
        TrainingState.GET_IMPORTANCE,
        TrainingState.UPDATE_DISTRIBUTION,
        TrainingState.ADD_FOREST,
    ];

    for (let i = 0; i < 5; i++) {
        const span = document.getElementById(`ada-step-${i}`) as HTMLSpanElement;
        const selected = states[i] === currentState;
        if (selected) {
            span.classList.add("current-step");
        }
        else if (span.classList.contains("current-step")) {
            span.classList.remove("current-step");
        }
    }
}

/**
 * Update the classifier display
 */
function updateClassifierDisplay(): void {
    const canvas = byID("ada-current-classifier") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const width = canvas.width;
    const height = canvas.height;

    //make the canvas background black
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    if (boostInstance.currentClassifier == null) {
        return;
    }

    //render the partitioning
    const gridSize = 28;
    const pixelLen = 400 / gridSize;

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const xPos = x * pixelLen;
            const yPos = y * pixelLen;
            const i = x + y * gridSize;

            if (boostInstance.currentClassifier.partition[i] === 0) {
                ctx.fillStyle = "rgba(240,5,44,0.5)";
            }
            else {
                ctx.fillStyle = "rgba(11,136,213,0.5)";
            }

            ctx.fillRect(xPos + 1, yPos + 1, pixelLen - 2, pixelLen - 2);
        }
    }
}

/**
 * Wait for a given amount of time
 * @param ms - The amount of time to wait in milliseconds
 * @returns A promise that resolves after the given amount of time
 */
async function wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

/**
 * Reset the stats display
 */
function resetStats(): void {
    const trainingField = byID("ada-stats-training") as HTMLSpanElement;
    const testingField = byID("ada-stats-testing") as HTMLSpanElement;
    const correctField = byID("ada-stats-correct") as HTMLSpanElement;
    const incorrectField = byID("ada-stats-incorrect") as HTMLSpanElement;
    const accuracyField = byID("ada-stats-accuracy") as HTMLSpanElement;
    const importanceField = byID("ada-stats-importance") as HTMLSpanElement;
    trainingField.innerHTML = "Training: Not Started";
    testingField.innerHTML = "Testing: Not Started";
    correctField.innerHTML = "Correct: ?";
    incorrectField.innerHTML = "Incorrect: ?";
    accuracyField.innerHTML = "Accuracy: ?";
    importanceField.innerHTML = "Importance: ?";
}


/**
 * Advance the state of the training
 */
async function advanceState(): Promise<void> {
    if (stateProcessing) {
        return;
    }
    stateProcessing = true;

    const classifierNum = byID("ada-stats-classifier-num") as HTMLSpanElement;
    const trainingField = byID("ada-stats-training") as HTMLSpanElement;
    const testingField = byID("ada-stats-testing") as HTMLSpanElement;
    const correctField = byID("ada-stats-correct") as HTMLSpanElement;
    const incorrectField = byID("ada-stats-incorrect") as HTMLSpanElement;
    const accuracyField = byID("ada-stats-accuracy") as HTMLSpanElement;
    const importanceField = byID("ada-stats-importance") as HTMLSpanElement;

    if (currentState == TrainingState.TRAIN_CLASSIFIER) {
        boostInstance.trainClassifier();
        updateClassifierDisplay();
        trainingField.innerHTML = "Training: Complete";
        stateProcessing = false;
        currentState = TrainingState.TEST_CLASSIFIER;
    }

    else if (currentState == TrainingState.TEST_CLASSIFIER) {
        let finished = false;
        while (!finished) {
            finished = boostInstance.testClassifier();
            updateSampleView();
            testingField.innerHTML = "Testing: " + boostInstance.trainingProgress + "/" + boostInstance.trainingProgressMax;
            correctField.innerHTML = "Correct: " + boostInstance.currentClassifierStats.correct;
            incorrectField.innerHTML = "Incorrect: " + boostInstance.currentClassifierStats.incorrect;
            const accuracy = boostInstance.currentClassifierStats.correct / (boostInstance.trainingProgress);
            accuracyField.innerHTML = "Accuracy: " + (accuracy * 100).toFixed(2) + "%";
            await wait(0);
        }
        testingField.innerHTML = "Testing: Complete";
        stateProcessing = false;
        currentState = TrainingState.GET_IMPORTANCE;
    }

    else if (currentState == TrainingState.GET_IMPORTANCE) {
        const importance = boostInstance.updateClassifier();
        importanceField.innerHTML = "Importance: " + importance.toFixed(4);
        stateProcessing = false;
        currentState = TrainingState.UPDATE_DISTRIBUTION;
    }

    else if (currentState == TrainingState.UPDATE_DISTRIBUTION) {
        boostInstance.updateWeights();
        updateSampleView();
        stateProcessing = false;
        currentState = TrainingState.ADD_FOREST;
    }

    else if (currentState == TrainingState.ADD_FOREST) {
        classifierNum.innerHTML = "Classifier: " + (boostInstance.forest.length + 1);
        boostInstance.nextIteration();
        resetStats();
        updateClassifierDisplay();
        stateProcessing = false;
        currentState = TrainingState.TRAIN_CLASSIFIER;
        updateSampleView();
    }

    updateStepView();
}


/**
 * Reset the state of the training
 */
function reset(): void {
    boostInstance = new AdaBoost();
    currentState = TrainingState.TRAIN_CLASSIFIER;
    stateProcessing = false;
    sampleViewPage = 0;
    resetStats();
    updateSampleView();
    updateStepView();
    updateClassifierDisplay();
}

/**
 * Main function for this section
 */
export default (): void => {
    //re-initialize the AdaBoost instance
    boostInstance = new AdaBoost();

    for (let i = 0; i < 6; i++) {
        new CanvasResizer(100, 100, `ada-sample-${i}-canvas`);
    }

    new CanvasResizer(400, 400, "ada-current-classifier");

    window.addEventListener("resize", () => {
        updateSampleView();
        updateClassifierDisplay();
    });
    updateSampleView();
    updateStepView();
    updateClassifierDisplay();

    const MAX_PAGE = Math.floor(datasets.train.length / 6) - 1;
    //buttons to increment/decrement the sample view page
    const prevButton = document.getElementById("ada-sample-pagedwn-btn") as HTMLButtonElement;
    const nextButton = document.getElementById("ada-sample-pageup-btn") as HTMLButtonElement;

    prevButton.addEventListener("click", () => {
        sampleViewPage--;
        if (sampleViewPage < 0) {
            sampleViewPage = MAX_PAGE;
        }
        updateSampleView();
    });
    nextButton.addEventListener("click", () => {
        sampleViewPage++;
        if (sampleViewPage > MAX_PAGE) {
            sampleViewPage = 0;
        }
        updateSampleView();
    });

    //state advance button
    const advanceButton = document.getElementById("ada-continue-btn") as HTMLButtonElement;
    advanceButton.addEventListener("click", () => {
        advanceState();
    });

    //reset button
    const resetButton = document.getElementById("ada-reset-btn") as HTMLButtonElement;
    resetButton.addEventListener("click", () => {
        reset();
    });

};