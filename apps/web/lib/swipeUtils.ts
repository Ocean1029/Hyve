/**
 * Utility functions for swipe navigation
 * Extracted to avoid duplication and enable unit testing
 */

/**
 * Check if the element or its ancestors is within a horizontal scroll container
 * that has actual horizontal scroll capability (e.g. photo gallery).
 * When true, page swipe navigation should be disabled to let the container handle scrolling.
 */
export function isInHorizontalScrollArea(element: HTMLElement): boolean {
  const horizontalScrollContainer = element.closest('[class*="overflow-x-auto"]');
  if (!horizontalScrollContainer) return false;

  const container = horizontalScrollContainer as HTMLElement;
  return container.scrollWidth > container.clientWidth;
}

/**
 * Check if touch events should be ignored for the given target element.
 * Returns true for form controls, buttons, images, and links where
 * we want to preserve native behavior (e.g. tap to focus, image zoom, link navigation).
 */
export function shouldIgnoreTouchTarget(element: HTMLElement): boolean {
  const tagName = element.tagName;
  if (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'BUTTON' ||
    tagName === 'SELECT'
  ) {
    return true;
  }

  if (
    element.closest('input') ||
    element.closest('textarea') ||
    element.closest('button') ||
    element.closest('select') ||
    element.closest('img') ||
    element.closest('a')
  ) {
    return true;
  }

  return false;
}
