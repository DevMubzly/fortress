-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    plan TEXT CHECK (plan IN ('starter', 'growth', 'enterprise')),
    status TEXT CHECK (status IN ('active', 'suspended', 'cancelled')) DEFAULT 'active',
    users_count INTEGER DEFAULT 1,
    region TEXT DEFAULT 'us-east',
    renewal_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads Table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT,
    last_name TEXT,
    work_email TEXT NOT NULL,
    company_name TEXT,
    company_size TEXT,
    country TEXT,
    message TEXT,
    status TEXT CHECK (status IN ('new', 'contacted', 'qualified', 'rejected', 'archived')) DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    phone TEXT,
    role TEXT,
    sector TEXT
);

-- Licenses Table
CREATE TABLE IF NOT EXISTS licenses (
    id TEXT PRIMARY KEY,
    organization TEXT NOT NULL,
    tier TEXT,
    features TEXT[],
    max_users INTEGER,
    valid_until TIMESTAMP WITH TIME ZONE,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    raw_license TEXT,
    fingerprint TEXT
);

-- Seed Data for Organizations
INSERT INTO organizations (name, plan, status, users_count, region, renewal_date) VALUES
('Acme Corp', 'enterprise', 'active', 150, 'us-east', NOW() + INTERVAL '20 days'),
('Globex Inc', 'growth', 'active', 45, 'eu-west', NOW() + INTERVAL '45 days'),
('Soylent Corp', 'starter', 'active', 5, 'apac', NOW() + INTERVAL '120 days'),
('Umbrella Corp', 'enterprise', 'suspended', 500, 'us-east', NOW() - INTERVAL '10 days'),
('Initech', 'growth', 'active', 30, 'us-east', NOW() + INTERVAL '5 days'),
('Cyberdyne Systems', 'enterprise', 'active', 200, 'us-west', NOW() + INTERVAL '200 days');

-- Seed Data for Leads
INSERT INTO leads (first_name, last_name, work_email, company_name, country, status, message) VALUES
('John', 'Doe', 'john@example.com', 'Tech Solutions', 'USA', 'new', 'Interested in enterprise plan'),
('Jane', 'Smith', 'jane@test.com', 'Design Co', 'UK', 'contacted', 'Pricing inquiry'),
('Bob', 'Wilson', 'bob@builder.com', 'Build It', 'Canada', 'new', 'Demo request'),
('Alice', 'Wonder', 'alice@land.com', 'Wonderland', 'Germany', 'qualified', 'Ready to buy');
