import { datasets, DigitEntry } from "../dataset/fetchDigits";
import { Classifier } from './classifier';

type ClassifierEntry = {
    classifier: Classifier;
    weight: number;
}

export class AdaBoost {
    forest: ClassifierEntry[];
    weights: number[];

    trainingProgress: number;
    trainingProgressMax: number;
    currentClassifier: Classifier | null;
    currentClassifierWeight: number | null;
    currentClassifierMatches: boolean[];
    currentClassifierStats: {
        correct: number;
        incorrect: number;
    };

    constructor() {
        this.forest = [];
        this.weights = Array.from({
            length: datasets.train.length,
        },
            () => 1 / datasets.train.length
        );
        this.trainingProgress = 0;
        this.trainingProgressMax = datasets.train.length;
        this.currentClassifier = null;
        this.currentClassifierWeight = null;
        this.currentClassifierMatches = Array.from(
            { length: datasets.train.length },
            () => false
        );
        this.currentClassifierStats = {
            correct: 0,
            incorrect: 0
        };
    }

    /**
     * Trains a weak classifier
     * @returns {*}  {Classifier} A trained classifier
     */
    public trainClassifier(): Classifier {
        let bestClassifier: Classifier = new Classifier();

        //we select on least random classifier
        let bestSignificance: number = 0;

        for (let i = 0; i < 10; i++) {
            const classifier = new Classifier();
            const accuracy = classifier.evaluateAll(datasets.train);

            const significance = Math.abs(accuracy - 0.5);

            if (significance > bestSignificance) {
                bestClassifier = classifier;
                bestSignificance = accuracy;
            }
        }

        this.currentClassifier = bestClassifier;
        return bestClassifier;
    }

    /**
     * Test the current classifier (incremental)
     * @returns {*}  {boolean} Whether the classifier has been fully tested
     */
    public testClassifier(): boolean {
        if (this.currentClassifier === null) {
            throw new Error("No classifier to test");
        }

        const batchSize = 50;
        const start = this.trainingProgress;

        if (this.trainingProgress >= this.trainingProgressMax) {
            //do nothing
            return true;
        }

        for (let i = start; i < start + batchSize && i < datasets.train.length; i++) {
            const entry = datasets.train[i];
            const result = this.currentClassifier.evaluate(entry);
            this.currentClassifierMatches[i] = result === entry.label;

            if (result === entry.label) {
                this.currentClassifierStats.correct++;
            } else {
                this.currentClassifierStats.incorrect++;
            }
        }
        this.trainingProgress += batchSize;

        return false;
    }

    /**
     * Updates the classifier weight
     * @returns {*}  {number} The error of the classifier
     */
    public updateClassifier(): number {
        let error = 0;

        for (let i = 0; i < datasets.train.length; i++) {
            if (!this.currentClassifierMatches[i]) {
                error += this.weights[i];
            }
        }

        const alpha = 0.5 * Math.log((1 - error) / (error + 1e-10));
        this.currentClassifierWeight = alpha;

        return alpha;
    }

    /**
     * Updates and normalizes the weights of the training set
     */
    public updateWeights(): void {
        let sum = 0;

        const correctFactor = Math.exp(-this.currentClassifierWeight!);
        const incorrectFactor = Math.exp(this.currentClassifierWeight!);

        for (let i = 0; i < datasets.train.length; i++) {
            if (this.currentClassifierMatches[i]) {
                this.weights[i] *= correctFactor;
            } else {
                this.weights[i] *= incorrectFactor;
            }
            sum += this.weights[i];
        }

        for (let i = 0; i < datasets.train.length; i++) {
            this.weights[i] /= sum;
        }
    }

    /**
     * Adds the current classifier to the forest and resets the current classifier
     */
    public nextIteration(): void {
        if (this.currentClassifier === null) {
            throw new Error("No classifier to train");
        }

        this.forest.push({
            classifier: this.currentClassifier,
            weight: this.currentClassifierWeight!
        });
        this.trainingProgress = 0;
        this.currentClassifier = null;
        this.currentClassifierWeight = null;
        this.currentClassifierMatches = Array.from(
            { length: datasets.train.length },
            () => false
        );
        this.currentClassifierStats = {
            correct: 0,
            incorrect: 0
        };
    }


    /**
     * Classifies a single digit entry
     * @param {DigitEntry} digit - The digit entry to classify
     * @returns {*}  {number} The classification result (0 or 1)
     */
    public classify(digit: DigitEntry): number {
        let sum = 0;
        for (const entry of this.forest) {
            const result = entry.classifier.evaluate(digit);
            sum += entry.weight * (result === 1 ? -1 : 1);
        }
        return sum >= 0 ? 0 : 1;
    }

    /**
     * Classifies all digit entries in the dataset
     * @param {DigitEntry[]} digits - The digit entries to classify
     * @returns {*}  {number} The accuracy of the classification
     */
    public evaluateSet(digits: DigitEntry[]): number {
        let accuracySum = 0;

        for (const digit of digits) {
            const result = this.classify(digit);
            if (result === digit.label) {
                accuracySum++;
            }
        }
        return accuracySum / digits.length;
    }
}