// Must run before any module that imports env.ts
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
process.env.JWT_SECRET = 'super-secret-test-key-minimum-32-characters'
process.env.NODE_ENV = 'test'
