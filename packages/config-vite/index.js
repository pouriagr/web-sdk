// Don't convert this to a ts file, because of this https://github.com/vitejs/vite/issues/5370
import { sveltekit } from '@sveltejs/kit/vite';
import { lingui } from '@lingui/vite-plugin';
import { defineConfig, searchForWorkspaceRoot } from 'vite';

const NODE_ENV = process.env.NODE_ENV;
let dev = NODE_ENV === 'development';

export default () =>
	defineConfig({
		plugins: [sveltekit(), lingui()],
		logLevel: 'info',
		server: {
			fs: {
				// pnpm monorepo: allow serving workspace packages (packages/*) that are
				// symlinked into each app, else Vite blocks them with
				// "outside of Vite serving allow list" and the page fails to load.
				allow: [searchForWorkspaceRoot(process.cwd())],
			},
		},
		build: {
			assetsInlineLimit: Infinity,
			sourcemap: dev ? true : false,
			output: {
				sourcemap: dev ? true : false,
			},
		},
		css: {
			preprocessorOptions: {
				scss: {
					api: 'modern-compiler',
				},
			},
		},
	});
