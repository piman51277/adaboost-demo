/**
 * Get the scroll position of an element relative to the viewport.
 * @param {HTMLElement} element - The element to get the scroll position of.
 * @param {boolean} [relative] - If true, returns as a percent of element height. Otherwie raw px value.
 * @returns {*}  {(number | null)} null if the element is out of view, otherwise the scroll position.
 */
export function scrollPosition(element: HTMLElement, relative = true): number | null {
    if (!element) {
        console.error("Element is null or undefined.");
        return 0;
    }

    const boundingRect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    //when y is positive, the element is below
    //when y is negative, the element is above
    const { y, height } = boundingRect;

    //when y is larger than the viewport height, the element is out of view
    if (y > viewportHeight) {
        return null;
    }

    //when -y is larger than the element height, we've scrolled past the element
    if (-y > height) {
        return null;
    }

    //if y is in range [0, viewportHeight], the element is coming into view
    //if y is in range [-height, 0], we are within the element



    if (!relative) {
        //this gives offset from the top of the viewport
        //to the top of the element
        return -y;
    } else {
        //special case: viewport is larger than the element
        //this behaves differently than the normal case,
        //showing how much of the element is visible
        if (viewportHeight >= height) {
            const slack = viewportHeight - height;

            //if y is in range [slack, viewportHeight], the element is coming into view
            if (y >= slack && y <= viewportHeight) {
                return (viewportHeight - y) / height;
            }

            //while y is within [0,slack], it is fully visible so we give it a value of 1
            if (y >= 0 && y <= slack) {
                return 1;
            }

            //if y is in range [-height, 0], the element is going out of view
            if (y >= -height && y <= 0) {
                return (height - y) / height;
            }
        }

        //same thing but relative to the element
        return (- y) / (height - viewportHeight);
    }
}