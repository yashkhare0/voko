#!/usr/bin/env node
import { hello } from '@voko/core';

const name = process.argv[2] ?? 'world';
console.log(hello(name));
