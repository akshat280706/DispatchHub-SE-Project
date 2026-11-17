import { describe, test, expect } from 'vitest';
import { branchSchema, rateSchema } from '../src/schemas/adminConfig';

const validBranch = {
    code: 'MUM01',
    name: 'Mumbai Branch',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Matunga Mumbai',
    pincode: '400019',
    phone: '9876543210',
    is_active: true
};

describe('Branch Configuration', () => {

    test('Valid branch', () => {
        expect(branchSchema.safeParse(validBranch).success).toBe(true);
    });

    test.each([
        ['code', 'A'],
        ['name', 'A'],
        ['city', 'A'],
        ['state', 'A'],
        ['address', 'A'.repeat(301)],
        ['pincode', '123'],
        ['phone', 'abc']
    ])('Reject invalid %s', (field, value) => {
        expect(branchSchema.safeParse({
            ...validBranch,
            [field]: value
        }).success).toBe(false);
    });

    test('Accept optional empty phone and pincode', () => {
        expect(branchSchema.safeParse({
            ...validBranch,
            phone: '',
            pincode: ''
        }).success).toBe(true);
    });
});

const validRate = {
    zone: 'LOCAL',
    category: 'GENERAL',
    base_charge: '100',
    base_weight_kg: '1',
    per_kg_charge: '50',
    handling_surcharge: '20',
    is_active: true
};

describe('Rate Configuration', () => {

    test('Valid rate', () => {
        expect(rateSchema.safeParse(validRate).success).toBe(true);
    });

    test.each([
        ['zone', 'INVALID'],
        ['category', 'INVALID'],
        ['base_charge', ''],
        ['base_charge', 'abc'],
        ['base_charge', '-1'],
        ['base_charge', '100001'],
        ['base_weight_kg', 'abc'],
        ['base_weight_kg', '0'],
        ['base_weight_kg', '-1'],
        ['base_weight_kg', '1001'],
        ['per_kg_charge', '-10'],
        ['handling_surcharge', '-5']
    ])('Reject %s = %s', (field, value) => {
        expect(rateSchema.safeParse({
            ...validRate,
            [field]: value
        }).success).toBe(false);
    });

    test('Accept minimum charge', () => {
        expect(rateSchema.safeParse({
            ...validRate,
            base_charge: '0'
        }).success).toBe(true);
    });

    test('Accept maximum charge and weight', () => {
        expect(rateSchema.safeParse({
            ...validRate,
            base_charge: '100000',
            base_weight_kg: '1000'
        }).success).toBe(true);
    });

    test.each(['LOCAL', 'REGIONAL', 'NATIONAL'])(
        'Accept valid zone %s', (zone) => {
            expect(rateSchema.safeParse({
                ...validRate,
                zone
            }).success).toBe(true);
        }
    );
});
