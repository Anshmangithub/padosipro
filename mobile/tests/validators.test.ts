import { isValidEmail, isValidIndianMobile, isValidPassword, passwordsMatch } from '../src/utils/validators';

describe('isValidEmail', () => {
  it('accepts well-formed addresses', () => {
    expect(isValidEmail('jane@example.com')).toBe(true);
  });

  it.each(['', 'not-an-email', 'jane@', '@example.com', 'jane example.com'])(
    'rejects %p',
    (value) => {
      expect(isValidEmail(value)).toBe(false);
    },
  );
});

describe('isValidPassword', () => {
  it('requires at least 8 characters, matching the backend rule', () => {
    expect(isValidPassword('1234567')).toBe(false);
    expect(isValidPassword('12345678')).toBe(true);
  });
});

describe('passwordsMatch', () => {
  it('is true only when both fields are equal and non-empty', () => {
    expect(passwordsMatch('secret123', 'secret123')).toBe(true);
    expect(passwordsMatch('secret123', 'different')).toBe(false);
    expect(passwordsMatch('', '')).toBe(false);
  });
});

describe('isValidIndianMobile', () => {
  it('accepts a 10-digit number starting with 6-9', () => {
    expect(isValidIndianMobile('9876543210')).toBe(true);
    expect(isValidIndianMobile('6000000000')).toBe(true);
  });

  it('rejects numbers starting with 0-5, wrong length, or non-digits', () => {
    expect(isValidIndianMobile('5876543210')).toBe(false);
    expect(isValidIndianMobile('98765432')).toBe(false);
    expect(isValidIndianMobile('987654321011')).toBe(false);
    expect(isValidIndianMobile('98765abcde')).toBe(false);
  });
});
