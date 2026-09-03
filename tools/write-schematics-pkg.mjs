import { writeFileSync, mkdirSync } from 'node:fs';

/*
 * ng-packagr marks the published package "type": "module", which would make Node
 * treat our CommonJS schematics as ESM ("exports is not defined"). A nested
 * package.json scopes just this folder back to CommonJS — the same thing
 * @angular/material ships.
 *
 * It is written here rather than kept in source so ng-packagr never mistakes it
 * for a secondary entry point.
 */
const dir = 'dist/core/schematics';
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/package.json`, JSON.stringify({ type: 'commonjs' }, null, 2) + '\n');
console.log(`wrote ${dir}/package.json (type: commonjs)`);
