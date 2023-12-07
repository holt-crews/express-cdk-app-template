global.console = {
  ...global.console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: console.debug,
  trace: console.trace,
};
