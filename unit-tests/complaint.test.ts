import { describe, test, expect } from 'vitest';
import { complaintSchema } from '../src/schemas/complaint';

const validComplaint = {
    parcel_id: 'parcel123',
    subject: 'Late delivery',
    description: 'My parcel has not arrived on time.'
};

describe('Complaint Validation', () => {

    test('Valid complaint', () => {
        expect(complaintSchema.safeParse(validComplaint).success).toBe(true);
    });

    test.each([
        ['parcel_id', ''],
        ['subject', 'Hi'],
        ['subject', 'A'.repeat(151)],
        ['description', 'Short'],
        ['description', 'A'.repeat(2001)]
    ])('Reject invalid %s', (field, value) => {
        expect(complaintSchema.safeParse({
            ...validComplaint,
            [field]: value
        }).success).toBe(false);
    });

    test('Accept minimum valid lengths', () => {
        expect(complaintSchema.safeParse({
            ...validComplaint,
            subject: 'ABC',
            description: 'A'.repeat(10)
        }).success).toBe(true);
    });

    test('Accept maximum valid lengths', () => {
        expect(complaintSchema.safeParse({
            ...validComplaint,
            subject: 'A'.repeat(150),
            description: 'A'.repeat(2000)
        }).success).toBe(true);
    });
});
