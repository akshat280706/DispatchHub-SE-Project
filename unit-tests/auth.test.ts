import { describe, test, expect } from 'vitest';
import { loginSchema, registerSchema } from '../src/schemas/auth';


// Login validation testing

describe('Login Schema - White Box Testing', () => {

    test('WB01 - Valid login credentials', () => {
        const result = loginSchema.safeParse({
            email: 'user@gmail.com',
            password: 'Test1234'
        });

        expect(result.success).toBe(true);
    });


    test('WB02 - Empty email', () => {
        const result = loginSchema.safeParse({
            email: '',
            password: 'Test1234'
        });

        expect(result.success).toBe(false);
    });


    test('WB03 - Invalid email format', () => {
        const result = loginSchema.safeParse({
            email: 'invalidemail',
            password: 'Test1234'
        });

        expect(result.success).toBe(false);
    });


    test('WB04 - Empty password', () => {
        const result = loginSchema.safeParse({
            email: 'user@gmail.com',
            password: ''
        });

        expect(result.success).toBe(false);
    });

});


// Valid registration data

const validUser = {
    full_name: 'Test User',
    email: 'user@gmail.com',
    phone: '9876543210',
    password: 'Test1234',
    confirm_password: 'Test1234'
};


// Registration validation testing

describe('Registration Schema - White Box Testing', () => {

    test('WB05 - Valid registration data', () => {
        const result = registerSchema.safeParse(validUser);

        expect(result.success).toBe(true);
    });


    test('WB06 - Name too short', () => {
        const result = registerSchema.safeParse({
            ...validUser,
            full_name: 'A'
        });

        expect(result.success).toBe(false);
    });


    test('WB07 - Invalid email', () => {
        const result = registerSchema.safeParse({
            ...validUser,
            email: 'invalidemail'
        });

        expect(result.success).toBe(false);
    });


    test('WB08 - Invalid phone number', () => {
        const result = registerSchema.safeParse({
            ...validUser,
            phone: '123'
        });

        expect(result.success).toBe(false);
    });


    test('WB09 - Empty optional phone number', () => {
        const result = registerSchema.safeParse({
            ...validUser,
            phone: ''
        });

        expect(result.success).toBe(true);
    });


    test('WB10 - Password shorter than 8 characters', () => {
        const result = registerSchema.safeParse({
            ...validUser,
            password: 'Ab123',
            confirm_password: 'Ab123'
        });

        expect(result.success).toBe(false);
    });


    test('WB11 - Password without letters', () => {
        const result = registerSchema.safeParse({
            ...validUser,
            password: '12345678',
            confirm_password: '12345678'
        });

        expect(result.success).toBe(false);
    });


    test('WB12 - Password without numbers', () => {
        const result = registerSchema.safeParse({
            ...validUser,
            password: 'abcdefgh',
            confirm_password: 'abcdefgh'
        });

        expect(result.success).toBe(false);
    });


    test('WB13 - Passwords do not match', () => {
        const result = registerSchema.safeParse({
            ...validUser,
            confirm_password: 'Wrong1234'
        });

        expect(result.success).toBe(false);
    });


    test('WB14 - Empty confirm password', () => {
        const result = registerSchema.safeParse({
            ...validUser,
            confirm_password: ''
        });

        expect(result.success).toBe(false);
    });


    test('WB15 - Name exceeding 100 characters', () => {
        const result = registerSchema.safeParse({
            ...validUser,
            full_name: 'A'.repeat(101)
        });

        expect(result.success).toBe(false);
    });

});
