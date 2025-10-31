import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function verifyDatabase() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  🔍 DATABASE CONNECTION & TABLE VERIFICATION');
  console.log('═══════════════════════════════════════════════════════\n');

  let connection;

  try {
    // Connection details
    console.log('📋 Connection Details:');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Port: ${process.env.DB_PORT}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   User: ${process.env.DB_USER}`);
    console.log();

    // Create connection
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ Connection successful!\n');

    // Get database info
    console.log('📊 Database Information:');
    const [dbInfo] = await connection.query(
      'SELECT DATABASE() as current_db, VERSION() as version'
    );
    console.log(`   Current Database: ${dbInfo[0].current_db}`);
    console.log(`   MySQL Version: ${dbInfo[0].version}`);
    console.log();

    // List all tables
    console.log('📋 Tables in database:');
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('   ⚠️  No tables found!');
    } else {
      tables.forEach((table, index) => {
        const tableName = Object.values(table)[0];
        console.log(`   ${index + 1}. ✓ ${tableName}`);
      });
    }
    console.log();

    // Check each table structure
    console.log('🔍 Verifying table structures:\n');
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      const [columns] = await connection.query(`DESCRIBE ${tableName}`);
      console.log(`   📋 ${tableName} (${columns.length} columns)`);
      
      // Show first few columns
      columns.slice(0, 5).forEach(col => {
        console.log(`      - ${col.Field} (${col.Type})`);
      });
      if (columns.length > 5) {
        console.log(`      ... and ${columns.length - 5} more columns`);
      }
      console.log();
    }

    // Test a sample query
    console.log('🧪 Testing sample queries:\n');
    
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log(`   Users table: ${userCount[0].count} records`);
    
    const [customerCount] = await connection.query('SELECT COUNT(*) as count FROM customers');
    console.log(`   Customers table: ${customerCount[0].count} records`);
    
    const [dealCount] = await connection.query('SELECT COUNT(*) as count FROM deals');
    console.log(`   Deals table: ${dealCount[0].count} records`);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  ✅ DATABASE VERIFICATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📝 Summary:');
    console.log(`   ✓ Connection: Working`);
    console.log(`   ✓ Tables: ${tables.length} created`);
    console.log(`   ✓ Database: Ready for use\n`);

    console.log('🚀 Next Steps:');
    console.log('   1. Backend is already running on port 5000');
    console.log('   2. Frontend is built at crm-mysql-frontend/dist/');
    console.log('   3. Ready to deploy or register your first user!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nError Code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Check if database host is reachable');
      console.error('   - Verify port 3306 is open');
      console.error('   - Confirm database server is running');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Verify username and password');
      console.error('   - Check user permissions for database');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Database does not exist');
      console.error('   - Check database name spelling');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connection closed.\n');
    }
  }
}

verifyDatabase();
