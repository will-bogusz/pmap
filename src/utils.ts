// src/utils.ts
import { promises as fs } from 'node:fs';
import { join, relative } from 'node:path';
import { platform } from 'node:os';
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

export function normalizePath(path: string): string {
    // Normalize path separators for current OS
    return path.replace(/[/\\]/g, platform() === 'win32' ? '\\' : '/');
}

export function isWindowsPath(path: string): boolean {
    return /^[a-zA-Z]:[/\\]/.test(path);
}