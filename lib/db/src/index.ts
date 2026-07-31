import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import { Pool } from 'pg';
import path from 'path';
import * as schema from './schema/index';

let dbInstance: any;
let isPglite = false;

const connectionString = process.env.DATABASE_URL || 'postgresql://nestpro:nestpro123@localhost:5432/nestpro';

try {
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 2000,
  });
  dbInstance = drizzlePg(pool, { schema });
} catch (_e) {
  isPglite = true;
  const pglite = new PGlite(path.join(process.cwd(), '.nestpro_pglite'));
  dbInstance = drizzlePglite(pglite, { schema });
}

export const db = dbInstance;
export * from './schema/index';

export async function ensureTablesExist() {
  try {
    // Create enums
    await db.execute(`
      DO $$ BEGIN
        CREATE TYPE property_type AS ENUM ('pg', 'hostel', 'apartment', 'villa', 'co_living');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE room_type AS ENUM ('single', 'double', 'triple', 'quad', 'dormitory');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE bed_status AS ENUM ('available', 'occupied', 'maintenance', 'reserved');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE guest_status AS ENUM ('active', 'checked_out');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'overdue', 'partial');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE payment_method AS ENUM ('cash', 'upi', 'bank_transfer', 'cheque');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE complaint_category AS ENUM ('maintenance', 'cleanliness', 'noise', 'security', 'food', 'internet', 'other');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE complaint_status AS ENUM ('pending', 'assigned', 'in_progress', 'resolved', 'closed');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high', 'urgent');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE staff_role AS ENUM ('owner', 'manager', 'operator');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE checkin_token_status AS ENUM ('pending', 'submitted', 'approved', 'rejected');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        city TEXT,
        state TEXT,
        type property_type NOT NULL DEFAULT 'pg',
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS buildings (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        total_floors INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS floors (
        id SERIAL PRIMARY KEY,
        building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        floor_number INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        floor_id INTEGER NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type room_type NOT NULL DEFAULT 'single',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS beds (
        id SERIAL PRIMARY KEY,
        room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        label TEXT NOT NULL,
        status bed_status NOT NULL DEFAULT 'available',
        monthly_rent NUMERIC(10, 2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS guests (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        aadhaar TEXT,
        emergency_contact TEXT,
        emergency_phone TEXT,
        occupation TEXT,
        hometown TEXT,
        bed_id INTEGER REFERENCES beds(id),
        property_id INTEGER REFERENCES properties(id),
        check_in_date DATE,
        check_out_date DATE,
        status guest_status NOT NULL DEFAULT 'active',
        monthly_rent NUMERIC(10, 2) DEFAULT 0,
        deposit_amount NUMERIC(10, 2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        guest_id INTEGER NOT NULL REFERENCES guests(id),
        property_id INTEGER REFERENCES properties(id),
        amount NUMERIC(10, 2) NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        status payment_status NOT NULL DEFAULT 'pending',
        paid_at TIMESTAMPTZ,
        method payment_method,
        upi_ref TEXT,
        discount NUMERIC(10, 2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        guest_id INTEGER REFERENCES guests(id),
        property_id INTEGER REFERENCES properties(id),
        title TEXT NOT NULL,
        description TEXT,
        category complaint_category NOT NULL DEFAULT 'other',
        status complaint_status NOT NULL DEFAULT 'pending',
        priority complaint_priority NOT NULL DEFAULT 'medium',
        assigned_to INTEGER,
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS staff (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        role staff_role NOT NULL DEFAULT 'operator',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id INTEGER,
        description TEXT NOT NULL,
        property_id INTEGER,
        property_name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS checkin_tokens (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        bed_id INTEGER REFERENCES beds(id),
        status checkin_token_status NOT NULL DEFAULT 'pending',
        submitted_data JSONB,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL
      );
    `);
  } catch (e) {
    // Best-effort schema init
  }
}
