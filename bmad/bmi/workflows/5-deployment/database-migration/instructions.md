# Database Migration - Schema Migration Execution Instructions

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/bmad/bmi/workflows/5-deployment/database-migration/workflow.yaml</critical>
<critical>Communicate all responses in {communication_language} and language MUST be tailored to {user_skill_level}</critical>
<critical>Generate all documents in {document_output_language}</critical>

<critical>DATABASE SAFETY: Always create backups before migrations. Never run destructive migrations on production without explicit confirmation. Always have a rollback plan.</critical>

<workflow>

<step n="1" goal="Initialize Database Migration Context">
  <action>Greet user: "I'm Diana, your DevOps Engineer. I'll help you safely execute database migrations for {target_environment}."</action>

  <action>Gather migration context:</action>
    - **Target Environment:** dev, staging, or production?
    - **Database Connection:** Connection string or environment variable reference
    - **Execution Mode:** plan_only (dry-run), execute (default), rollback

  <action if="target_environment is production">
    <warn>⚠️ PRODUCTION DATABASE MIGRATIONS - Extra caution required</warn>
    <action>Set production_mode = true</action>
  </action>

  <action>Verify prerequisites:</action>
    - Migration tool installed (Prisma, Drizzle, Knex, etc.)
    - Database accessible and credentials valid
    - Migration files exist in project
    - Backup storage available (for database backups)

  <action if="prerequisites not met">HALT: "Database migration prerequisites not met. Install migration tool, verify database connection, and ensure migration files exist."</action>

  <action>Start migration timer (for duration tracking)</action>
</step>

<step n="2" goal="Detect Migration Tool">
  <action>Auto-detect migration tool by scanning for config files and directories:</action>

  <migration-tool-detection>
    - **Prisma:** Check for prisma/schema.prisma, prisma/migrations/
    - **Drizzle:** Check for drizzle.config.ts, drizzle/
    - **Knex:** Check for knexfile.js or knexfile.ts, migrations/
    - **TypeORM:** Check for ormconfig.json, typeorm.config.ts, migration/ directory
    - **Sequelize:** Check for .sequelizerc, config/config.json, migrations/
    - **Django:** Check for manage.py, migrations/ directories in apps
    - **Rails:** Check for db/migrate/ directory, Rakefile
    - **Alembic:** Check for alembic.ini, alembic/ directory
    - **Flyway:** Check for flyway.conf, sql/ directory with V*.sql files
    - **Liquibase:** Check for liquibase.properties, changelog files
  </migration-tool-detection>

  <action>Report detected migration tool to user</action>

  <action if="migration_tool_override is provided">
    <action>Use migration_tool_override instead of auto-detected tool</action>
    <warn>Migration tool override detected. Using {migration_tool_override} instead of auto-detected tool.</warn>
  </action>

  <action if="no tool detected AND no override">
    <ask>⚠️ Migration tool auto-detection failed. Please specify tool manually:</ask>
    <options>
      - Prisma
      - Drizzle
      - Knex
      - TypeORM
      - Sequelize
      - Django
      - Rails
      - Alembic
      - Flyway
      - Liquibase
    </options>
    <action if="user cannot specify tool">HALT: "Cannot proceed without knowing migration tool. Please configure migrations or provide tool details."</action>
  </action>

  <action>Verify migration tool version and compatibility</action>
  <action>Display detected tool and version</action>
</step>

