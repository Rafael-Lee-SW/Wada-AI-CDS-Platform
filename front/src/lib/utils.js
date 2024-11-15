// lib/utils.js

/**
 * Concatenates class names conditionally.
 * Filters out falsy values and joins the remaining classes with a space.
 *
 * @param  {...any} classes - List of class names or conditions.
 * @returns {string} - Concatenated class names.
 */
export function cn(...classes) {
    return classes.filter(Boolean).join(' ');
  }
  