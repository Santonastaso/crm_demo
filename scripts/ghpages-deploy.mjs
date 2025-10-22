import * as ghpages from 'gh-pages';

ghpages.publish(
  'dist',
  {
    branch: process.env.DEPLOY_BRANCH || 'gh-pages',
    repo: process.env.DEPLOY_REPO_URL || undefined,
    add: true,
    dotfiles: true,
    message: 'Deploy to GitHub Pages',
  },
  function (err) {
    if (err) {
      console.error('Failed to deploy to GitHub Pages', err);
    }
  },
);
