import { DigitEntry } from "./fetchDigits";

/**
 * Render a digit on the canvas
 * @param {DigitEntry} number - The digit to render
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {number} x - top left x coordinate
 * @param {number} y - top left y coordinate
 * @param {number} size - The size of the digit (square)
 */
export function renderDigit(number: DigitEntry, ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    const { data } = number;
    const sideLen = 28;

    ctx.fillStyle = "black";
    ctx.fillRect(x, y, size, size);

    const pixelLen = size / sideLen;
    for (let i = 0; i < sideLen; i++) {
        for (let j = 0; j < sideLen; j++) {
            const pixel = data[i * sideLen + j];

            ctx.fillStyle = `rgb(${pixel}, ${pixel}, ${pixel})`;

            //we add tiny overlaps to trick the aliasing algo to not create
            //small gaps between the pixels
            ctx.fillRect(x + j * pixelLen - 0.5,
                y + i * pixelLen - 0.5,
                pixelLen + 1,
                pixelLen + 1);

        }
    }
}