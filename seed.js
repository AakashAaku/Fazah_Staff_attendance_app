const { Client } = require('pg');
const { randomBytes } = require('crypto');
// We won't hash the PIN perfectly for seed, we'll just insert something that might fail verification or we can just use simple argon2id if we have hash-wasm.
// Actually we can just require hash-wasm.
const { argon2id } = require('hash-wasm');

async function seed() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'garage',
    password: 'i@m@PG',
    database: 'garageclock',
  });

  await client.connect();

  console.log('Seeding initial data...');

  // Hardcoded UUIDs for dev seed
  const TENANT_ID = '11111111-1111-1111-1111-111111111111';
  const BRANCH_ID = '22222222-2222-2222-2222-222222222222';

  // 1. Insert Tenant
  await client.query(`
    INSERT INTO tenants (id, name, "created_at", "updated_at", country)
    VALUES ('${TENANT_ID}', 'Default Garage', NOW(), NOW(), 'AE')
    ON CONFLICT (id) DO NOTHING;
  `);

  // 2. Insert Branch
  await client.query(`
    INSERT INTO branches (id, tenant_id, name, "timezone", "created_at", "updated_at")
    VALUES ('${BRANCH_ID}', '${TENANT_ID}', 'Main Branch', 'Asia/Dubai', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  `);

  // 3. Create a default employee if none exists
  const resEmp = await client.query(`SELECT id FROM employees WHERE employee_code = 'ADMIN01'`);
  if (resEmp.rows.length === 0) {
    const empInsert = await client.query(`
      INSERT INTO employees (id, tenant_id, branch_id, employee_code, full_name, status, "created_at", "updated_at", job_title)
      VALUES (gen_random_uuid(), '${TENANT_ID}', '${BRANCH_ID}', 'ADMIN01', 'Admin User', 'active', NOW(), NOW(), 'Admin')
      RETURNING id;
    `);
    const empId = empInsert.rows[0].id;

    // Hash PIN '123456'
    const salt = randomBytes(16);
    const pinHash = await argon2id({
      password: '123456',
      salt: salt,
      parallelism: 1,
      iterations: 3,
      memorySize: 4096,
      hashLength: 32,
      outputType: 'encoded'
    });

    await client.query(`
      INSERT INTO employee_credentials (employee_id, pin_hash, failed_attempts, "created_at", "updated_at", must_reset)
      VALUES ($1, $2, 0, NOW(), NOW(), false)
    `, [empId, pinHash]);

    console.log('Created default employee: ADMIN01 with PIN: 123456');
  } else {
    console.log('Admin employee already exists.');
  }

  // 4. Create a default User for Admin Dashboard login
  const resUser = await client.query(`SELECT id FROM users WHERE email = 'admin@garage.com'`);
  if (resUser.rows.length === 0) {
    // Hash password 'admin123'
    const passwordHash = await argon2id({
      password: 'admin123',
      salt: randomBytes(16),
      parallelism: 1,
      iterations: 3,
      memorySize: 4096,
      hashLength: 32,
      outputType: 'encoded'
    });

    await client.query(`
      INSERT INTO users (id, tenant_id, email, password_hash, role, status, "created_at", "updated_at")
      VALUES (gen_random_uuid(), '${TENANT_ID}', 'admin@garage.com', $1, 'admin', 'active', NOW(), NOW())
    `, [passwordHash]);

    console.log('Created default admin user: admin@garage.com with password: admin123');
  } else {
    console.log('Admin user already exists.');
  }

  console.log('Seeding complete.');
  await client.end();
}

seed().catch(console.error);
