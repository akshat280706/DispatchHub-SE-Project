-- =====================================================================
-- DispatchHub seed: settings, branches, shipping rates (fictional data)
-- Safe to run more than once.
-- =====================================================================

insert into system_settings (key, value, description, is_public) values
  ('tax.gst_percent',               '18',  'GST percentage applied to the shipping charge', true),
  ('booking.max_weight_kg',         '50',  'Maximum parcel weight in kg', true),
  ('delivery.estimate_days.LOCAL',    '2', 'Estimated delivery days, same city', true),
  ('delivery.estimate_days.REGIONAL', '4', 'Estimated delivery days, same state', true),
  ('delivery.estimate_days.NATIONAL', '7', 'Estimated delivery days, other states', true),
  ('delivery.require_photo',        'true','Require a photo proof to complete delivery', false),
  ('delivery.otp_expiry_hours',     '24',  'OTP validity in hours', false),
  ('delivery.otp_max_attempts',     '5',   'Maximum wrong OTP attempts', false),
  ('dev.show_delivery_otp',         'true','DEVELOPMENT ONLY: show the delivery OTP to the customer. Turn off in production.', false),
  ('contact.email',   '"support@dispatchhub.example"', 'Public contact email (edit me)', true),
  ('contact.phone',   '"+91 00000 00000"',             'Public contact phone (edit me)', true),
  ('contact.address', '"DispatchHub Demo Office, Mumbai, Maharashtra"', 'Public contact address (edit me)', true)
on conflict (key) do nothing;

insert into branches (code, name, city, state, address, pincode, phone) values
  ('MUM01', 'Mumbai Central Hub',  'Mumbai',    'Maharashtra', 'Demo Street 1, Mumbai Central', '400008', '+91 00000 00001'),
  ('MUM02', 'Andheri Branch',      'Mumbai',    'Maharashtra', 'Demo Street 2, Andheri West',  '400053', '+91 00000 00002'),
  ('PUN01', 'Pune Hub',            'Pune',      'Maharashtra', 'Demo Street 3, Shivajinagar',  '411005', '+91 00000 00003'),
  ('DEL01', 'Delhi Hub',           'Delhi',     'Delhi',       'Demo Street 4, Connaught Place','110001', '+91 00000 00004'),
  ('BLR01', 'Bengaluru Hub',       'Bengaluru', 'Karnataka',   'Demo Street 5, MG Road',       '560001', '+91 00000 00005'),
  ('AMD01', 'Ahmedabad Hub',       'Ahmedabad', 'Gujarat',     'Demo Street 6, Navrangpura',   '380009', '+91 00000 00006')
on conflict (code) do nothing;

insert into shipping_rates (zone, category, base_charge, base_weight_kg, per_kg_charge, handling_surcharge)
select z.zone, c.category, z.base_charge, 1.00, z.per_kg, c.surcharge
from (values
        ('LOCAL'::rate_zone,    40.00, 15.00),
        ('REGIONAL',            70.00, 25.00),
        ('NATIONAL',           110.00, 40.00)
     ) as z(zone, base_charge, per_kg)
cross join (values
        ('DOCUMENT'::parcel_category,  0.00),
        ('GENERAL',                    0.00),
        ('FRAGILE',                   30.00),
        ('ELECTRONICS',               40.00),
        ('CLOTHING',                   0.00),
        ('OTHER',                     10.00)
     ) as c(category, surcharge)
on conflict (zone, category) where is_active do nothing;