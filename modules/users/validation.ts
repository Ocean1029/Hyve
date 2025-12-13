// modules/users/validation.ts

/**
 * Validate custom userId format and length
 * @param userId - The userId to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateUserId(userId: string): { isValid: boolean; error?: string } {
  // Check if empty
  if (!userId || userId.trim().length === 0) {
    return { isValid: false, error: 'UserId cannot be empty' };
  }

  // Check length (1-30 characters)
  if (userId.length > 30) {
    return { isValid: false, error: 'UserId must be between 1 and 30 characters' };
  }

  // Check format: only letters, numbers, and underscores
  const userIdRegex = /^[a-zA-Z0-9_]+$/;
  if (!userIdRegex.test(userId)) {
    return { isValid: false, error: 'Invalid userId format. Only letters, numbers, and underscores are allowed' };
  }

  return { isValid: true };
}