<step n="3" goal="Validate Database Connection">
  <action>Parse database connection string:</action>
    - Database type: PostgreSQL, MySQL, SQLite, SQL Server, MongoDB, etc.
    - Host and port
    - Database name
    - Username (credentials not displayed)

  <action>Test database connection:</action>

  <migration-tool name="Prisma">
    <action>Test connection: npx prisma db execute --stdin <<< "SELECT 1"</action>
  </migration-tool>

  <migration-tool name="Drizzle">
    <action>Test connection via drizzle-kit or custom connection test script</action>
  </migration-tool>

  <migration-tool name="Knex">
    <action>Test connection: npx knex raw "SELECT 1"</action>
  </migration-tool>

  <migration-tool name="TypeORM">
    <action>Test connection: npm run typeorm query "SELECT 1"</action>
  </migration-tool>

  <migration-tool name="Django">
    <action>Test connection: python manage.py dbshell --command "SELECT 1"</action>
  </migration-tool>

  <migration-tool name="Rails">
    <action>Test connection: rails runner "ActiveRecord::Base.connection.execute('SELECT 1')"</action>
  </migration-tool>

  <action if="connection fails">HALT: "Database connection failed. Check connection string, credentials, and network access. Error: {connection_error}"</action>

  <action if="connection succeeds">
    <action>Display: "✅ Database connection successful: {database_type} at {host}:{port}/{database_name}"</action>
    <action>Capture current database schema version/hash</action>
  </action>

  <action if="target_environment is production">
    <action>Verify correct production database (check database name matches expected production DB)</action>
    <action if="database mismatch">HALT: "Database mismatch. Expected production database '{expected_db}', connected to '{actual_db}'. Verify connection string."</action>
  </action>
</step>

<step n="4" goal="Generate Migration Plan">
  <action>Identify pending migrations (not yet applied to database):</action>

  <migration-tool name="Prisma">
    <action>Check migration status: npx prisma migrate status</action>
    <action>List pending migrations from prisma/migrations/ directory</action>
  </migration-tool>

  <migration-tool name="Drizzle">
    <action>Check pending migrations: drizzle-kit push --dry-run OR custom status check</action>
  </migration-tool>

  <migration-tool name="Knex">
    <action>Check migration status: npx knex migrate:list</action>
    <action>Identify migrations not in knex_migrations table</action>
  </migration-tool>

  <migration-tool name="TypeORM">
    <action>Check pending migrations: npm run typeorm migration:show</action>
  </migration-tool>

  <migration-tool name="Sequelize">
    <action>Check migration status: npx sequelize-cli db:migrate:status</action>
  </migration-tool>

  <migration-tool name="Django">
    <action>Check pending migrations: python manage.py showmigrations --plan</action>
    <action>Identify migrations with [ ] (not applied)</action>
  </migration-tool>

  <migration-tool name="Rails">
    <action>Check pending migrations: rails db:migrate:status</action>
    <action>Identify migrations with "down" status</action>
  </migration-tool>

  <migration-tool name="Alembic">
    <action>Check current revision: alembic current</action>
    <action>List pending revisions: alembic history --verbose</action>
  </migration-tool>

  <migration-tool name="Flyway">
    <action>Check migration status: flyway info</action>
    <action>Identify pending migrations</action>
  </migration-tool>

  <migration-tool name="Liquibase">
    <action>Check migration status: liquibase status</action>
  </migration-tool>

  <action>Display migration plan summary:</action>

  ```
  MIGRATION PLAN

  Pending Migrations: {pending_count}
  Current Schema Version: {current_version}
  Target Schema Version: {target_version}

  Migrations to Apply:
  1. {migration_1_name} - {migration_1_description}
  2. {migration_2_name} - {migration_2_description}
  ...
  ```

  <action if="pending_count is 0">
    <action>Display: "✅ Database is up-to-date. No pending migrations."</action>
    <action>Skip to step 10 (complete workflow without executing migrations)</action>
  </action>

  <action>Analyze migrations for destructive operations:</action>
    - DROP TABLE/COLUMN
    - TRUNCATE
    - ALTER with data loss potential
    - Changing column types (may cause data loss)

  <action if="destructive operations detected">
    <warn>⚠️ DESTRUCTIVE MIGRATIONS DETECTED: These migrations may cause data loss</warn>
    <action>Display affected tables/columns</action>
    <action if="target_environment is production">
      <ask>⚠️ CRITICAL: Destructive operations on PRODUCTION database. Type 'EXECUTE DESTRUCTIVE MIGRATIONS' to confirm:</ask>
      <action if="user does not type exact phrase">HALT: "Destructive production migrations cancelled. User did not provide explicit confirmation."</action>
    </action>
  </action>

  <action>Estimate migration execution time based on:</action>
    - Number of pending migrations
    - Database size
    - Migration complexity (simple ADD COLUMN vs complex data transformations)

  <action>Display estimated duration: "Estimated migration time: {estimated_duration}"</action>
