import { DigitEntry } from '../dataset/fetchDigits';
export class Classifier {
    partition: number[];
    accuracy: number | null;

    constructor() {
        //generate a new partition
        this.partition = [];
        for (let i = 0; i < 28 * 28; i++) {
            this.partition.push(Math.random() > 0.5 ? 0 : 1);
        }
        this.accuracy = null;
    }

    /**
     * Runs the classifier against a single input
     * @param {DigitEntry} entry - The digit entry to classify
     * @returns {*}  {number} The classification result (0 or 1)
     */
    public evaluate(entry: DigitEntry): number {
        let sum = 0;

        for (let i = 0; i < 28 * 28; i++) {
            if (this.partition[i] === 0) {
                sum += entry.data[i];
            } else {
                sum -= entry.data[i];
            }
        }

        if (sum >= 0) {
            return 0;
        } else {
            return 1;
        }
    }

    /**
     * Calculates the accuracy of the classifier
     * @param {DigitEntry[]} entries - The test set to evaluate
     * @returns {*}  {number} The accuracy of the classifier
     */
    public evaluateAll(entries: DigitEntry[]): number {
        let correct = 0;
        for (const entry of entries) {
            if (this.evaluate(entry) === entry.label) {
                correct++;
            }
        }
        this.accuracy = correct / entries.length;
        return this.accuracy;
    }


}