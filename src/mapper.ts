// src/mapper.ts
import { promises as fs } from 'node:fs';
import { join, relative } from 'node:path';
import { FileNode, ProjectConfig } from './types.js';
import { sanitizePathForFilename, validateDirectory } from './utils.js';

async function getDescription(filePath: string): Promise<string | undefined> {
    if ((await fs.stat(filePath)).isDirectory()) {
        try {
            const readmePath = join(filePath, 'README.md');
            const content = await fs.readFile(readmePath, 'utf-8');
            const description = content.split('\n\n')
                .find(p => !p.startsWith('#'))?.trim();
            return description;
        } catch {
            // No README found
        }
    }
    return undefined;
}

async function getFileContent(filePath: string): Promise<string | undefined> {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
    } catch {
        return undefined;
    }
}

function shouldIgnore(fileName: string, ignoredPatterns: string[]): boolean {
    if (ignoredPatterns.includes(fileName)) {
        return true;
    }

    return ignoredPatterns.some(pattern => {
        if (pattern.includes('*')) {
            // Handle gitignore-style patterns
            const regexPattern = pattern
                .replace(/\./g, '\\.')
                .replace(/\*/g, '.*')
                .replace(/\?/g, '.');
            const regex = new RegExp(`^${regexPattern}$`);
            return regex.test(fileName);
        }
        return false;
    });
}

function shouldIncludeFile(fileName: string, includedExtensions: string[]): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension ? includedExtensions.includes(extension) : false;
}

async function mapDirectory(
    dirPath: string,
    config: ProjectConfig,
    indent = 0,
    includeContent = false
): Promise<FileNode[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const entry of entries) {
        if (shouldIgnore(entry.name, config.ignoredPatterns)) continue;

        const fullPath = join(dirPath, entry.name);
        const relativePath = relative(config.rootDir, fullPath);

        if (entry.isDirectory()) {
            const children = await mapDirectory(fullPath, config, indent + 1, includeContent);
            if (children.length > 0) { // Only include directories that have visible contents
                nodes.push({
                    type: 'directory',
                    name: entry.name,
                    path: relativePath,
                    description: await getDescription(fullPath),
                    children
                });
            }
        } else if (shouldIncludeFile(entry.name, config.includedExtensions)) {
            const node: FileNode = {
                type: 'file',
                name: entry.name,
                path: relativePath,
            };
            
            if (includeContent) {
                node.content = await getFileContent(fullPath);
            }
            
            nodes.push(node);
        }
    }

    return nodes.sort((a, b) => {
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
    });
}

function generateMarkdown(nodes: FileNode[], level = 0, contentMap: Map<string, string> = new Map()): string {
    let markdown = '';
    const indent = '  '.repeat(level);

    // Generate tree structure
    for (const node of nodes) {
        const prefix = level === 0 ? '└─' : '├─';
        markdown += `${indent}${prefix} ${node.type === 'directory' ? '📁' : '📄'} ${node.name}\n`;

        if (node.description) {
            markdown += `${indent}   ${node.description}\n`;
        }

        if (node.content) {
            contentMap.set(node.path, node.content);
        }

        if (node.children) {
            markdown += generateMarkdown(node.children, level + 1, contentMap);
        }
    }

    // At root level, append all file contents
    if (level === 0 && contentMap.size > 0) {
        markdown += '\n## File Contents\n\n';
        for (const [path, content] of contentMap.entries()) {
            const extension = path.split('.').pop() || '';
            markdown += `### Begin File: ${path}\n`;
            markdown += '```' + extension + '\n';
            markdown += content;
            markdown += `\n\`\`\`\n### End File: ${path}\n\n-----\n\n`;
        }
    }

    return markdown;
}

export async function generateProjectMap(
    config: ProjectConfig,
    targetPath?: string,
    includeContent = false
): Promise<{ content: string; outputPath: string }> {
    try {
        let baseDir = config.rootDir;
        let outputFileName = 'PROJECT_STRUCTURE.md';
        
        if (targetPath) {
            const resolvedPath = join(config.rootDir, targetPath);
            if (!await validateDirectory(resolvedPath)) {
                throw new Error(`Directory not found: ${targetPath}`);
            }
            baseDir = resolvedPath;
            outputFileName = `PROJECT_STRUCTURE.${sanitizePathForFilename(targetPath)}.md`;
        }

        const structure = await mapDirectory(baseDir, config, 0, includeContent);

        let content = `# ${config.projectName || 'Project'} Structure${targetPath ? ` - ${targetPath}` : ''}\n\n`;
        content += `_Generated at ${new Date().toISOString()}_\n\n`;
        content += `This document provides a comprehensive map of the ${targetPath ? `'${targetPath}' directory` : 'project'} structure`;
        content += includeContent ? ' including file contents' : '';
        content += `. It is automatically generated to maintain accuracy and serves as a reference `;
        content += `for developers and AI assistants working with the codebase.\n\n`;

        content += `## Project Structure\n\n`;
        content += `\`\`\`\n${generateMarkdown(structure)}\`\`\`\n`;

        const outputDir = config.outputPath ? 
            join(config.rootDir, config.outputPath) : 
            join(config.rootDir, 'docs', 'structure');
            
        const fullOutputPath = join(outputDir, outputFileName);

        return {
            content,
            outputPath: fullOutputPath
        };
    } catch (error) {
        console.error('Error generating project map:', error);
        throw error;
    }
}