</step>

<step n="5" goal="Create Database Backup">
  <action if="skip_backup is true">
    <warn>⚠️ WARNING: Skipping database backup (as requested). This is dangerous and not recommended.</warn>
    <action>Skip to step 6</action>
  </action>

  <action>Create database backup before executing migrations:</action>

  <database-type name="PostgreSQL">
    <action>Create backup: pg_dump {database_name} > backup-{database_name}-{date}.sql</action>
    <action>Compress backup: gzip backup-{database_name}-{date}.sql</action>
    <action>Calculate backup size</action>
  </database-type>

  <database-type name="MySQL/MariaDB">
    <action>Create backup: mysqldump {database_name} > backup-{database_name}-{date}.sql</action>
    <action>Compress backup: gzip backup-{database_name}-{date}.sql</action>
  </database-type>

  <database-type name="SQLite">
    <action>Create backup: cp {database_file} backup-{database_file}-{date}</action>
  </database-type>

  <database-type name="SQL Server">
    <action>Create backup via T-SQL: BACKUP DATABASE {database_name} TO DISK = 'backup-{date}.bak'</action>
  </database-type>

  <database-type name="MongoDB">
    <action>Create backup: mongodump --db {database_name} --out backup-{date}/</action>
    <action>Compress backup: tar -czf backup-{database_name}-{date}.tar.gz backup-{date}/</action>
  </database-type>

  <action>Verify backup was created successfully:</action>
    - Check file exists
    - Verify file size > 0
    - Calculate checksum for integrity verification

  <action if="backup creation fails">HALT: "Database backup failed. Cannot proceed with migrations without backup. Error: {backup_error}"</action>

  <action if="backup succeeds">
    <action>Display backup details:</action>
      - Backup file: {backup_file_path}
      - Backup size: {backup_size}
      - Backup checksum: {backup_checksum}
      - Backup location: {backup_storage_location}

    <action>Store backup metadata for potential restore:</action>
      - timestamp: {backup_timestamp}
      - schema_version: {current_schema_version}
      - migration_batch: {migration_batch_id}
  </action>

  <action if="target_environment is production">
    <action>Upload backup to cloud storage (S3, GCS, Azure Blob) for redundancy</action>
    <action>Verify cloud backup upload succeeded</action>
  </action>
</step>

<step n="6" goal="Execute Dry-Run (if requested)">
  <action if="execution_mode is NOT plan_only">Skip to step 7</action>

  <action>Execute migration dry-run (show SQL without applying):</action>

  <migration-tool name="Prisma">
    <warn>Prisma does not support SQL preview for migrations. Showing migration file contents instead.</warn>
    <action>Display migration file contents from prisma/migrations/</action>
  </migration-tool>

  <migration-tool name="Drizzle">
    <action>Generate SQL: drizzle-kit push --dry-run</action>
    <action>Display generated SQL statements</action>
  </migration-tool>

  <migration-tool name="Knex">
    <warn>Knex does not support dry-run. Recommend reviewing migration files manually.</warn>
    <action>Display migration file paths for manual review</action>
  </migration-tool>

  <migration-tool name="TypeORM">
    <action>Show SQL: npm run typeorm migration:show --fake</action>
  </migration-tool>

  <migration-tool name="Django">
    <action>Show SQL: python manage.py sqlmigrate {app_name} {migration_name}</action>
    <action>Repeat for each pending migration</action>
  </migration-tool>

  <migration-tool name="Rails">
    <warn>Rails does not support SQL preview. Review db/migrate/ files manually.</warn>
  </migration-tool>

  <migration-tool name="Alembic">
    <action>Generate SQL: alembic upgrade head --sql > migration-preview.sql</action>
    <action>Display SQL file contents</action>
  </migration-tool>

  <migration-tool name="Flyway">
    <action>Dry-run: flyway migrate -dryRunOutput=migration-preview.sql</action>
  </migration-tool>

  <migration-tool name="Liquibase">
    <action>Preview SQL: liquibase updateSQL</action>
  </migration-tool>

  <action>Display: "DRY-RUN COMPLETE - Migrations previewed but not applied"</action>
  <action>Skip to step 10 (complete workflow without executing)</action>
