// Database Connection Test Script
require('dotenv').config();

const knex = require('knex')({
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'mindful_replay'
  },
  pool: {
    min: 2,
    max: 10
  }
});

async function testConnection() {
  try {
    console.log('Testing PostgreSQL connection...');
    console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`Port: ${process.env.DB_PORT || 5432}`);
    console.log(`User: ${process.env.DB_USER || 'postgres'}`);
    console.log(`Database: ${process.env.DB_NAME || 'mindful_replay'}`);
    
    // Test basic connection
    const result = await knex.raw('SELECT version(), current_database(), current_user');
    console.log('✅ Connection successful!');
    console.log('PostgreSQL Version:', result.rows[0].version);
    console.log('Current Database:', result.rows[0].current_database);
    console.log('Current User:', result.rows[0].current_user);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error Code:', error.code);
    
    if (error.code === '3D000') {
      console.log('\n📝 Database does not exist. Need to create "mindful_replay" database first.');
    } else if (error.code === '28P01') {
      console.log('\n📝 Authentication failed. Check username/password.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n📝 Connection refused. PostgreSQL server may not be running.');
    }
    
    // Try to connect to postgres database to create mindful_replay
    if (error.code === '3D000') {
      try {
        console.log('\n🔄 Attempting to connect to postgres database to create mindful_replay...');
        
        const adminKnex = require('knex')({
          client: 'postgresql',
          connection: {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: 'postgres' // Connect to default postgres database
          }
        });
        
        const adminResult = await adminKnex.raw('SELECT current_database(), current_user');
        console.log('✅ Connected to postgres database as:', adminResult.rows[0].current_user);
        
        // Create the mindful_replay database
        await adminKnex.raw('CREATE DATABASE mindful_replay');
        console.log('✅ Created "mindful_replay" database successfully!');
        
        await adminKnex.destroy();
        
        // Now try connecting to the new database
        console.log('\n🔄 Testing connection to new mindful_replay database...');
        const newResult = await knex.raw('SELECT current_database(), current_user');
        console.log('✅ Successfully connected to mindful_replay database!');
        console.log('Current Database:', newResult.rows[0].current_database);
        
      } catch (createError) {
        if (createError.message.includes('already exists')) {
          console.log('ℹ️ Database "mindful_replay" already exists');
          // Try connecting again
          try {
            const retryResult = await knex.raw('SELECT current_database()');
            console.log('✅ Connected to existing mindful_replay database');
          } catch (retryError) {
            console.error('❌ Still cannot connect:', retryError.message);
          }
        } else {
          console.error('❌ Failed to create database:', createError.message);
        }
      }
    }
  } finally {
    await knex.destroy();
  }
}

testConnection();