// src/config.ts
import Conf from 'conf';
import { join } from 'node:path';
import { promises as fs } from 'node:fs';
import { ProjectConfig } from './types.js';
import { normalizePath, isWindowsPath } from './utils.js';

interface ConfigStore {
  projects: Record<string, ProjectConfig>;
  defaultIgnoredPatterns: string[];
  defaultIncludedExtensions: string[];
}

const DEFAULT_IGNORED_PATTERNS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '*.log',
  '.DS_Store',
  '.next',
  '.turbo',
  'generated'
];

const DEFAULT_INCLUDED_EXTENSIONS = [
  'ts', 'tsx', 'js', 'jsx', 'mjs',
  'json', 'md', 'yaml', 'yml',
  'toml', 'env', 'config', 'rc',
  'css', 'scss', 'postcss'
];

const config = new Conf<ConfigStore>({
  projectName: 'pmap',
  defaults: {
    projects: {},
    defaultIgnoredPatterns: DEFAULT_IGNORED_PATTERNS,
    defaultIncludedExtensions: DEFAULT_INCLUDED_EXTENSIONS
  }
});

export async function getProjectConfig(dir: string): Promise<ProjectConfig | undefined> {
  const projects = config.get('projects');
  
  // Find the closest parent directory that has a configuration
  let currentDir = normalizePath(dir);
  while (currentDir) {
    if (projects[currentDir]) {
      return projects[currentDir];
    }
    const parentDir = normalizePath(join(currentDir, '..'));
    if (parentDir === currentDir || (isWindowsPath(currentDir) && parentDir.length < currentDir.length)) break;
    currentDir = parentDir;
  }
  
  return undefined;
}

export async function loadGitignore(dir: string): Promise<string[] | undefined> {
  try {
    const gitignorePath = join(dir, '.gitignore');
    const content = await fs.readFile(gitignorePath, 'utf-8');
    return content
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => line.trim());
  } catch {
    return undefined;
  }
}

export function getDefaultConfig(): Pick<ConfigStore, 'defaultIgnoredPatterns' | 'defaultIncludedExtensions'> {
  return {
    defaultIgnoredPatterns: config.get('defaultIgnoredPatterns'),
    defaultIncludedExtensions: config.get('defaultIncludedExtensions')
  };
}

export function saveProjectConfig(dir: string, projectConfig: ProjectConfig): void {
  const projects = config.get('projects');
  projects[normalizePath(dir)] = projectConfig;
  config.set('projects', projects);
}

export function updateDefaultConfig(
  ignoredPatterns?: string[],
  includedExtensions?: string[]
): void {
  if (ignoredPatterns) {
    config.set('defaultIgnoredPatterns', ignoredPatterns);
  }
  if (includedExtensions) {
    config.set('defaultIncludedExtensions', includedExtensions);
  }
}