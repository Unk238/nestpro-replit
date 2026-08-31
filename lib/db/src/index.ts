import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';
import * as schema from './schema/index';

let dbInstance: any;
let isPgliteMode = true;

// Create data directory for persistent local database
const dataDir = path.resolve(process.cwd(), '.rentaq_pglite');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In local mode, PGlite provides a persistent zero-configuration Postgres engine
const pglite = new PGlite(dataDir);
dbInstance = drizzlePglite(pglite, { schema });

export const db = dbInstance;
export * from './schema/index';

export async function ensureTablesExist() {
  try {
    await db.execute(`
      DO $$ BEGIN
        CREATE TYPE property_type AS ENUM ('pg', 'hostel', 'hotel', 'villa', 'apartment', 'kothi', 'shop', 'office', 'library', 'co_living', 'other');
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
        CREATE TYPE staff_role AS ENUM ('owner', 'manager', 'landlord', 'operations_manager', 'receptionist', 'staff', 'broker', 'admin');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE checkin_token_status AS ENUM ('pending', 'submitted', 'approved', 'rejected');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE booking_source AS ENUM ('direct', 'booking_com', 'airbnb', 'agoda', 'makemytrip', 'expedia', 'yatra', 'phone', 'other');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE booking_status AS ENUM ('confirmed', 'in_review', 'checked_in', 'extended', 'checked_out', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE utility_type AS ENUM ('electricity', 'water', 'internet', 'generator', 'gas', 'other');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE split_method AS ENUM ('equal', 'per_room', 'per_bed', 'by_days', 'custom');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        city TEXT,
        state TEXT,
        pincode TEXT,
        type property_type NOT NULL DEFAULT 'pg',
        description TEXT,
        amenities TEXT,
        rules TEXT,
        wifi_ssid TEXT,
        wifi_password TEXT,
        upi_id TEXT,
        contact_phone TEXT,
        contact_email TEXT,
        website_slug TEXT,
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
        property_id INTEGER REFERENCES properties(id),
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        role staff_role NOT NULL DEFAULT 'staff',
        permissions TEXT,
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

      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        room_id INTEGER REFERENCES rooms(id),
        guest_id INTEGER REFERENCES guests(id),
        guest_name TEXT NOT NULL,
        guest_phone TEXT,
        guest_email TEXT,
        source booking_source NOT NULL DEFAULT 'direct',
        external_booking_id TEXT,
        check_in_date DATE NOT NULL,
        check_out_date DATE NOT NULL,
        status booking_status NOT NULL DEFAULT 'confirmed',
        gross_amount NUMERIC(10, 2) NOT NULL,
        platform_fee NUMERIC(10, 2) DEFAULT 0,
        net_receivable NUMERIC(10, 2) NOT NULL,
        amount_received NUMERIC(10, 2) DEFAULT 0,
        settlement_status TEXT DEFAULT 'pending',
        is_extension TEXT DEFAULT 'no',
        original_booking_id INTEGER,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS utility_meters (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        meter_number TEXT NOT NULL,
        label TEXT NOT NULL,
        type utility_type NOT NULL DEFAULT 'electricity',
        unit_rate NUMERIC(10, 2) DEFAULT 9.50,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS utility_bills (
        id SERIAL PRIMARY KEY,
        meter_id INTEGER NOT NULL REFERENCES utility_meters(id) ON DELETE CASCADE,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        billing_month INTEGER NOT NULL,
        billing_year INTEGER NOT NULL,
        previous_reading NUMERIC(10, 2) NOT NULL,
        current_reading NUMERIC(10, 2) NOT NULL,
        units_consumed NUMERIC(10, 2) NOT NULL,
        total_amount NUMERIC(10, 2) NOT NULL,
        split_method split_method NOT NULL DEFAULT 'equal',
        status TEXT DEFAULT 'calculated',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  } catch (e) {
    // Best-effort DDL initialization
  }
}
