/**
 * Utility functions for ID conversion across the application
 */

/**
 * Converts a string ID to a number
 *
 * @param id String ID to convert
 * @returns number ID or throws error if invalid
 */
export function toNumberId(id: string): number {
  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    throw new Error(`Invalid ID format: ${id} is not a valid number`);
  }
  return numId;
}

/**
 * Converts a string ID to a number, with fallback to string if needed
 * For use in repositories that might accept either type
 *
 * @param id String ID to convert
 * @returns number ID (or original string if needed)
 */
export function toNumberOrStringId(id: string): number | string {
  try {
    return toNumberId(id);
  } catch (e) {
    return id;
  }
}
