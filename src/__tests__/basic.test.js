// Простой тест для проверки работы Jest
describe('Basic Tests', () => {
  test('должен проходить базовый тест', () => {
    expect(1 + 1).toBe(2);
  });

  test('должен проверять строки', () => {
    expect('Hello World').toContain('World');
  });

  test('должен проверять массивы', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  test('должен проверять объекты', () => {
    const obj = { name: 'Test', value: 42 };
    expect(obj).toHaveProperty('name');
    expect(obj.name).toBe('Test');
  });
});
