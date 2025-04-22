import { datasets } from "../dataset/fetchDigits";
import { renderDigit } from "../dataset/renderDigit";
import { CanvasResizer, CanvasResizerRelative } from "../util/CanvasResizer";
import { scrollPosition } from "../util/scrollPosition";
import { byID } from "../util/shorthands";


const digitAnimationOrder: number[] = [];
for (let i = 0; i < 14 * 14; i++) {
    digitAnimationOrder.push(Math.random());
}



/**
 * Transition handler from background 1 to background 2
 * @param {number} progress - (0-1) Progress of the transition
 */
function backgroundTransition1To2(progress: number): void {
    const canvas = byID("dataset-background") as HTMLCanvasElement;
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

    //get a reference to the dataset
    const full_dataset = datasets.full;

    //start iterating over the grid
    for (let i = 0; i < 14; i++) {
        for (let j = 0; j < 14; j++) {
            const idx = i * 14 + j;

            //see if this particular digit should be animated
            const animOrder = (digitAnimationOrder[idx] * 0.8) + 0.1;

            if (animOrder > progress) {
                continue;
            }

            const x = xOffset + j * sideLength;
            const y = yOffset + i * sideLength;
            const entry = full_dataset[idx];

            renderDigit(entry, ctx, x, y, sideLength);
        }
    }
}


/**
 * Transition handler from background 2 to background 3
 * @param {number} progress - (0-1) Progress of the transition
 */
function backgroundTransition2To3(progress: number): void {
    const canvas = byID("dataset-background") as HTMLCanvasElement;
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

    //get a reference to the dataset
    const full_dataset = datasets.full;
    const test_dataset = datasets.test;

    //start iterating over the grid
    for (let i = 0; i < 14; i++) {
        for (let j = 0; j < 14; j++) {
            const idx = i * 14 + j;

            //see if this particular digit should be set with old or new digit
            const animOrder = (digitAnimationOrder[idx] * 0.8) + 0.1;

            const entry = animOrder > progress ? full_dataset[idx] : test_dataset[idx + 200];

            const x = xOffset + j * sideLength;
            const y = yOffset + i * sideLength;

            renderDigit(entry, ctx, x, y, sideLength);
        }
    }
}


const stages = [
    backgroundTransition1To2,
    backgroundTransition2To3,
];


/**
 * Renders the background of the dataset section
 */
function renderBackground(): void {
    const section = byID("section-dataset");
    const globalProgress = scrollPosition(section, true);

    //if the section is not in view, don't waste CPU time.
    if (globalProgress === null) {
        return;
    }

    //there are three sections
    const stageSize = 0.4; //slightly larger than 1/3 to account for the transition
    let currentStage = Math.floor(globalProgress / 0.4);
    let stageProgress = (globalProgress - currentStage * stageSize) / stageSize;

    //special case: before start
    if (globalProgress < 0) {
        currentStage = 0;
        stageProgress = 0;
    }

    //special case: after end of existing sections
    if (currentStage >= stages.length) {
        currentStage = stages.length - 1;
        stageProgress = 1;
    }

    if (currentStage >= 0 && currentStage < stages.length) {
        stages[currentStage](stageProgress);
    }
}


/**
 * Renders a single digit with grid
 */
function renderExampleGrid(): void {
    const canvas = byID("number-grid") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const width = canvas.width;
    const height = canvas.height;

    //make the canvas background black
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    //render some random digit from the dataset
    renderDigit(datasets.full[199], ctx, 0, 0, 300);

    //28x28 grid (red lines)
    const gridSize = 28;
    const pixelLen = 300 / gridSize;
    ctx.strokeStyle = "red";
    ctx.lineWidth = 1;
    for (let i = 0; i < gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * pixelLen, 0);
        ctx.lineTo(i * pixelLen, 300);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * pixelLen);
        ctx.lineTo(300, i * pixelLen);
        ctx.stroke();
    }

}


/**
 * Main function for this section
 */
export default (): void => {
    new CanvasResizerRelative(1.1, 1.1, "dataset-background");
    new CanvasResizer(300, 300, "number-grid");

    window.addEventListener("scroll", () => {
        renderBackground();
    });
    window.addEventListener("resize", () => {
        renderBackground();
        renderExampleGrid();
    });
    renderBackground();
    renderExampleGrid();
};