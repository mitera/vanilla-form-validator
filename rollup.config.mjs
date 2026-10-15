import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import typescript from 'typescript';
import rollupTypescript from '@rollup/plugin-typescript';

// Read package metadata so the banner and output paths stay in sync with package.json
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// Derive the public repository URL and the GitHub owner from package.json
const repoUrl = pkg.homepage.replace(/#.*$/, '');
const owner = new URL(repoUrl).pathname.split('/')[1];

const license = `/*!
 * @author ${pkg.author}
 * ${pkg.name} v${pkg.version} by @${owner}
 * ${repoUrl}
 * Released under the ${pkg.license} License.
 */`;

export default {
    input: `./src/${pkg.name}.ts`,
    output: [
        {
            dir: dirname(pkg.main),
            format: 'umd',
            name: 'FormValidator',
            banner: license,
            indent: '\t',
        }
    ],
    plugins: [
        rollupTypescript( { typescript } ),
    ],
};
