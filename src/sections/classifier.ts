import { Classifier } from "../adaboost/classifier";
import { datasets } from "../dataset/fetchDigits";
import { renderDigit } from "../dataset/renderDigit";
import { CanvasResizer, CanvasResizerRelative } from "../util/CanvasResizer";
import { scrollPosition } from "../util/scrollPosition";
import { byID } from "../util/shorthands";

let classifier = new Classifier();

/**
 * Generates the classifier groups
 */
function generateClassifierGroups(): void {
    classifier = new Classifier();
}


/**
 * Renders a partitioning of the image
 */
function renderFresh(): void {
    const canvas = byID("fresh-image") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const width = canvas.width;
    const height = canvas.height;

    //make the canvas background black
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    //render some random digit from the dataset
    renderDigit(datasets.test[3], ctx, 0, 0, 300);

}

/**
 * Renders a partitioning of the image
 */
function renderPartitioning(): void {
    const canvas = byID("partitioned-image") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const width = canvas.width;
    const height = canvas.height;

    //make the canvas background black
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    //render some random digit from the dataset
    renderDigit(datasets.test[3], ctx, 0, 0, 300);

    //render the partitioning
    const gridSize = 28;
    const pixelLen = 300 / gridSize;

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const xPos = x * pixelLen;
            const yPos = y * pixelLen;
            const i = x + y * gridSize;

            if (classifier.partition[i] === 0) {
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
 * Renders a partitioning of the image
 */
function renderPartitioningWithScore(): void {
    const canvas = byID("partitioned-image2") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const width = canvas.width;
    const height = canvas.height;

    //make the canvas background black
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    //render some random digit from the dataset
    renderDigit(datasets.test[3], ctx, 0, 0, 300);

    //render the partitioning
    const gridSize = 28;
    const pixelLen = 300 / gridSize;

    let positiveSum = 0;
    let negativeSum = 0;

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const xPos = x * pixelLen;
            const yPos = y * pixelLen;
            const i = x + y * gridSize;

            if (classifier.partition[i] === 0) {
                ctx.fillStyle = "rgba(240,5,44,0.5)";
                positiveSum += datasets.test[3].data[i];
            }
            else {
                ctx.fillStyle = "rgba(11,136,213,0.5)";
                negativeSum += datasets.test[3].data[i];
            }

            ctx.fillRect(xPos + 1, yPos + 1, pixelLen - 2, pixelLen - 2);
        }
    }

    //round to integer
    positiveSum = Math.round(positiveSum);
    negativeSum = Math.round(negativeSum);

    let symbol = positiveSum > negativeSum ? ">" : "<";
    if (positiveSum === negativeSum) symbol = "=";

    const str = `<span class="set-0">${positiveSum}</span> ${symbol} <span class="set-1">${negativeSum}</span>`;


    let evalStr = "Evaluation: ";
    if (positiveSum >= negativeSum) {
        evalStr += "<span class='set-0'>0</span>";
    }
    else {
        evalStr += "<span class='set-1'>1</span>";
    }
    const compText = byID("partition-score") as HTMLParagraphElement;
    compText.innerHTML = str;
    const evalText = byID("partition-eval") as HTMLParagraphElement;
    evalText.innerHTML = evalStr;

}


let automatedClassifier = new Classifier();
let progress = 0;
let accuracySum = 0;

/**
 *
 */
function renderAutomated(): void {
    const canvas = byID("partitioned-image-auto") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const width = canvas.width;
    const height = canvas.height;

    //make the canvas background black
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    //render a digit from the test set
    let entry = datasets.test[progress];
    renderDigit(entry, ctx, 0, 0, 300);

    //render the partitioning
    const gridSize = 28;
    const pixelLen = 300 / gridSize;
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const xPos = x * pixelLen;
            const yPos = y * pixelLen;
            const i = x + y * gridSize;

            if (automatedClassifier.partition[i] === 0) {
                ctx.fillStyle = "rgba(240,5,44,0.5)";
            }
            else {
                ctx.fillStyle = "rgba(11,136,213,0.5)";
            }

            ctx.fillRect(xPos + 1, yPos + 1, pixelLen - 2, pixelLen - 2);
        }
    }


    for (let i = 0; i < 50; i++) {
        entry = datasets.test[progress];
        const evaluation = automatedClassifier.evaluate(entry);
        if (evaluation === entry.label) {
            accuracySum += 1;
        }
        progress++;
    }

    const accuracy = Math.round((accuracySum / (progress)) * 100);
    const compText = byID("partition-score-auto") as HTMLParagraphElement;
    compText.innerHTML = `Accuracy: ${accuracy}%`;
    const progressText = byID("partition-progress-auto") as HTMLParagraphElement;
    progressText.innerHTML = `Progress: ${progress} / ${200}`;


    if (progress >= 200) {
        progress = 0;
        accuracySum = 0;
        automatedClassifier = new Classifier();
    }
}

/**
 * Renders the background
 */
function renderBackground(): void {

    const canvas = byID("classifier-background") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const width = canvas.width;
    const height = canvas.height;

    //make the canvas background black
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    const maxDim = Math.max(width, height);

    //we will arrange the numbers in a 28x28 grid
    //side length is a multiple of 56 such that 28*sideLength >= maxDim
    const sideLength = Math.ceil(maxDim / (28 * 28)) * 28;
    const xOffset = (width - sideLength * 28) / 2;
    const yOffset = (height - sideLength * 28) / 2;
    const gap = sideLength * 0.05;

    //start iterating over the grid
    for (let i = 0; i < 28; i++) {
        for (let j = 0; j < 28; j++) {
            //render partition of the classifier
            const x = xOffset + j * sideLength;
            const y = yOffset + i * sideLength;
            const entry = classifier.partition[i * 28 + j];
            if (entry === 0) {
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
 * Main function for this section
 */
export default (): void => {
    new CanvasResizerRelative(1.1, 1.1, "classifier-background");
    new CanvasResizer(300, 300, "partitioned-image");
    new CanvasResizer(300, 300, "fresh-image");
    new CanvasResizer(300, 300, "partitioned-image2");
    new CanvasResizer(300, 300, "partitioned-image-auto");

    window.addEventListener("resize", () => {
        renderPartitioningWithScore();
        renderPartitioning();
        renderFresh();
        renderBackground();
    });
    renderPartitioningWithScore();
    renderPartitioning();
    renderFresh();
    renderBackground();


    renderAutomated();
    setInterval(() => {
        //save CPU cycles by only running when in view

        //check if the canvas is in view
        const canvas = byID("partitioned-image-auto") as HTMLCanvasElement;
        const viewAmount = scrollPosition(canvas, true);

        if (viewAmount != null) {
            renderAutomated();
        }

        //check if the section itself is in view
        const section = byID("section-classifier") as HTMLDivElement;
        const sectionViewAmount = scrollPosition(section, true);
        if (sectionViewAmount != null) {
            generateClassifierGroups();
            renderPartitioningWithScore();
            renderPartitioning();
            renderBackground();
        }
    }, 1000);
};

