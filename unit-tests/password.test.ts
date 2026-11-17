import { describe, test, expect } from 'vitest';

import {
    forgotSchema,
    resetSchema,
    changePasswordSchema
} from '../src/schemas/password';


describe('Forgot Password', () => {

    test('Accept valid email', () => {
        expect(forgotSchema.safeParse({
            email: 'user@gmail.com'
        }).success).toBe(true);
    });

    test.each(['', 'invalidemail'])(
        'Reject invalid email %s', (email) => {
            expect(forgotSchema.safeParse({
                email
            }).success).toBe(false);
        }
    );
});


describe('Reset Password', () => {

    test('Valid new password', () => {
        expect(resetSchema.safeParse({
            password: 'NewPass123',
            confirm_password: 'NewPass123'
        }).success).toBe(true);
    });

    test.each([
        'Ab12',
        '12345678',
        'abcdefgh'
    ])('Reject weak password %s', (password) => {
        expect(resetSchema.safeParse({
            password,
            confirm_password: password
        }).success).toBe(false);
    });

    test('Reject password mismatch', () => {
        expect(resetSchema.safeParse({
            password: 'NewPass123',
            confirm_password: 'WrongPass123'
        }).success).toBe(false);
    });

    test('Reject empty confirmation', () => {
        expect(resetSchema.safeParse({
            password: 'NewPass123',
            confirm_password: ''
        }).success).toBe(false);
    });
});


const validChange = {
    current_password: 'OldPass123',
    password: 'NewPass123',
    confirm_password: 'NewPass123'
};

describe('Change Password', () => {

    test('Valid password change', () => {
        expect(changePasswordSchema.safeParse(validChange).success).toBe(true);
    });

    test('Reject empty current password', () => {
        expect(changePasswordSchema.safeParse({
            ...validChange,
            current_password: ''
        }).success).toBe(false);
    });

    test('Reject matching old and new passwords', () => {
        expect(changePasswordSchema.safeParse({
            ...validChange,
            password: 'OldPass123',
            confirm_password: 'OldPass123'
        }).success).toBe(false);
    });

    test('Reject mismatching confirmation', () => {
        expect(changePasswordSchema.safeParse({
            ...validChange,
            confirm_password: 'WrongPass123'
        }).success).toBe(false);
    });

    test.each(['Ab12', '12345678', 'abcdefgh'])(
        'Reject weak new password %s', (password) => {
            expect(changePasswordSchema.safeParse({
                ...validChange,
                password,
                confirm_password: password
            }).success).toBe(false);
        }
    );
});
