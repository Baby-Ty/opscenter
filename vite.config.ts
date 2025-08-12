import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dynamically set base when building on GitHub Actions so assets resolve under
// the repository subpath (e.g. https://user.github.io/repo/). For user/org
// pages (repo ends with .github.io), keep base at '/'.
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const isActions = Boolean(process.env.GITHUB_ACTIONS);
const isUserOrgPage = repositoryName.endsWith('.github.io');

export default defineConfig({
  plugins: [react()],
  base: isActions ? (isUserOrgPage ? '/' : `/${repositoryName}/`) : '/',
});


