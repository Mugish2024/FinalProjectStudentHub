export type PasswordRule = {
    id: string;
    label: string;
    valid: boolean;
};

const commonWeakPasswords = new Set([
    'auca123',
    'password123',
    '12345678',
    'admin123',
    'qwerty',
    'password',
    'admin',
    'letmein',
    'welcome',
    'student123',
    'aucasa123',
]);

export const getPasswordRules = (password: string): PasswordRule[] => {
    const normalized = password.trim().toLowerCase();
    return [
        { id: 'length', label: '8 to 72 characters', valid: password.length >= 8 && password.length <= 72 },
        { id: 'uppercase', label: 'At least one uppercase letter', valid: /[A-Z]/.test(password) },
        { id: 'lowercase', label: 'At least one lowercase letter', valid: /[a-z]/.test(password) },
        { id: 'number', label: 'At least one number', valid: /\d/.test(password) },
        { id: 'special', label: 'At least one special character (@, #, !, $, etc.)', valid: /[^A-Za-z0-9]/.test(password) },
        { id: 'common', label: 'Not a common weak password', valid: !commonWeakPasswords.has(normalized) },
    ];
};

export const getPasswordStrength = (password: string) => {
    const rules = getPasswordRules(password);
    const passed = rules.filter((rule) => rule.valid).length;
    if (!password) return { label: 'No password', score: 0, rules, isValid: false };
    if (passed <= 2) return { label: 'Weak', score: 1, rules, isValid: false };
    if (passed <= 4) return { label: 'Medium', score: 2, rules, isValid: false };
    if (passed === 5) return { label: 'Good', score: 3, rules, isValid: false };
    return { label: 'Strong', score: 4, rules, isValid: true };
};
