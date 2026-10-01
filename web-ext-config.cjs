module.exports = {
  ignoreFiles: [
    'tests/**',
    'agent/**',
    'agent',
    'assets/icon.clip',
    '*.stackdump',
    'web-ext-config.cjs',
    'package-lock.json',
    'node_modules',
    '.gitignore',
  ],
  build: {
    overwriteDest: true,
  },
};
