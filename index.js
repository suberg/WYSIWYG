const editArea = document.querySelector('.edit-area');
const toolkit = document.querySelector('.toolkit');
const buttons = toolkit.querySelectorAll('button');

const NODE_NAMES = {
    H1: 'h1',
    H2: 'h2',
    B: 'b',
    EM: 'em',
};

const NODES = {
    [NODE_NAMES.H1]: {
        tagName: 'font',
        className: 'header1-text',
    },
    [NODE_NAMES.H2]: {
        tagName: 'font',
        className: 'header2-text',
    },
    [NODE_NAMES.B]: {
        tagName: 'b',
        className: 'bold-text',
    },
    [NODE_NAMES.EM]: {
        tagName: 'em',
        className: 'italic-text',
    },
};

const NODE_BY_CLASS = {
    'head-1': NODE_NAMES.H1,
    'head-2': NODE_NAMES.H2,
    'bold': NODE_NAMES.B,
    'italic': NODE_NAMES.EM,
};

const TEXT_STYLES = ['fontWeight', 'fontSize', 'lineHeight'];

const TOOLKIT_BUTTON_NAMES = [
    NODE_NAMES.H1,
    NODE_NAMES.H2,
    NODE_NAMES.B,
    NODE_NAMES.EM,
];

/**
 * Creates and returns DOM element.
 * @param {String} tagName
 * @return {HTMLElement}
 */
const getElement = (tagName) => {
    const element = document.createElement(tagName);

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
 * Added necessary styles to selected text
 * @param {HTMLElement} element 
 * @param {String} className 
 */
const updateElementStyles = (element, className) => {
    element.removeAttribute('style');
    element.className = '';
    element.style.display = 'inline';

    if (className) {
        element.classList.add(className);
    }

    if (element.tagName.toLowerCase() === 'font') {
        TEXT_STYLES.forEach((styleName) => {
            element.style[styleName] = getComputedStyle(element)[styleName];
        });
    }
};

/**
 * Handles buttons events. Adds/removes formatting to selected content.
 * @param {Event} event
 */
const handleButtonClick = (event) => {
    event.preventDefault();
    const buttonClass = event.target.closest('button')?.className;
    const selection = document.getSelection();
    const isSelectedInsideEditArea = selection.containsNode(editArea, true);

    if (!buttonClass || !isSelectedInsideEditArea || selection.isCollapsed) return;
    const { tagName, className } = NODES[NODE_BY_CLASS[buttonClass]];
    const selectionNode = getSelectionNode(selection);
    let clonedSelection = selection.getRangeAt(0).cloneContents();

    if (
        selectionNode.firstChild?.className === className ||
        clonedSelection.querySelector(`.${className}`)
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
        updateElementStyles(element, className);
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

toolkit.addEventListener('click', handleButtonClick);
