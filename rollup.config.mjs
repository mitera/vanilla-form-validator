import typescript from 'typescript';
import rollupTypescript from '@rollup/plugin-typescript';

const license = `/*!
 * @author Simone Miterangelis <simone@mite.it>
 * vanilla-form-validator v2.0.2 by @mitera
 * https://github.com/mitera/vanilla-form-validator
 * Released under the MIT License.
 */`;

export default {
    input: './src/vanilla-form-validator.ts',
    output: [
        {
            dir: 'dist',
            format: 'umd',
            name: 'FormValidator',
            //file: pkg.main,
            banner: license,
            indent: '\t',
        }
    ],
    plugins: [
        rollupTypescript( { typescript } ),
    ],
};