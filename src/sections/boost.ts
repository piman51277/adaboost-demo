import { AdaBoost } from "../adaboost/adaboost";
import { Classifier } from "../adaboost/classifier";
import { datasets } from "../dataset/fetchDigits";
import { renderDigit } from "../dataset/renderDigit";
import { CanvasResizer, CanvasResizerRelative } from "../util/CanvasResizer";
import { byID } from "../util/shorthands";

let boostInstance = new AdaBoost();

let classifierBackgroundInstance = new Classifier();
let backgroundOffset = 0;

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
let skipping = false;

let sampleViewPage = 0;

let forestViewSample = 0;

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
 * Waits for k milliseconds
 * @param {number} ms - The number of milliseconds to wait
 * @returns {*}  {Promise<void>}
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

    const forestSelectField = byID("forest-select-eval") as HTMLParagraphElement;
    const forestStatsAccuracyField = byID("forest-stats-accuracy") as HTMLSpanElement;

    trainingField.innerHTML = "Training: Not Started";
    testingField.innerHTML = "Testing: Not Started";
    correctField.innerHTML = "Correct: ?";
    incorrectField.innerHTML = "Incorrect: ?";
    accuracyField.innerHTML = "Accuracy: ?";
    importanceField.innerHTML = "Importance: ?";

    forestSelectField.innerHTML = "Evaluation: ?";
    forestStatsAccuracyField.innerHTML = "Accuracy: ?";
}

/**
 * Create a forest entry
 * @param idx - The index of the entry
 */
function createForestEntry(idx: number): HTMLDivElement {
    const entry = document.createElement("div");
    entry.classList.add("forest-entry");

    const canvas = document.createElement("canvas");
    canvas.id = `ada-forest-elem-canvas-${idx}`;
    canvas.width = 100;
    canvas.height = 100;

    entry.appendChild(canvas);

    const classifierEntry = boostInstance.forest[idx];

    const statsDiv = document.createElement("div");
    statsDiv.classList.add("forest-elem-stats", "body-text");

    const idField = document.createElement("p");
    idField.id = `ada-forest-id-${idx}`;
    idField.innerHTML = `#${idx + 1}`;
    statsDiv.appendChild(idField);

    const evalField = document.createElement("p");
    evalField.id = `ada-forest-eval-${idx}`;
    evalField.innerHTML = "Eval: ?";
    statsDiv.appendChild(evalField);

    const weightField = document.createElement("p");
    weightField.id = `ada-forest-weight-${idx}`;
    weightField.innerHTML = `W ${classifierEntry.weight.toFixed(4)}`;
    statsDiv.appendChild(weightField);

    entry.appendChild(statsDiv);
    return entry;
}

/**
 * Update the single forest display
 */
function updateForestSingle(): void {
    const canvas = document.getElementById("forest-select-canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    //make the canvas background black
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //render a sample from the test set
    const entry = datasets.test[forestViewSample];
    renderDigit(entry, ctx, 0, 0, 250);

    //if the forest is empty, return
    if (boostInstance.forest.length == 0) {
        return;
    }

    //classify it
    const weight = boostInstance.getRawResult(entry);
    const finalResult = weight >= 0 ? 0 : 1;

    const str = `Evaluation: ${finalResult} (${weight.toFixed(4)})`;
    const evalField = document.getElementById("forest-select-eval") as HTMLParagraphElement;
    evalField.innerHTML = str;

    //for each classifier in the forest, render it
    for (let idx = 0; idx < boostInstance.forest.length; idx++) {
        const classifierEntry = boostInstance.forest[idx];
        const classifier = classifierEntry.classifier;

        const result = classifier.evaluate(entry);
        const field = byID(`ada-forest-eval-${idx}`) as HTMLParagraphElement;
        field.innerHTML = `Eval: ${result}`;
    }
}

/**
 *
 */
function updateForestStats(): void {
    const accuracyField = document.getElementById("forest-stats-accuracy") as HTMLSpanElement;
    const memberField = document.getElementById("forest-stats-members") as HTMLSpanElement;
    const accuracy = boostInstance.evaluateSet(datasets.test);
    accuracyField.innerHTML = "Accuracy: " + (accuracy * 100).toFixed(2) + "%";

    memberField.innerHTML = "Members: " + boostInstance.forest.length;
}
/**
 * Update the forest display
 */
function updateForestDisplay(): void {
    const forestContainer = document.getElementById("ada-forest-container") as HTMLDivElement;
    forestContainer.innerHTML = "";

    for (let idx = 0; idx < boostInstance.forest.length; idx++) {
        const entry = createForestEntry(idx);
        forestContainer.appendChild(entry);

        //go ahead and create the canvas resizer
        new CanvasResizer(100, 100, `ada-forest-elem-canvas-${idx}`);

        const canvas = document.getElementById(`ada-forest-elem-canvas-${idx}`) as HTMLCanvasElement;

        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

        //render the classifier
        const classifierEntry = boostInstance.forest[idx];

        const partition = classifierEntry.classifier.partition;


        const gridSize = 28;
        const pixelLen = 100 / gridSize;

        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                const xPos = x * pixelLen;
                const yPos = y * pixelLen;
                const i = x + y * gridSize;

                if (partition[i] === 0) {
                    ctx.fillStyle = "rgba(240,5,44,0.5)";
                }
                else {
                    ctx.fillStyle = "rgba(11,136,213,0.5)";
                }

                ctx.fillRect(xPos, yPos, pixelLen, pixelLen);
            }
        }
    }

    updateForestSingle();
    updateForestStats();
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
            const batch = skipping ? 500 : 50;
            finished = boostInstance.testClassifier(batch);
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
        updateForestDisplay();

        //for funsies change the background
        classifierBackgroundInstance = new Classifier();
        renderBackground();
        backgroundOffset = Math.floor(Math.random() * (datasets.test.length - 196));
    }

    updateStepView();
    await wait(50);
}

