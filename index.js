const editArea = document.querySelector('.edit-area');
const buttons = document.querySelector('.toolkit');

const NODE_NAMES = {
    H1: 'h1',
    H2: 'h2',
    B: 'b',
    EM: 'em',
};

const TOOLKIT_BUTTON_NAMES = [
    NODE_NAMES.H1,
    NODE_NAMES.H2,
    NODE_NAMES.B,
    NODE_NAMES.EM,
];

const ELEMENTS_CLASSES = {
    [NODE_NAMES.H1]: 'header1-text',
    [NODE_NAMES.H2]: 'header2-text',
    [NODE_NAMES.B]: 'bold-text',
    [NODE_NAMES.EM]: 'italic-text',
};

/**
 * Creates and returns DOM element.
 * @param {String} tagName
 * @return {HTMLElement}
 */
const getElement = (tagName) => {
    const element = document.createElement(tagName);
    if (ELEMENTS_CLASSES[tagName])
        element.className = ELEMENTS_CLASSES[tagName];

    return element;
};

/**
 * Allows to get selection HTML.
 * @param {Selection} selection
 * @return {DocumentFragment}
 */
const getSelectionNode = (selection) => {
    if (!selection.isCollapsed) {
        const parentElementName = selection.anchorNode.parentElement.tagName?.toLowerCase();

        if (
            selection.anchorNode === selection.focusNode &&
            TOOLKIT_BUTTON_NAMES.includes(parentElementName)
        ) {
            selection
                .getRangeAt(0)
                .surroundContents(getElement(parentElementName));
        }

        return selection.getRangeAt(0).cloneContents();
    }
};

/**
 * Handles copy/cut events of selected text
 * @param {ClipboardEvent} event 
 * @param {Selection} selection 
 */
const copyToClipboard = (event, selection) => {
    const selectionNode = getSelectionNode(selection);

    if (selectionNode) {
        const div = document.createElement('div');
        div.appendChild(selectionNode);
        [NODE_NAMES.H1, NODE_NAMES.H2, NODE_NAMES.B, NODE_NAMES.EM].forEach((nodeName) => {
            const elementsInEditArea = editArea.querySelector(nodeName);
            const elements = div.querySelectorAll(nodeName);
            elements.forEach((element) => {
                const fontSize = getComputedStyle(
                    elementsInEditArea,
                    null
                )?.getPropertyValue('font-size');
                element.style.fontSize = fontSize;
            });
        });
        event.clipboardData.setData('text/html', div.innerHTML);
    }
};

/**
 * Copies selection on the page in HTML format.
 * @param {ClipboardEvent} event
 */
const handleCopy = (event) => {
    event.preventDefault();
    const selection = document.getSelection();
    copyToClipboard(event, selection);
};

/**
 * Cuts selection from the page in HTML format.
 * @param {ClipboardEvent} event
 */
const handleCut = (event) => {
    event.preventDefault();
    const selection = document.getSelection();
    copyToClipboard(event, selection);
    selection.deleteFromDocument();
};

/**
 * Allows to remove HTML tag from selection. Opposite of method document.getSelection().surroundContents().
 * @param {String} tagName
 * @param {Selection} selection
 * @return {HTMLElement}
 */
const unWrapElement = (tagName, selection) => {
    const clonedSelection = selection.getRangeAt(0).cloneContents();
    const nodeToRemove = clonedSelection.querySelector(tagName);
    if (!nodeToRemove) return;

    const parent = nodeToRemove.parentNode;

    while (nodeToRemove.firstChild) {
        parent.insertBefore(nodeToRemove.firstChild, nodeToRemove);
    }

    parent.removeChild(nodeToRemove);

    return parent;
};

/**
 * Handles buttons events. Adds/removes formatting to selected content.
 * @param {Event} event
 */
const handleButtonClick = (event) => {
    event.preventDefault();
    const tagName = event.target.closest('button')?.dataset.tag;
    const selection = document.getSelection();

    if (!tagName || selection.isCollapsed) return;
    const selectionNode = getSelectionNode(selection);
    let clonedSelection = selection.getRangeAt(0).cloneContents();

    if (
        tagName === NODE_NAMES.H2 &&
        clonedSelection.querySelector(NODE_NAMES.H1)
    ) {
        clonedSelection = unWrapElement(NODE_NAMES.H1, selection);
    } else if (
        tagName === NODE_NAMES.H1 &&
        clonedSelection.querySelector(NODE_NAMES.H2)
    ) {
        clonedSelection = unWrapElement(NODE_NAMES.H2, selection);
    }

    if (
        selectionNode.firstChild?.tagName?.toLowerCase() === tagName ||
        clonedSelection.querySelector(tagName)
    ) {
        const updatedNode = unWrapElement(tagName, selection);
        if (updatedNode) {
            selection.deleteFromDocument();
            selection.getRangeAt(0).insertNode(updatedNode);
        }
    } else {
        const element = getElement(tagName);
        element.appendChild(clonedSelection);
        selection.deleteFromDocument();
        selection.getRangeAt(0).insertNode(element);
    }
};

/**
 * Removes all tags if there's no entered text in content editable area.
 * @param {InputEvent} event
 */
const handleClearInput = (event) => {
    if (event.inputType === 'deleteContentBackward' && !editArea.textContent) {
        editArea.textContent = '';
    }
};

editArea.addEventListener('copy', handleCopy);
editArea.addEventListener('cut', handleCut);
editArea.addEventListener('input', handleClearInput);

buttons.addEventListener('click', handleButtonClick);
