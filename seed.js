const { Client } = require('pg');
const { randomBytes } = require('crypto');
const { argon2id } = require('hash-wasm');
const path = require('path');
const fs = require('fs');

// Automatically load .env from project root or apps/api/.env
try {
  require('dotenv').config();
  if (!process.env.DATABASE_URL && fs.existsSync(path.join(__dirname, 'apps', 'api', '.env'))) {
    require('dotenv').config({ path: path.join(__dirname, 'apps', 'api', '.env') });
  }
} catch (_) {}

async function seed() {
  const databaseUrl = 
    process.env.DATABASE_URL || 
    process.env.NEON_DATABASE_URL || 
    process.env.NETLIFY_NEON_DATABASE_URL ||
    process.env.POSTGRES_URL;
  const isSsl = 
    process.env.DB_SSL === 'true' || 
    (databaseUrl && !databaseUrl.includes('localhost'));

  const clientConfig = databaseUrl
    ? {
        connectionString: databaseUrl,
        ssl: isSsl ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USERNAME || 'garage',
        password: process.env.DB_PASSWORD || 'i@m@PG',
        database: process.env.DB_DATABASE || 'garageclock',
        ssl: isSsl ? { rejectUnauthorized: false } : false,
      };

  console.log(`Connecting to database at ${databaseUrl ? 'DATABASE_URL' : `${clientConfig.host}:${clientConfig.port}/${clientConfig.database}`}...`);
  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL successfully!');

    const TENANT_ID = '11111111-1111-1111-1111-111111111111';
    const BRANCH_ID = '22222222-2222-2222-2222-222222222222';

    // 1. Insert Tenant
    await client.query(`
      INSERT INTO tenants (id, name, "created_at", "updated_at", country)
      VALUES ($1, 'FAZAH Auto Garage', NOW(), NOW(), 'AE')
      ON CONFLICT (id) DO UPDATE SET name = 'FAZAH Auto Garage';
    `, [TENANT_ID]);
    console.log('✅ Tenant seeded: FAZAH Auto Garage');

    // 2. Insert Branch
    await client.query(`
      INSERT INTO branches (id, tenant_id, name, "timezone", "created_at", "updated_at")
      VALUES ($1, $2, 'Main Workshop Bay', 'Asia/Dubai', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name = 'Main Workshop Bay';
    `, [BRANCH_ID, TENANT_ID]);
    console.log('✅ Branch seeded: Main Workshop Bay (Asia/Dubai)');

    // 3. Helper to hash password/PIN with Argon2id
    async function hashSecret(secret) {
      return await argon2id({
        password: secret,
        salt: randomBytes(16),
        parallelism: 1,
        iterations: 3,
        memorySize: 4096,
        hashLength: 32,
        outputType: 'encoded'
      });
    }

    const defaultAdminHash = await hashSecret('admin123');
    const defaultPinHash = await hashSecret('123456');

    // 4. Seed Admin Users
    const adminEmails = ['admin@fazahgarage.com', 'admin@garage.com'];
    for (const email of adminEmails) {
      const resUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (resUser.rows.length === 0) {
        await client.query(`
          INSERT INTO users (id, tenant_id, email, password_hash, role, status, "created_at", "updated_at")
          VALUES (gen_random_uuid(), $1, $2, $3, 'admin', 'active', NOW(), NOW())
        `, [TENANT_ID, email, defaultAdminHash]);
        console.log(`✅ Admin user created: ${email} (Password: admin123)`);
      } else {
        await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [defaultAdminHash, resUser.rows[0].id]);
        console.log(`ℹ️ Admin user updated: ${email}`);
      }
    }

    // 5. Seed Employees & Credentials
    const staffList = [
      { code: 'ADMIN01', name: 'Admin Supervisor', role: 'Workshop Manager', email: 'admin@fazahgarage.com' },
      { code: 'MCH01', name: 'Ahmed Ali', role: 'Senior Mechanic', email: 'ahmed@fazahgarage.com' },
      { code: 'ELE01', name: 'Tariq Mahmoud', role: 'Auto Electrician', email: 'tariq@fazahgarage.com' },
      { code: 'DNP01', name: 'Rajesh Kumar', role: 'Denting & Painting', email: 'rajesh@fazahgarage.com' },
      { code: 'ADV01', name: 'Sara Khan', role: 'Service Advisor', email: 'sara@fazahgarage.com' },
      { code: 'MGR01', name: 'Fatima Nasser', role: 'Workshop Manager', email: 'fatima@fazahgarage.com' },
    ];

    const employeeMap = {};

    for (const staff of staffList) {
      let empId;
      const resEmp = await client.query('SELECT id FROM employees WHERE employee_code = $1', [staff.code]);
      if (resEmp.rows.length === 0) {
        const empInsert = await client.query(`
          INSERT INTO employees (id, tenant_id, branch_id, employee_code, full_name, status, job_title, email, "created_at", "updated_at")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, 'active', $5, $6, NOW(), NOW())
          RETURNING id;
        `, [TENANT_ID, BRANCH_ID, staff.code, staff.name, staff.role, staff.email]);
        empId = empInsert.rows[0].id;

        await client.query(`
          INSERT INTO employee_credentials (employee_id, pin_hash, failed_attempts, must_reset, "created_at", "updated_at")
          VALUES ($1, $2, 0, false, NOW(), NOW())
        `, [empId, defaultPinHash]);
        console.log(`✅ Created Employee: ${staff.code} - ${staff.name} (${staff.role}) [PIN: 123456]`);
      } else {
        empId = resEmp.rows[0].id;
        await client.query(`
          UPDATE employees SET full_name = $1, job_title = $2 WHERE id = $3
        `, [staff.name, staff.role, empId]);
        await client.query(`
          UPDATE employee_credentials SET pin_hash = $1 WHERE employee_id = $2
        `, [defaultPinHash, empId]);
        console.log(`ℹ️ Updated Employee: ${staff.code} - ${staff.name} [PIN: 123456]`);
      }
      employeeMap[staff.code] = empId;
    }

    // 6. Seed Shifts & Policies
    const resPolicy = await client.query('SELECT id FROM policies WHERE tenant_id = $1 LIMIT 1', [TENANT_ID]);
    if (resPolicy.rows.length === 0) {
      await client.query(`
        INSERT INTO policies (tenant_id, scope, grace_minutes, late_threshold_min, overtime_daily_hours, max_daily_hours)
        VALUES ($1, 'tenant', 10, 15, 9, 14)
      `, [TENANT_ID]);
      console.log('✅ Seeded Attendance Policy: 10m Grace, 9h Overtime');
    }

    let shiftId;
    const resShift = await client.query('SELECT id FROM shifts WHERE tenant_id = $1 LIMIT 1', [TENANT_ID]);
    if (resShift.rows.length === 0) {
      const shiftInsert = await client.query(`
        INSERT INTO shifts (tenant_id, name, start_time, end_time, break_minutes, grace_minutes)
        VALUES ($1, 'Standard Garage Shift', '09:00:00', '21:00:00', 60, 10)
        RETURNING id;
      `, [TENANT_ID]);
      shiftId = shiftInsert.rows[0].id;
      console.log('✅ Seeded Standard Shift: 09:00 - 21:00');
    } else {
      shiftId = resShift.rows[0].id;
    }

    // Shift assignments
    const allEmps = await client.query('SELECT id FROM employees WHERE tenant_id = $1', [TENANT_ID]);
    for (const emp of allEmps.rows) {
      const resAssign = await client.query('SELECT id FROM shift_assignments WHERE employee_id = $1', [emp.id]);
      if (resAssign.rows.length === 0) {
        await client.query(`
          INSERT INTO shift_assignments (tenant_id, employee_id, shift_id, valid_from, weekdays)
          VALUES ($1, $2, $3, '2022-01-01', '{0,1,2,3,4,5,6}')
        `, [TENANT_ID, emp.id, shiftId]);
      }
    }
    console.log('✅ Shift assignments configured for all technicians.');

    // 7. Seed Inventory Parts Stock
    const partsList = [
      { partNumber: 'ENG-OIL-5W30', name: 'Castrol Edge 5W30 Synthetic Oil (1L)', qty: 120, unitPrice: 45, cost: 30, category: 'Fluids' },
      { partNumber: 'OIL-FLT-TY', name: 'Genuine Toyota OEM Oil Filter', qty: 45, unitPrice: 35, cost: 20, category: 'Filters' },
      { partNumber: 'BRK-PAD-FR', name: 'Ceramic Front Brake Pads Set', qty: 18, unitPrice: 180, cost: 110, category: 'Brakes' },
      { partNumber: 'AC-GAS-R134', name: 'R134a AC Refrigerant Gas Canister', qty: 30, unitPrice: 85, cost: 45, category: 'AC & Cooling' },
      { partNumber: 'SPK-PLG-IR', name: 'NGK Iridium Spark Plugs Set of 4', qty: 25, unitPrice: 140, cost: 80, category: 'Ignition' },
    ];

    for (const part of partsList) {
      const resPart = await client.query('SELECT id FROM inventory_parts WHERE part_number = $1', [part.partNumber]);
      if (resPart.rows.length === 0) {
        await client.query(`
          INSERT INTO inventory_parts (id, part_number, name, category, stock_quantity, unit_price, cost_price, minimum_stock, location, "created_at", "updated_at")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 5, 'Bay Shelf A1', NOW(), NOW())
        `, [part.partNumber, part.name, part.category, part.qty, part.unitPrice, part.cost]);
      }
    }
    console.log('✅ Seeded 5 common inventory stock parts.');

    // 8. Seed Labor Catalog
    const laborsList = [
      { code: 'LBR-OIL', name: 'Engine Oil & Filter Service', section: 'Mechanical', hours: 1.0, rate: 120 },
      { code: 'LBR-BRK', name: 'Front Brake Pads Replacement', section: 'Mechanical', hours: 1.5, rate: 120 },
      { code: 'LBR-AC', name: 'Full AC System Evac & Recharge', section: 'Electrical', hours: 2.0, rate: 150 },
      { code: 'LBR-DNP', name: 'Front Bumper Scratch & Dent Repair', section: 'Denting & Painting', hours: 3.5, rate: 140 },
      { code: 'LBR-DIAG', name: 'OBD-II Computer Diagnostic & Reset', section: 'Electrical', hours: 0.8, rate: 150 },
    ];

    for (const lbr of laborsList) {
      const resLbr = await client.query('SELECT id FROM labor_catalog WHERE code = $1', [lbr.code]);
      if (resLbr.rows.length === 0) {
        await client.query(`
          INSERT INTO labor_catalog (id, code, name, section, estimated_hours, hourly_rate, "created_at", "updated_at")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
        `, [lbr.code, lbr.name, lbr.section, lbr.hours, lbr.rate]);
      }
    }
    console.log('✅ Seeded 5 standard labor catalog operations.');

    // 9. Seed Sample Job Cards
    const jobCardsList = [
      {
        number: 'JC-1001',
        customer: 'Mohammed Al Mansoori',
        phone: '+971 50 123 4567',
        plate: 'DXB-A-78219',
        make: 'Toyota',
        model: 'Land Cruiser 4.0L V6',
        year: '2022',
        mileage: 68500,
        section: 'Mechanical',
        status: 'IN_PROGRESS',
        mechanicId: employeeMap['MCH01'],
        complaints: '10,000 km periodic service, front brake squeal upon braking',
      },
      {
        number: 'JC-1002',
        customer: 'Sultan Al Nuaimi',
        phone: '+971 55 987 6543',
        plate: 'SHJ-B-14902',
        make: 'Nissan',
        model: 'Patrol Titanium 5.6L V8',
        year: '2021',
        mileage: 92000,
        section: 'Electrical',
        status: 'RECEIVED',
        mechanicId: employeeMap['ELE01'],
        complaints: 'AC blowing lukewarm air during midday traffic, check compressor',
      },
      {
        number: 'JC-1003',
        customer: 'Rashid Al Ketbi',
        phone: '+971 52 444 8899',
        plate: 'DXB-K-55210',
        make: 'Lexus',
        model: 'LX570 Luxury',
        year: '2020',
        mileage: 45000,
        section: 'Denting & Painting',
        status: 'COMPLETED',
        mechanicId: employeeMap['DNP01'],
        complaints: 'Minor parking scrape on right passenger door & rear arch paint blend',
      },
    ];

    for (const jc of jobCardsList) {
      const resJc = await client.query('SELECT id FROM job_cards WHERE job_number = $1', [jc.number]);
      if (resJc.rows.length === 0) {
        await client.query(`
          INSERT INTO job_cards (
            id, job_number, tenant_id, branch_id, customer_name, customer_phone,
            vehicle_plate_number, vehicle_make, vehicle_model, vehicle_year, mileage,
            fuel_level, complaints, status, assigned_section, assigned_mechanic_id,
            "created_at", "updated_at"
          )
          VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            'half', $11, $12, $13, $14,
            NOW(), NOW()
          )
        `, [
          jc.number, TENANT_ID, BRANCH_ID, jc.customer, jc.phone,
          jc.plate, jc.make, jc.model, jc.year, jc.mileage,
          jc.complaints, jc.status, jc.section, jc.mechanicId
        ]);
        console.log(`✅ Seeded Job Card: ${jc.number} - ${jc.make} ${jc.model} (${jc.plate})`);
      }
    }

    console.log('\n======================================================');
    console.log('🎉 FAZAH AUTO GARAGE DATABASE SEEDING COMPLETED!');
    console.log('======================================================');
    console.log('📌 ADMIN DASHBOARD LOGIN:');
    console.log('   Email:    admin@fazahgarage.com (or admin@garage.com)');
    console.log('   Password: admin123');
    console.log('\n📌 STAFF PORTAL LOGIN:');
    console.log('   MCH01 (Ahmed Ali - Senior Mechanic)       PIN: 123456');
    console.log('   ELE01 (Tariq Mahmoud - Auto Electrician)  PIN: 123456');
    console.log('   DNP01 (Rajesh Kumar - Denting & Paint)    PIN: 123456');
    console.log('   ADV01 (Sara Khan - Service Advisor)       PIN: 123456');
    console.log('   MGR01 (Fatima Nasser - Manager)           PIN: 123456');
    console.log('\n📌 ENTRANCE KIOSK:');
    console.log('   Select any staff profile on screen and punch PIN: 123456');
    console.log('======================================================\n');

  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
