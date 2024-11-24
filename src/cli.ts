#!/usr/bin/env node
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import clipboardy from 'clipboardy';
import { join, dirname } from 'node:path';
import { promises as fs } from 'node:fs';
import { 
  getProjectConfig, 
  saveProjectConfig, 
  loadGitignore,
  getDefaultConfig,
  updateDefaultConfig
} from './config.js';
import { generateProjectMap } from './mapper.js';
import { validateDirectory, normalizePath } from './utils.js';

const program = new Command();

async function initializeProject(currentDir: string, options: any) {
  const defaults = getDefaultConfig();
  const gitignorePatterns = await loadGitignore(currentDir);

  if (!gitignorePatterns) {
    console.log(chalk.yellow(
      'No .gitignore found. Using default ignore patterns. You can customize these in the project settings.'
    ));
  }

  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useCurrentDir',
      message: `Use ${currentDir} as project root?`,
      default: true
    },
    {
      type: 'input',
      name: 'outputPath',
      message: 'Default output directory (relative to project root):',
      default: 'docs/structure',
      when: !options.clipboard
    },
    {
      type: 'editor',
      name: 'ignoredPatterns',
      message: 'Configure ignored patterns (one per line):',
      default: (gitignorePatterns ?? defaults.defaultIgnoredPatterns).join('\n'),
      when: options.configureIgnored
    },
    {
      type: 'editor',
      name: 'includedExtensions',
      message: 'Configure included file extensions (one per line):',
      default: defaults.defaultIncludedExtensions.join('\n'),
      when: options.configureExtensions
    }
  ]);

  const config = {
    rootDir: answers.useCurrentDir ? currentDir : process.cwd(),
    outputPath: answers.outputPath,
    includeContent: options.content,
    ignoredPatterns: answers.ignoredPatterns
      ? answers.ignoredPatterns.split('\n').filter(Boolean)
      : (gitignorePatterns ?? defaults.defaultIgnoredPatterns),
    includedExtensions: answers.includedExtensions
      ? answers.includedExtensions.split('\n').filter(Boolean)
      : defaults.defaultIncludedExtensions
  };

  saveProjectConfig(config.rootDir, config);
  console.log(chalk.green('Project configuration saved!'));

  return config;
}

program
  .name('projmap')
  .description('Fast project structure documentation generator')
  .version('1.0.0')
  .option('-c, --content', 'Include file contents in the output')
  .option('-o, --output <path>', 'Output file path (relative to project root)')
  .option('--clipboard', 'Copy output to clipboard instead of saving to file')
  .option('--init', 'Initialize project configuration')
  .option('--config-ignored', 'Configure ignored patterns during initialization')
  .option('--config-extensions', 'Configure included extensions during initialization')
  .option('--set-defaults', 'Update default configuration for new projects')
  .argument('[path]', 'Target subdirectory to map (optional)')
  .action(async (targetPath: string | undefined, options) => {
    try {
      const currentDir = process.cwd();

      if (targetPath) {
        const isValid = await validateDirectory(targetPath);
        if (!isValid) {
          throw new Error(`Invalid directory path: ${targetPath}`);
        }
      }
      
      if (options.setDefaults) {
        const answers = await inquirer.prompt([
          {
            type: 'editor',
            name: 'ignoredPatterns',
            message: 'Configure default ignored patterns (one per line):',
            default: getDefaultConfig().defaultIgnoredPatterns.join('\n')
          },
          {
            type: 'editor',
            name: 'includedExtensions',
            message: 'Configure default included extensions (one per line):',
            default: getDefaultConfig().defaultIncludedExtensions.join('\n')
          }
        ]);

        updateDefaultConfig(
          answers.ignoredPatterns.split('\n').filter(Boolean),
          answers.includedExtensions.split('\n').filter(Boolean)
        );
        console.log(chalk.green('Default configuration updated!'));
        return;
      }

      let config = await getProjectConfig(normalizePath(currentDir));

      if (options.init || !config) {
        config = await initializeProject(currentDir, options);
      }

      const content = await generateProjectMap(
        config,
        targetPath,
        options.content ?? config.includeContent
      );

      if (options.clipboard) {
        await clipboardy.write(content.content);
        console.log(chalk.green('Project structure copied to clipboard!'));
      } else {
        const outputPath = options.output ?? config.outputPath ?? 'PROJECT_STRUCTURE.md';
        const fullOutputPath = join(config.rootDir, outputPath);
        
        await fs.mkdir(dirname(fullOutputPath), { recursive: true });
        await fs.writeFile(fullOutputPath, content.content);
        
        console.log(chalk.green(`Project structure saved to: ${fullOutputPath}`));
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program.parse();