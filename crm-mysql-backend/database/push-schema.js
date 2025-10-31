import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function pushSchema() {
  console.log('🔄 Connecting to Hostinger MySQL database...');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log(`   User: ${process.env.DB_USER}\n`);

  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('✅ Connected to database successfully!\n');

    // Read schema file
    const schemaPath = path.join(__dirname, 'hostinger-schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');

    console.log('📋 Executing schema SQL...\n');

    // Execute schema
    await connection.query(schema);

    console.log('✅ Schema pushed successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...\n');
    const [tables] = await connection.query('SHOW TABLES');
    
    console.log('📊 Tables in database:');
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`   ${index + 1}. ${tableName}`);
    });

    console.log('\n✅ Database setup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start your backend: npm run dev');
    console.log('   2. Register a user via the API');
    console.log('   3. Start using the CRM!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection refused. Check:');
      console.error('   - Database host and port are correct');
      console.error('   - Firewall allows connection');
      console.error('   - Database server is running');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Access denied. Check:');
      console.error('   - Database username is correct');
      console.error('   - Database password is correct');
      console.error('   - User has permissions for this database');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed.');
    }
  }
}

// Run the script
pushSchema();
