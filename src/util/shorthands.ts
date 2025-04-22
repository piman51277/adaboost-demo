/**
 * Shothand for document.getElementById
 * @param {string} id - The id of the element
 * @returns {*}  {HTMLElement} The element with the given id
 */
export function byID(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Element with id ${id} not found`);
    }
    return el;
}