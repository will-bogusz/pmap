// src/types.ts
export interface FileNode {
    type: 'file' | 'directory';
    name: string;
    path: string;
    description?: string;
    children?: FileNode[];
    content?: string;
}

export interface ProjectConfig {
    rootDir: string;
    outputPath?: string;
    includeContent?: boolean;
    ignoredPatterns: string[];
    includedExtensions: string[];
    projectName?: string;
}