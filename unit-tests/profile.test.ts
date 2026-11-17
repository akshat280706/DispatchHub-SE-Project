import { describe, test, expect } from 'vitest';
import { profileSchema } from '../src/schemas/profile';

const validProfile = {
    full_name: 'Test User',
    phone: '9876543210',
    address: 'Matunga Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400019'
};

describe('Profile Validation', () => {

    test('Valid customer profile', () => {
        expect(profileSchema.safeParse(validProfile).success).toBe(true);
    });

    test.each([
        ['full_name', 'A'],
        ['full_name', 'A'.repeat(101)],
        ['phone', '123'],
        ['phone', 'abc'],
        ['address', 'A'.repeat(301)],
        ['city', 'A'.repeat(101)],
        ['state', 'A'.repeat(101)],
        ['pincode', '123'],
        ['pincode', 'abcdef']
    ])('Reject invalid %s', (field, value) => {
        expect(profileSchema.safeParse({
            ...validProfile,
            [field]: value
        }).success).toBe(false);
    });

    test('Accept empty optional phone', () => {
        expect(profileSchema.safeParse({
            ...validProfile,
            phone: ''
        }).success).toBe(true);
    });

    test('Accept empty optional pincode', () => {
        expect(profileSchema.safeParse({
            ...validProfile,
            pincode: ''
        }).success).toBe(true);
    });

    test('Accept international phone format', () => {
        expect(profileSchema.safeParse({
            ...validProfile,
            phone: '+919876543210'
        }).success).toBe(true);
    });
});
