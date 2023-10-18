// rollup.config.js
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import * as path from 'path';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const isProduction = process.env.NODE_ENV?.startsWith('prod');
console.log(process.env.NODE_ENV);

const config = {
	input: './src/js/web-components.js',
	external: [
		'node-fetch'
	],
	output: [
		{
			file: './build/web-components.js',
			format: 'iife',
			name: '_ZoteroWebComponents',
			sourcemap: true,
			compact: isProduction,
		},
	],
	treeshake: {
		preset: 'smallest',
		moduleSideEffects: (id) => {
			if(id.includes('core-js/')) {
				return true;
			}
			return false;
		}
	},
	plugins: [
		resolve({
			modulePaths: [path.join(process.cwd(), 'src', 'js')],
			preferBuiltins: false,
			// mainFields: ['browser', 'main'],
			extensions: ['.js', '.jsx', '.mjs'],
		}),
		json(),
		commonjs({
			include: /node_modules/,
			// extensions: ['.js', '.jsx'],
		}),
		replace({
			preventAssignment: true,
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
			'process.env.TARGET': JSON.stringify(process.env.TARGET ?? 'default'),
		}),
		babel({
			include: ['src/js/**'],
			extensions: ['.js', '.jsx'],
			babelHelpers: 'bundled'
		}),
	]
};

if (isProduction) {
	config.plugins.push(terser());
}

export default config;
