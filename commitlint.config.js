module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',      // New feature
        'fix',       // Bug fix
        'docs',      // Documentation
        'style',     // Code style changes
        'refactor',  // Code refactoring
        'perf',      // Performance improvements
        'test',      // Adding tests
        'chore',     // Maintenance tasks
        'migration', // Database migrations (custom)
        'tenant',    // Tenant-related changes (custom)
      ]
    ],
    'subject-case': [2, 'never', ['pascal-case', 'upper-case']],
    'subject-max-length': [2, 'always', 100],
  }
};