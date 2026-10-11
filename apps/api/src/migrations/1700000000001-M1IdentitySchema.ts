import { MigrationInterface, QueryRunner } from "typeorm";

export class M1IdentitySchema1700000000001 implements MigrationInterface {
    name = 'M1IdentitySchema1700000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "employees" (
                "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                "tenant_id" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
                "branch_id" UUID NOT NULL REFERENCES "branches"("id") ON DELETE RESTRICT,
                "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
                "employee_code" VARCHAR NOT NULL,
                "full_name" VARCHAR NOT NULL,
                "job_title" VARCHAR NOT NULL,
                "phone" VARCHAR,
                "email" VARCHAR,
                "hire_date" DATE,
                "status" VARCHAR DEFAULT 'active',
                "profile_photo_key" VARCHAR,
                "photo_consent_at" TIMESTAMPTZ,
                "supervisor_id" UUID REFERENCES "employees"("id") ON DELETE SET NULL,
                "created_at" TIMESTAMPTZ DEFAULT now(),
                "updated_at" TIMESTAMPTZ DEFAULT now(),
                UNIQUE("tenant_id", "employee_code")
            );

            CREATE TABLE "employee_credentials" (
                "employee_id" UUID PRIMARY KEY REFERENCES "employees"("id") ON DELETE CASCADE,
                "pin_hash" VARCHAR NOT NULL,
                "pin_set_at" TIMESTAMPTZ,
                "failed_attempts" INTEGER DEFAULT 0,
                "locked_until" TIMESTAMPTZ,
                "must_reset" BOOLEAN DEFAULT true,
                "created_at" TIMESTAMPTZ DEFAULT now(),
                "updated_at" TIMESTAMPTZ DEFAULT now()
            );

            CREATE TABLE "devices" (
                "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                "tenant_id" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
                "branch_id" UUID NOT NULL REFERENCES "branches"("id") ON DELETE RESTRICT,
                "type" VARCHAR NOT NULL,
                "employee_id" UUID REFERENCES "employees"("id") ON DELETE CASCADE,
                "name" VARCHAR NOT NULL,
                "public_key" TEXT,
                "credential_hash" VARCHAR NOT NULL,
                "status" VARCHAR DEFAULT 'pending',
                "last_seen_at" TIMESTAMPTZ,
                "last_ip" INET,
                "approved_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
                "approved_at" TIMESTAMPTZ,
                "created_at" TIMESTAMPTZ DEFAULT now(),
                "updated_at" TIMESTAMPTZ DEFAULT now()
            );
        `);

        // Enable Row-Level Security
        await queryRunner.query(`ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;`);
        await queryRunner.query(`ALTER TABLE "devices" ENABLE ROW LEVEL SECURITY;`);

        // Create RLS policies
        const tables = ['employees', 'devices'];
        for (const table of tables) {
            await queryRunner.query(`
                CREATE POLICY tenant_isolation_policy ON "${table}"
                AS PERMISSIVE
                FOR ALL
                TO PUBLIC
                USING (tenant_id = current_tenant_id() OR current_setting('app.bypass_rls', true) = 'on')
                WITH CHECK (tenant_id = current_tenant_id() OR current_setting('app.bypass_rls', true) = 'on');
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP POLICY tenant_isolation_policy ON "devices";`);
        await queryRunner.query(`DROP POLICY tenant_isolation_policy ON "employees";`);
        
        await queryRunner.query(`DROP TABLE "devices";`);
        await queryRunner.query(`DROP TABLE "employee_credentials";`);
        await queryRunner.query(`DROP TABLE "employees";`);
    }
}
