// src/utils.ts
import { promises as fs } from 'node:fs';
import { join, relative } from 'node:path';
import { FileNode } from './types.js';

export async function validateDirectory(dirPath: string): Promise<boolean> {
    try {
        const stats = await fs.stat(dirPath);
        return stats.isDirectory();
    } catch {
        return false;
    }
}

export function sanitizePathForFilename(path: string): string {
    return path.replace(/[\/\\]/g, '__');
}