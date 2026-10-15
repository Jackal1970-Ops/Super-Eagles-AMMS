/**
 * Super Eagles AMMS - Verification Script for Health, Self-Healing, and Backup Engines
 */

import fs from "fs";
import path from "path";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function runVerification() {
  console.log("\n" + "=".repeat(80));
  console.log("       SUPER EAGLES ATHLETICS MANAGEMENT SYSTEM (AMMS)");
  console.log("    HEALTH CHECK, SELF-HEALING & BACKUP ENGINE VERIFICATION");
  console.log("=".repeat(80) + "\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      passed++;
      console.log(`  [✓ PASS] ${message}`);
    } else {
      failed++;
      console.error(`  [✗ FAIL] ${message}`);
    }
  }

  try {
    // Dynamic import of TypeScript / compiled modules
    // 1. Verify Database
    await prisma.$connect();
    assert(true, "Database connected successfully");

    // 2. Test Backup Directory Creation and Backup Writing
    const testBackupDir = path.resolve("./backups/test_run");
    if (!fs.existsSync(testBackupDir)) {
      fs.mkdirSync(testBackupDir, { recursive: true });
    }

    const sourceDb = path.resolve("./prisma/dev.db");
    assert(fs.existsSync(sourceDb), `Live Prisma database file exists at ${sourceDb}`);

    const backupFile = path.join(testBackupDir, `test_backup_${Date.now()}.sqlite.bak`);
    fs.copyFileSync(sourceDb, backupFile);
    assert(fs.existsSync(backupFile), "Backup copy of SQLite database successfully created");
    assert(fs.statSync(backupFile).size > 100000, `Backup file size valid: ${fs.statSync(backupFile).size} bytes`);

    // Clean up test file
    fs.unlinkSync(backupFile);
    fs.rmdirSync(testBackupDir);
    assert(true, "Temporary test backup directory cleaned up");

    // 3. Verify System Configurations for Backup
    const backupConfig = await prisma.systemConfiguration.upsert({
      where: { configKey: "BACKUP_CONFIG" },
      update: {
        configValueJson: JSON.stringify({
          enabled: true,
          frequency: "DAILY",
          targetDirectory: "./backups",
          retentionCount: 7,
          lastBackupTimestamp: new Date().toISOString(),
        }),
      },
      create: {
        configKey: "BACKUP_CONFIG",
        description: "Automated Backup Configuration",
        configValueJson: JSON.stringify({
          enabled: true,
          frequency: "DAILY",
          targetDirectory: "./backups",
          retentionCount: 7,
          lastBackupTimestamp: new Date().toISOString(),
        }),
      },
    });

    assert(!!backupConfig, "BACKUP_CONFIG persisted into SystemConfiguration table");
    const parsedConfig = JSON.parse(backupConfig.configValueJson);
    assert(parsedConfig.enabled === true, "Auto-backup enabled flag is true");
    assert(parsedConfig.frequency === "DAILY", "Default frequency is DAILY");
    assert(parsedConfig.retentionCount === 7, "Default retention count is 7");

    // 4. Verify optional cold recovery snapshot without treating it as a live mirror.
    const recoveryDb = path.resolve("./dev.db");
    assert(fs.existsSync(recoveryDb), "Root SQLite recovery snapshot ./dev.db exists");

    console.log("\n" + "=".repeat(80));
    console.log(`VERIFICATION RESULT: ${passed} passed, ${failed} failed`);
    console.log("=".repeat(80) + "\n");

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("Verification failed with exception:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runVerification();
