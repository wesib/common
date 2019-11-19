/**
 * @module @wesib/generic
 */
import { itsEach, overArray } from 'a-iterable';

/**
 * Imports DOM node from one document to another.
 *
 * @param from  The node to import.
 * @param to  The node to append imported node to.
 * @param importContent  A function that imports nodes nested in parent elements. [[importNodeContents]] by default.
 *
 * @returns Imported node.
 */
export function importNode(
    from: Node,
    to: Node,
    importContent: (this: void, from: Node, to: Node) => void = importNodeContent,
): Node {

  const doc = to.ownerDocument!;

  if (from.nodeType !== Node.ELEMENT_NODE) {

    const clone = doc.importNode(from, false);

    to.appendChild(clone);

    return clone;
  } else {

    const element = from as Element;
    const clone = doc.createElement(element.tagName.toLowerCase());

    element.getAttributeNames().forEach(attr => clone.setAttribute(attr, element.getAttribute(attr)!));

    importContent(element, clone);
    to.appendChild(clone);

    return clone;
  }
}

/**
 * Imports DOM node contents from one document to another.
 *
 * @param from  The node which contents to import.
 * @param to  The node to append imported nodes to.
 */
export function importNodeContent(from: Node, to: Node): void {
  itsEach(
      overArray(from.childNodes),
      node => importNode(node, to),
  );
}
