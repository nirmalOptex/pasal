import moduleAlias = require('module-alias');
import path from 'path';

// Programmatic alias registration ensuring compiled JS (dist/) always resolves aliases
// to their absolute directory, regardless of process.cwd(), monorepo root, or runner (PM2, Docker, node).
moduleAlias.addAliases({
  '@config': path.resolve(__dirname, 'config'),
  '@database': path.resolve(__dirname, 'database'),
  '@entities': path.resolve(__dirname, 'entities'),
  '@modules': path.resolve(__dirname, 'modules'),
  '@middleware': path.resolve(__dirname, 'middleware'),
  '@shared': path.resolve(__dirname, 'shared'),
});
