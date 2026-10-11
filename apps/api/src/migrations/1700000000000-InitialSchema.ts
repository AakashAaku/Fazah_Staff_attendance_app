import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1700000000000 implements MigrationInterface {
    name = 'InitialSchema1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable pgcrypto for UUIDs and hashing
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

        // Create Tenant context function for RLS
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
            BEGIN
                RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Create tables
        await queryRunner.query(`
            CREATE TABLE "tenants" (
                "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                "name" VARCHAR NOT NULL,
                "country" VARCHAR NOT NULL,
                "default_timezone" VARCHAR DEFAULT 'UTC',
                "locale" VARCHAR DEFAULT 'en',
                "status" VARCHAR DEFAULT 'active',
                "plan" VARCHAR DEFAULT 'basic',
                "settings" JSONB DEFAULT '{}',
                "created_at" TIMESTAMPTZ DEFAULT now(),
                "updated_at" TIMESTAMPTZ DEFAULT now()
            );

            CREATE TABLE "branches" (
                "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                "tenant_id" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
                "name" VARCHAR NOT NULL,
                "address" TEXT,
                "timezone" VARCHAR,
                "lat" DECIMAL(10, 8),
                "lng" DECIMAL(11, 8),
                "geofence_radius_m" INTEGER DEFAULT 100,
                "allowed_cidrs" TEXT[],
                "status" VARCHAR DEFAULT 'active',
                "created_at" TIMESTAMPTZ DEFAULT now(),
                "updated_at" TIMESTAMPTZ DEFAULT now()
            );

            CREATE TABLE "users" (
                "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                "tenant_id" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
                "email" VARCHAR NOT NULL UNIQUE,
                "password_hash" VARCHAR NOT NULL,
                "totp_secret_enc" VARCHAR,
                "role" VARCHAR NOT NULL,
                "status" VARCHAR DEFAULT 'active',
                "last_login_at" TIMESTAMPTZ,
                "created_at" TIMESTAMPTZ DEFAULT now(),
                "updated_at" TIMESTAMPTZ DEFAULT now()
            );

            CREATE TABLE "audit_logs" (
                "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                "tenant_id" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
                "actor_user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
                "actor_type" VARCHAR NOT NULL,
                "action" VARCHAR NOT NULL,
                "entity_type" VARCHAR NOT NULL,
                "entity_id" VARCHAR NOT NULL,
                "before" JSONB,
                "after" JSONB,
                "ip" INET,
                "user_agent" TEXT,
                "prev_hash" VARCHAR,
                "hash" VARCHAR,
                "created_at" TIMESTAMPTZ DEFAULT now()
            );
        `);

        // Enable Row-Level Security
        await queryRunner.query(`ALTER TABLE "branches" ENABLE ROW LEVEL SECURITY;`);
        await queryRunner.query(`ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;`);

        // Create RLS policies
        const tables = ['branches', 'users', 'audit_logs'];
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

        // Audit log hash chain trigger
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION generate_audit_hash() RETURNS TRIGGER AS $$
            DECLARE
                last_hash VARCHAR;
            BEGIN
                SELECT hash INTO last_hash FROM audit_logs ORDER BY created_at DESC LIMIT 1;
                IF last_hash IS NULL THEN
                    last_hash := 'genesis';
                END IF;
                
                NEW.prev_hash := last_hash;
                NEW.hash := encode(digest(last_hash || NEW.created_at::text || NEW.action || NEW.entity_type || NEW.entity_id, 'sha256'), 'hex');
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER audit_hash_trigger
            BEFORE INSERT ON audit_logs
            FOR EACH ROW
            EXECUTE FUNCTION generate_audit_hash();
            
            -- Prevent updates or deletes on audit_logs
            CREATE OR REPLACE FUNCTION prevent_modify_audit() RETURNS TRIGGER AS $$
            BEGIN
                RAISE EXCEPTION 'Audit logs are append-only';
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER prevent_audit_modify
            BEFORE UPDATE OR DELETE ON audit_logs
            FOR EACH ROW
            EXECUTE FUNCTION prevent_modify_audit();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER prevent_audit_modify ON audit_logs;`);
        await queryRunner.query(`DROP FUNCTION prevent_modify_audit;`);
        await queryRunner.query(`DROP TRIGGER audit_hash_trigger ON audit_logs;`);
        await queryRunner.query(`DROP FUNCTION generate_audit_hash;`);
        
        await queryRunner.query(`DROP POLICY tenant_isolation_policy ON "audit_logs";`);
        await queryRunner.query(`DROP POLICY tenant_isolation_policy ON "users";`);
        await queryRunner.query(`DROP POLICY tenant_isolation_policy ON "branches";`);
        
        await queryRunner.query(`DROP TABLE "audit_logs";`);
        await queryRunner.query(`DROP TABLE "users";`);
        await queryRunner.query(`DROP TABLE "branches";`);
        await queryRunner.query(`DROP TABLE "tenants";`);
        
        await queryRunner.query(`DROP FUNCTION current_tenant_id;`);
    }
}
