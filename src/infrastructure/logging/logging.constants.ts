export const LOG_STRATEGIES = Symbol('LOG_STRATEGIES');

export const CUSTOM_LEVELS = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    io: 5,
    db: 6,
    trace: 7,
  },
  colors: {
    fatal: 'magenta',
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'cyan',
    io: 'blue',
    db: 'white',
    trace: 'grey',
  },
};
