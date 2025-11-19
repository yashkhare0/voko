#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init';
import { syncCommand } from './commands/sync';

const program = new Command();

program.name('voko').description('i18n management CLI').version('1.0.0');

program.addCommand(initCommand);
program.addCommand(syncCommand);

program.parse(process.argv);
