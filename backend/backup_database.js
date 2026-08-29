import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function safeFetch(modelName, fetchFn) {
  try {
    const data = await fetchFn();
    return data;
  } catch (err) {
    console.warn(`⚠️ Could not fetch model ${modelName}:`, err.message);
    return [];
  }
}

async function runBackup() {
  console.log("Starting full database backup...");
  
  try {
    const users = await safeFetch('User', () => prisma.user.findMany());
    const coaches = await safeFetch('Coach', () => prisma.coach.findMany());
    const parents = await safeFetch('Parent', () => prisma.parent.findMany());
    const players = await safeFetch('Player', () => prisma.player.findMany());
    const groups = await safeFetch('Group', () => prisma.group.findMany());
    const payments = await safeFetch('Payment', () => prisma.payment.findMany());
    const attendance = await safeFetch('Attendance', () => prisma.attendance.findMany());
    const evaluations = await safeFetch('Evaluation', () => prisma.evaluation.findMany());
    const messages = await safeFetch('Message', () => prisma.message.findMany());
    const trainings = await safeFetch('Training', () => prisma.training.findMany());
    const expenses = await safeFetch('Expense', () => prisma.expense.findMany());

    const backupData = {
      timestamp: new Date().toISOString(),
      counts: {
        users: users.length,
        coaches: coaches.length,
        parents: parents.length,
        players: players.length,
        groups: groups.length,
        payments: payments.length,
        attendance: attendance.length,
        evaluations: evaluations.length,
        messages: messages.length,
        trainings: trainings.length,
        expenses: expenses.length
      },
      data: {
        users,
        coaches,
        parents,
        players,
        groups,
        payments,
        attendance,
        evaluations,
        messages,
        trainings,
        expenses
      }
    };

    const backupsDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `db_backup_${timestampStr}.json`;
    const filePath = path.join(backupsDir, filename);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');
    
    // Extra backup to scratch directory
    const scratchDir = '/Users/moazmahmoud/.gemini/antigravity/brain/cc03f70b-ebce-43c9-8431-888218644dc7/scratch';
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true });
    }
    fs.writeFileSync(path.join(scratchDir, filename), JSON.stringify(backupData, null, 2), 'utf-8');

    console.log("==========================================");
    console.log("✅ BACKUP SUCCESSFUL!");
    console.log(`Saved to: ${filePath}`);
    console.log(`Saved copy to: ${path.join(scratchDir, filename)}`);
    console.log("Summary of backed up records:\n", JSON.stringify(backupData.counts, null, 2));
    console.log("==========================================");

  } catch (err) {
    console.error("❌ Backup failed with error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runBackup();
