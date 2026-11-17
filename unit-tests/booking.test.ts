import { describe, test, expect } from 'vitest';
import { bookingSchema } from '../src/schemas/booking';

const validBooking = {
    origin_branch_id: 'branch1',
    destination_branch_id: 'branch2',

    sender_name: 'Test Sender',
    sender_phone: '9876543210',
    pickup_address: 'Matunga Mumbai',

    receiver_name: 'Test Receiver',
    receiver_phone: '9876543211',
    delivery_address: 'Shivaji Nagar Pune',
    delivery_city: 'Pune',
    delivery_pincode: '411005',

    category: 'GENERAL',
    weight_kg: '5',

    length_cm: '20',
    width_cm: '15',
    height_cm: '10',

    description: 'Sample parcel',
    special_instructions: 'Handle carefully',
    payment_method: 'DEV_SIMULATED'
};

describe('Parcel Booking', () => {

    test('Valid parcel booking', () => {
        expect(bookingSchema.safeParse(validBooking).success).toBe(true);
    });

    test.each([
        ['origin_branch_id', ''],
        ['destination_branch_id', ''],
        ['sender_name', 'A'],
        ['sender_phone', '123'],
        ['pickup_address', 'abc'],
        ['receiver_name', 'A'],
        ['receiver_phone', 'abc'],
        ['delivery_address', 'abc'],
        ['delivery_city', 'A'],
        ['delivery_pincode', '123'],
        ['category', 'INVALID'],
        ['weight_kg', '0'],
        ['weight_kg', '-5'],
        ['weight_kg', 'abc'],
        ['weight_kg', 'Infinity'],
        ['length_cm', '-10'],
        ['width_cm', '0'],
        ['height_cm', 'abc'],
        ['description', 'A'.repeat(501)],
        ['special_instructions', 'A'.repeat(501)],
        ['payment_method', 'INVALID']
    ])('Reject %s = %s', (field, value) => {
        expect(bookingSchema.safeParse({
            ...validBooking,
            [field]: value
        }).success).toBe(false);
    });

    test('Reject identical origin and destination', () => {
        expect(bookingSchema.safeParse({
            ...validBooking,
            destination_branch_id: 'branch1'
        }).success).toBe(false);
    });

    test('Accept optional empty dimensions', () => {
        expect(bookingSchema.safeParse({
            ...validBooking,
            length_cm: '',
            width_cm: '',
            height_cm: ''
        }).success).toBe(true);
    });

    test('Accept cash on pickup', () => {
        expect(bookingSchema.safeParse({
            ...validBooking,
            payment_method: 'CASH_ON_PICKUP'
        }).success).toBe(true);
    });

    test('Accept fractional weight', () => {
        expect(bookingSchema.safeParse({
            ...validBooking,
            weight_kg: '0.5'
        }).success).toBe(true);
    });

    test.each([
        'DOCUMENT',
        'GENERAL',
        'FRAGILE',
        'ELECTRONICS',
        'CLOTHING',
        'OTHER'
    ])('Accept category %s', (category) => {
        expect(bookingSchema.safeParse({
            ...validBooking,
            category
        }).success).toBe(true);
    });
});
