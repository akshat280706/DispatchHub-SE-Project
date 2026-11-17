import { describe, test, expect } from 'vitest';
import { createStaffSchema } from '../src/schemas/user';

const validStaff = {
    full_name: 'Test Staff',
    email: 'staff@gmail.com',
    phone: '9876543210',
    role: 'BRANCH_MANAGER',
    branch_id: 'branch123',
    password: 'Staff1234'
};

describe('Staff Creation and Role Validation', () => {

    test('Valid branch manager', () => {
        expect(createStaffSchema.safeParse(validStaff).success).toBe(true);
    });

    test.each([
        ['full_name', 'A'],
        ['full_name', 'A'.repeat(101)],
        ['email', ''],
        ['email', 'invalidemail'],
        ['phone', '123'],
        ['role', 'CUSTOMER'],
        ['role', 'INVALID'],
        ['password', 'Ab12'],
        ['password', '12345678'],
        ['password', 'abcdefgh']
    ])('Reject invalid %s', (field, value) => {
        expect(createStaffSchema.safeParse({
            ...validStaff,
            [field]: value
        }).success).toBe(false);
    });

    test('Accept delivery personnel', () => {
        expect(createStaffSchema.safeParse({
            ...validStaff,
            role: 'DELIVERY_PERSONNEL'
        }).success).toBe(true);
    });

    test('Accept admin without branch', () => {
        expect(createStaffSchema.safeParse({
            ...validStaff,
            role: 'ADMIN',
            branch_id: ''
        }).success).toBe(true);
    });

    test('Reject manager without branch', () => {
        expect(createStaffSchema.safeParse({
            ...validStaff,
            role: 'BRANCH_MANAGER',
            branch_id: ''
        }).success).toBe(false);
    });

    test('Reject delivery personnel without branch', () => {
        expect(createStaffSchema.safeParse({
            ...validStaff,
            role: 'DELIVERY_PERSONNEL',
            branch_id: ''
        }).success).toBe(false);
    });

    test('Accept optional empty phone', () => {
        expect(createStaffSchema.safeParse({
            ...validStaff,
            phone: ''
        }).success).toBe(true);
    });
});
