import { build } from 'esbuild';

await build({
	entryPoints: ['src/index.tsx'],
	bundle: true,
	minify: true,
	platform: 'browser',
	format: 'iife',
	target: ['es2018'],
	jsx: 'automatic',
	define: { 'process.env.NODE_ENV': '"production"' },
	outfile: '../src/main/resources/static/widget/task-widget.js'
});

console.log('Built widget -> ../src/main/resources/static/widget/task-widget.js');