import { describe, test, expect } from 'vitest';
import { contactSchema } from '../src/schemas/contact';

const validContact = {
    name: 'Test User',
    email: 'user@gmail.com',
    subject: 'Delivery enquiry',
    message: 'I want to know about my delivery.'
};

describe('Contact Form Validation', () => {

    test('Valid contact form', () => {
        expect(contactSchema.safeParse(validContact).success).toBe(true);
    });

    test.each([
        ['name', 'A'],
        ['name', 'A'.repeat(101)],
        ['email', ''],
        ['email', 'invalidemail'],
        ['subject', 'Hi'],
        ['subject', 'A'.repeat(151)],
        ['message', 'Short'],
        ['message', 'A'.repeat(2001)]
    ])('Reject invalid %s', (field, value) => {
        expect(contactSchema.safeParse({
            ...validContact,
            [field]: value
        }).success).toBe(false);
    });

    test('Accept minimum field lengths', () => {
        expect(contactSchema.safeParse({
            ...validContact,
            name: 'AB',
            subject: 'ABC',
            message: 'A'.repeat(10)
        }).success).toBe(true);
    });

    test('Accept maximum message length', () => {
        expect(contactSchema.safeParse({
            ...validContact,
            message: 'A'.repeat(2000)
        }).success).toBe(true);
    });
});
