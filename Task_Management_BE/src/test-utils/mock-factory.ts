export type Mocked<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] extends (...args: infer Args) => infer Return
    ? jest.Mock<Return, Args>
    : T[K];
};

export function createMock<T extends Record<string, unknown>>(
  keys: Array<keyof T>,
): Mocked<T> {
  return keys.reduce((mock, key) => {
    mock[key] = jest.fn() as Mocked<T>[keyof T];
    return mock;
  }, {} as Mocked<T>);
}

export function createResponseMock() {
  const res = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    json: jest.fn(),
  };
  res.cookie.mockReturnValue(res);
  res.clearCookie.mockReturnValue(res);
  res.json.mockImplementation((payload) => payload);
  return res;
}
