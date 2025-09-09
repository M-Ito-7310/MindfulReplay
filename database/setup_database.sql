-- MindfulReplay Database Setup Script

-- Create database if it doesn't exist
-- Note: This needs to be run as superuser (postgres)

-- First, check if database exists and create if not
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mindful_replay') THEN
        PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE mindful_replay');
    END IF;
END $$;

-- Connect to the mindful_replay database for the rest of the setup
\c mindful_replay;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Verify connection
SELECT current_database(), current_user, now() as setup_time;