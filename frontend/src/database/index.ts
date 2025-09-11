// Default export - Metro bundler will automatically use platform-specific files
// This file serves as fallback, platform-specific files (.web.ts, .native.ts) take precedence

import { WebDatabase } from './webDatabase';

// Fallback to web implementation (should not be reached with proper platform files)
export const database = WebDatabase.getInstance();