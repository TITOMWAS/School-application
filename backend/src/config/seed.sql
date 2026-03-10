INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
VALUES (
    'admin@school.com',
    '$2b$10$v/pAXTgExHAZpA7SxZm.JuggFbsfYx2c3P5czPYGbTmknDi7lNkJq',
    'admin',
    'System',
    'Administrator',
    '+254700000000'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO academic_years (name, start_date, end_date, is_active, is_current)
VALUES ('2024', '2024-01-01', '2024-12-31', true, true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
VALUES (
    'student@school.com',
    '$2b$10$v/pAXTgExHAZpA7SxZm.JuggFbsfYx2c3P5czPYGbTmknDi7lNkJq',
    'student',
    'John',
    'Doe',
    '+254700000001'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO student_records (student_id, admission_number, date_of_birth, gender)
SELECT id, 'ADM001', '2010-01-01', 'male'
FROM users WHERE email = 'student@school.com'
ON CONFLICT DO NOTHING;

INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
VALUES (
    'parent@school.com',
    '$2b$10$v/pAXTgExHAZpA7SxZm.JuggFbsfYx2c3P5czPYGbTmknDi7lNkJq',
    'parent',
    'Jane',
    'Doe',
    '+254700000002'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO parent_student_links (parent_id, student_id, relationship, is_primary)
SELECT p.id, s.id, 'parent', true
FROM users p, users s
WHERE p.email = 'parent@school.com' AND s.email = 'student@school.com'
ON CONFLICT DO NOTHING;

INSERT INTO fee_structures (name, description, academic_year_id, amount, category, is_active)
SELECT 'Tuition Fee', 'Term 1 Tuition Fee', id, 50000.00, 'tuition', true
FROM academic_years WHERE name = '2024'
ON CONFLICT DO NOTHING;

INSERT INTO student_fees (student_id, fee_structure_id, academic_year_id, amount, paid_amount, balance, status)
SELECT 
    s.id,
    f.id,
    ay.id,
    f.amount,
    0,
    f.amount - 0,
    'unpaid'
FROM users s, fee_structures f, academic_years ay
WHERE s.email = 'student@school.com' 
    AND f.name = 'Tuition Fee'
    AND ay.name = '2024'
ON CONFLICT DO NOTHING;

