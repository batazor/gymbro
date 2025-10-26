// Мокаем fetch
global.fetch = jest.fn();

// Мокаем console для тестов
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};
