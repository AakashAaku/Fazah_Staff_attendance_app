const { Client } = require('pg');

async function seedTimeEngine() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'garage',
    password: 'i@m@PG',
    database: 'garageclock',
  });

  try {
    await client.connect();

    console.log('Fetching tenant and employees...');
    const tenants = await client.query('SELECT id FROM tenants LIMIT 1');
    if (tenants.rows.length === 0) {
      console.log('No tenant found. Run seed.js first.');
      return;
    }
    const tenantId = tenants.rows[0].id;

    const employees = await client.query('SELECT id FROM employees');

    console.log('Seeding Policies...');
    await client.query(`
      INSERT INTO policies (tenant_id, scope, grace_minutes, late_threshold_min, overtime_daily_hours, max_daily_hours)
      VALUES ($1, 'tenant', 10, 15, 9, 14)
    `, [tenantId]);

    console.log('Seeding Shifts...');
    const shiftResult = await client.query(`
      INSERT INTO shifts (tenant_id, name, start_time, end_time, break_minutes, grace_minutes)
      VALUES ($1, 'Standard Shift', '09:00:00', '21:00:00', 60, 10)
      RETURNING id
    `, [tenantId]);
    const shiftId = shiftResult.rows[0].id;

    console.log('Seeding Shift Assignments...');
    for (const emp of employees.rows) {
      await client.query(`
        INSERT INTO shift_assignments (tenant_id, employee_id, shift_id, valid_from, weekdays)
        VALUES ($1, $2, $3, '2020-01-01', '{0,1,2,3,4,5,6}')
      `, [tenantId, emp.id, shiftId]);
    }

    console.log('Time Engine seed complete!');
  } catch (error) {
    console.error('Seeding failed', error);
  } finally {
    await client.end();
  }
}

seedTimeEngine();