</step>

<step n="7" goal="Execute Database Migrations">
  <action>Display migration execution plan:</action>
    - Migration Tool: {detected_tool}
    - Database: {database_type} - {database_name}
    - Environment: {target_environment}
    - Migrations to Apply: {pending_count}
    - Backup Created: {backup_file_path}
    - Estimated Duration: {estimated_duration}

  <action if="target_environment is production">
    <ask>⚠️ EXECUTE {pending_count} PRODUCTION DATABASE MIGRATIONS? This will modify the production database. Continue? [y/N]</ask>
    <action if="user declines">HALT: "Production database migrations cancelled by user."</action>
  </action>

  <action>Start migration execution timer</action>

  <migration-tool name="Prisma">
    <action>Execute migrations: npx prisma migrate deploy</action>
    <action>Monitor migration progress</action>
  </migration-tool>

  <migration-tool name="Drizzle">
    <action>Execute migrations: drizzle-kit push OR npm run db:migrate</action>
  </migration-tool>

  <migration-tool name="Knex">
    <action>Execute migrations: npx knex migrate:latest</action>
    <action>Monitor output for errors</action>
  </migration-tool>

  <migration-tool name="TypeORM">
    <action>Execute migrations: npm run typeorm migration:run</action>
  </migration-tool>

  <migration-tool name="Sequelize">
    <action>Execute migrations: npx sequelize-cli db:migrate</action>
  </migration-tool>

  <migration-tool name="Django">
    <action>Execute migrations: python manage.py migrate</action>
    <action>Monitor output for warnings</action>
  </migration-tool>

  <migration-tool name="Rails">
    <action>Execute migrations: rails db:migrate</action>
    <action>Capture migration output</action>
  </migration-tool>

  <migration-tool name="Alembic">
    <action>Execute migrations: alembic upgrade head</action>
  </migration-tool>

  <migration-tool name="Flyway">
    <action>Execute migrations: flyway migrate</action>
  </migration-tool>

  <migration-tool name="Liquibase">
    <action>Execute migrations: liquibase update</action>
  </migration-tool>

  <action>Monitor migration execution with live output</action>
  <action>Capture detailed logs</action>
  <action>Record migration duration</action>

  <action if="migrations fail">
    <action>Capture error logs and failed migration details</action>
    <action>Display failure reason</action>

    <action if="rollback_on_failure is true">
      <warn>⚠️ MIGRATION FAILED - Attempting automatic rollback</warn>
      <action>Execute rollback based on tool capabilities (see step 8)</action>
      <action if="rollback succeeds">
        <action>Restore database from backup (step 9)</action>
        <action>Display: "✅ Rollback successful. Database restored to pre-migration state."</action>
      </action>
      <action if="rollback fails">
        <warn>⚠️ CRITICAL: Automatic rollback failed. Manual database restore required.</warn>
        <action>Provide backup restore instructions</action>
      </action>
    </action>

    <action>HALT: "Database migrations failed. Check logs for details. Database may need manual recovery."</action>
  </action>

  <action if="migrations succeed">
    <action>Capture completion timestamp</action>
    <action>Capture new schema version/hash</action>
    <action>Display success message: "✅ {pending_count} migrations applied successfully in {migration_duration}"</action>
  </action>
</step>

