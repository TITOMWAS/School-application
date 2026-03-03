INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
VALUES (
    'admin@school.com',
    '$2b$10$oiSqguckQwtDFrK1ALOz1ejMZORrx.STOhbsVmlezziGeaSmtjrtu',
    'admin',
    'System',
    'Administrator',
    '+254700000000'
)
ON CONFLICT (email) DO NOTHING;