/**
 * Skip ahead and add directly
 */
async function skipAhead(): Promise<void> {
    if (stateProcessing || skipping) {
        return;
    }
    skipping = true;

    //if we're in train sate, go ahead and train it
    if (currentState == TrainingState.TRAIN_CLASSIFIER) {
        await advanceState();
    }

    while (currentState != TrainingState.TRAIN_CLASSIFIER) {
        await advanceState();
    }

    skipping = false;
}

/**
 *
 */
function renderBackground(): void {
    const canvas = byID("adaboost-background") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const width = canvas.width;
    const height = canvas.height;

    //make the canvas background black
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    const maxDim = Math.max(width, height);

    //we will arrange the numbers in a 14x14 grid
    //side length is a multiple of 56 such that 14*sideLength >= maxDim
    const sideLength = Math.ceil(maxDim / (14 * 56)) * 56;
    const xOffset = (width - sideLength * 14) / 2;
    const yOffset = (height - sideLength * 14) / 2;
    const gap = sideLength * 0.05;

    //get a reference to the dataset
    const test_dataset = datasets.test;

    //start iterating over the grid
    for (let i = 0; i < 14; i++) {
        for (let j = 0; j < 14; j++) {
            const idx = i * 14 + j;

            const entry = test_dataset[idx + backgroundOffset];

            const x = xOffset + j * sideLength;
            const y = yOffset + i * sideLength;

            renderDigit(entry, ctx, x, y, sideLength);

            //render a square from the classifier
            const partition = classifierBackgroundInstance.partition[idx];
            if (partition === 0) {
                ctx.fillStyle = "rgba(240,5,44,0.5)";
            }
            else {
                ctx.fillStyle = "rgba(11,136,213,0.5)";
            }

            ctx.fillRect(x + gap, y + gap, sideLength - 2 * gap, sideLength - 2 * gap);
        }
    }
}




/**
 * Reset the state of the training
 */
function reset(): void {
    boostInstance = new AdaBoost();
    currentState = TrainingState.TRAIN_CLASSIFIER;
    stateProcessing = false;
    sampleViewPage = 0;
    updateSampleView();
    updateStepView();
    updateClassifierDisplay();
    updateForestDisplay();


    resetStats();
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

    new CanvasResizerRelative(1.1, 1.1, "adaboost-background");

    new CanvasResizer(400, 400, "ada-current-classifier");
    new CanvasResizer(250, 250, "forest-select-canvas");

    window.addEventListener("resize", () => {
        updateSampleView();
        updateClassifierDisplay();
        updateForestSingle();
        renderBackground();
    });
    updateSampleView();
    updateStepView();
    updateClassifierDisplay();
    updateForestSingle();
    renderBackground();

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

    const skipButton = document.getElementById("ada-skip-btn") as HTMLButtonElement;
    skipButton.addEventListener("click", () => {
        skipAhead();
    });

    //reset button
    const resetButton = document.getElementById("ada-reset-btn") as HTMLButtonElement;
    resetButton.addEventListener("click", () => {
        reset();
    });

    //next sample button
    const nextSampleButton = document.getElementById("forest-select-next") as HTMLButtonElement;
    nextSampleButton.addEventListener("click", () => {
        forestViewSample++;
        if (forestViewSample >= datasets.test.length) {
            forestViewSample = 0;
        }
        updateForestSingle();
    });

};