<step n="8" goal="Verify Migration Success">
  <action>Verify migrations were applied correctly:</action>

  <verification-checks>
    <check name="Migration Table Status">
      <action>Verify all pending migrations now marked as applied</action>
      <expect>No pending migrations remaining</expect>
      <action if="fails">WARN: "Some migrations not marked as applied. Check migration tracking table."</action>
    </check>

    <check name="Schema Validation">
      <action>Validate database schema matches expected state:</action>
        - Table existence check
        - Column type verification
        - Index verification
        - Constraint verification
      <expect>Schema matches migration definitions</expect>
      <action if="fails">WARN: "Schema validation failed. Database schema may not match expected state."</action>
    </check>

    <check name="Data Integrity">
      <action>Run basic data integrity checks:</action>
        - Row count validation (ensure no unexpected data loss)
        - Foreign key constraint validation
        - Null constraint validation
      <expect>Data integrity maintained</expect>
      <action if="fails">WARN: "Data integrity issues detected. Investigate data loss or corruption."</action>
    </check>

    <check name="Database Connectivity">
      <action>Verify database still accessible after migrations</action>
      <action>Test sample query execution</action>
      <expect>Database responsive and functional</expect>
      <action if="fails">CRITICAL: "Database not accessible after migrations. Immediate investigation required."</action>
    </check>
  </verification-checks>

  <action>Generate post-migration verification report</action>
  <action>Display verification results: X/Y checks passed</action>

  <action if="critical verification failures">
    <warn>⚠️ CRITICAL VERIFICATION FAILURES: Database may be in inconsistent state</warn>
    <action>Recommend immediate rollback or manual investigation</action>
  </action>
</step>

<step n="9" goal="Generate Migration Log">
  <action>Compile comprehensive migration log:</action>

  <section name="Migration Summary">
    - Environment: {target_environment}
    - Database: {database_type} - {database_name}
    - Migration Tool: {detected_tool}
    - Executed By: {user_name}
    - Timestamp: {migration_timestamp}
    - Duration: {migration_duration}
    - Status: ✅ SUCCESS
  </section>

  <section name="Migrations Applied">
    - Total Migrations: {pending_count}
    - Migrations List:
      1. {migration_1_name} - {migration_1_description}
      2. {migration_2_name} - {migration_2_description}
      ...
    - Schema Version: {current_version} → {new_version}
  </section>

  <section name="Database Backup">
    - Backup File: {backup_file_path}
    - Backup Size: {backup_size}
    - Backup Checksum: {backup_checksum}
    - Cloud Backup: {cloud_backup_location} (if production)
  </section>

  <section name="Verification">
    - Migration Table Status: ✅ All migrations marked as applied
    - Schema Validation: ✅ Schema matches expected state
    - Data Integrity: ✅ No data loss detected
    - Database Connectivity: ✅ Database responsive
  </section>

  <section name="Rollback Plan">
    - Rollback Script: {rollback_script_location}
    - Backup Restore Command: {restore_command}
    - Manual Rollback Steps: See {rollback_instructions}
  </section>

  <action>Save migration log to: {default_output_file}</action>
  <action>Display migration log location</action>
</step>

<step n="10" goal="Complete Database Migration">
  <action>Display migration completion summary:</action>

  ```
  ✅ DATABASE MIGRATION COMPLETE

  Environment: {target_environment}
  Database: {database_type} - {database_name}
  Migration Tool: {detected_tool}

  Migrations Applied: {pending_count} ✅
  Migration Duration: {migration_duration}
  Schema Version: {current_version} → {new_version}

  Backup: {backup_file_path} ({backup_size})
  Verification: All checks passed ✅

  Migration Log: {log_location}

  Next Steps:
  - Test application with new schema
  - Monitor database performance
  - Verify data integrity in application
  - Keep backup until confirmed stable

  Database migrations completed successfully! 🎉
  ```

  <action>Offer post-migration actions:</action>
    - View migration log
    - View backup details
    - Test database connection
    - Rollback migrations (if issues detected)
    - Return to agent menu

  <action>Workflow complete ✅</action>
</step>

</workflow>
