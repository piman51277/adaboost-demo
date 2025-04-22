import axios from 'axios';

type DatasetEncoded = {
    label: number;
    data: string; //base64 encoded string
}

export type DigitEntry = {
    label: number;
    data: number[];
}

/**
 * Decode the base64 encoded dataset
 * @param {DatasetEncoded} encoded - Encoded dataset
 * @returns {*}  {Dataset} Decoded dataset
 */
function decodeDataset(encoded: DatasetEncoded): DigitEntry {
    const dataStr = atob(encoded.data);
    const data = new Uint8Array(dataStr.length);
    for (let i = 0; i < dataStr.length; i++) {
        data[i] = dataStr.charCodeAt(i);
    }

    return {
        label: encoded.label,
        data: Array.from(data)
    };
}


type Datasets = {
    full: DigitEntry[];
    test: DigitEntry[];
    train: DigitEntry[];
}


export const datasets: Datasets = {
    full: [],
    test: [],
    train: []
};

/**
 *
 */
export async function fetchDigits(): Promise<void> {
    const filenames = [
        "full_digits.json",
        "test_digits.json",
        "train_digits.json",
    ];

    const sets = [];

    for (const filename of filenames) {
        const response = await axios.get(`/assets/${filename}`);
        const data = response.data as DatasetEncoded[];

        const decodedData = data.map(decodeDataset);

        sets.push(decodedData);
    }
    const [full, test, train] = sets;
    datasets.full = full;
    datasets.test = test;
    datasets.train = train;
}