import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

dotenv.config();

// Plain text storage to ensure visual persistence in admin panel and printed invoices
function hashPassword(password) {
  return password || '';
}

function verifyPassword(password, storedPassword) {
  if (!storedPassword) return false;
  if (storedPassword.includes(':')) {
    try {
      const [salt, hash] = storedPassword.split(':');
      const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
      return hash === verifyHash;
    } catch (err) {
      console.error("Hash verification failed, trying plaintext:", err);
    }
  }
  return password === storedPassword;
}

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Database Migration: Automatically Fix Arabic Coach Emails and Reset Passwords on Startup ---
async function migrateArabicCoaches() {
  try {
    console.log("[Migration] Running coach database alignment...");
    const coaches = await prisma.coach.findMany({
      include: { user: true }
    });

    for (const coach of coaches) {
      const user = coach.user;
      if (!user) continue;

      let updatedEmail = user.email;
      // 1. Fix Arabic/non-ASCII characters in email
      if (/[^\x00-\x7F]/.test(user.email)) {
        const phoneDigits = (user.phone || '').replace(/\D/g, '') || String(coach.id).replace(/\D/g, '') || String(Date.now()).slice(-6);
        updatedEmail = `coach_${phoneDigits || 'default'}@najd.sa`;
        console.log(`[Migration] Updating coach "${user.name}" email from "${user.email}" to "${updatedEmail}"`);
      }

      // 2. Set default predictable password (phone digits suffix or ID digits suffix)
      const phoneDigits = (user.phone || '').replace(/\D/g, '');
      let defaultPass = '';
      if (phoneDigits) {
        defaultPass = `Najd@${phoneDigits.slice(-4)}`;
      } else {
        const idDigits = String(coach.id).replace(/\D/g, '').slice(-4) || '1234';
        defaultPass = `Najd@${idDigits}`;
      }

      const hashed = hashPassword(defaultPass);
      console.log(`[Migration] Updating password/email for Coach "${user.name}" -> Email: "${updatedEmail}", Pass: "${defaultPass}"`);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          email: updatedEmail,
          password: hashed
        }
      });
    }
    console.log("[Migration] Coach database alignment complete!");
  } catch (err) {
    console.error("[Migration] Error running coach database alignment:", err);
  }
}
migrateArabicCoaches();

// Endpoint to trigger manually if needed
app.post('/api/migrate-coaches', async (req, res) => {
  try {
    const logs = [];
    const coaches = await prisma.coach.findMany({
      include: { user: true }
    });

    for (const coach of coaches) {
      const user = coach.user;
      if (!user) continue;

      let updatedEmail = user.email;
      if (/[^\x00-\x7F]/.test(user.email)) {
        const phoneDigits = (user.phone || '').replace(/\D/g, '') || String(coach.id).replace(/\D/g, '') || String(Date.now()).slice(-6);
        updatedEmail = `coach_${phoneDigits || 'default'}@najd.sa`;
      }

      const phoneDigits = (user.phone || '').replace(/\D/g, '');
      let defaultPass = '';
      if (phoneDigits) {
        defaultPass = `Najd@${phoneDigits.slice(-4)}`;
      } else {
        const idDigits = String(coach.id).replace(/\D/g, '').slice(-4) || '1234';
        defaultPass = `Najd@${idDigits}`;
      }

      const hashed = hashPassword(defaultPass);
      logs.push(`Updated coach "${user.name}" -> Email: "${updatedEmail}", Pass: "${defaultPass}"`);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          email: updatedEmail,
          password: hashed
        }
      });
    }
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Health & Diagnostics ---
app.get('/api/health', (req, res) => {
  const dbHost = (process.env.DATABASE_URL || '').replace(/:[^@]+@/, ':***@');
  res.json({ status: 'ok', dbHost, version: 'reset-v1' });
});

app.post('/api/reset-database', async (req, res) => {
  const { secret } = req.body;
  if (secret !== 'NajdLaunch2026') {
    return res.status(403).json({ error: 'Unauthorized reset request' });
  }
  try {
    console.log("Cleaning database for production launch...");
    await prisma.message.deleteMany();
    await prisma.evaluation.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.training.deleteMany();
    await prisma.player.deleteMany();
    await prisma.coach.deleteMany();
    await prisma.parent.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();

    console.log("Seeding admin user...");
    await prisma.user.create({
      data: {
        id: "admin",
        email: "admin@najd.sa",
        password: hashPassword("Najd@2026"),
        role: "ADMIN",
        name: "مدير النادي"
      }
    });

    res.json({ success: true, message: 'Database successfully prepared for production launch!' });
  } catch (error) {
    console.error("Error resetting database:", error);
    res.status(500).json({ error: error.message });
  }
});


// --- Auth Routes ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        coachProfile: true,
        parentProfile: true,
        playerProfile: true,
      }
    });

    if (user && verifyPassword(password, user.password)) {
      // Map database user to frontend user object structure
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase(),
        ...(user.coachProfile || {}),
        ...(user.parentProfile || {}),
        ...(user.playerProfile || {})
      });
    } else {
      res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Generic Fetch Route (To get all state at once) ---
app.get('/api/initial-data', async (req, res) => {
  try {
    const [groups, coaches, players, payments, attendance, coachesAttendance, evals, messages, trainings, parentsRaw, expenses] = await Promise.all([
      prisma.group.findMany(),
      prisma.coach.findMany({ include: { user: true } }),
      prisma.player.findMany(),
      prisma.payment.findMany(),
      prisma.attendance.findMany(),
      prisma.attendance.findMany({ where: { coachId: { not: null } } }),
      prisma.evaluation.findMany(),
      prisma.message.findMany(),
      prisma.training.findMany(),
      prisma.parent.findMany({ include: { user: true } }),
      prisma.expense.findMany()
    ]);

    const parents = parentsRaw.map(par => ({
      id: par.id,
      userId: par.userId,
      name: par.user?.name || `ولي أمر`,
      email: par.user?.email || '',
      phone: par.user?.phone || '',
      password: par.user?.password || ''
    }));

    res.json({
      groups,
      coaches: coaches.map(c => ({ 
        ...c.user, 
        ...c, 
        id: c.id, 
        userId: c.user.id,
        password: c.user?.password || '',
        user: undefined 
      })),
      players,
      payments,
      attendance,
      coachesAttendance,
      evals,
      messages,
      trainings,
      parents,
      expenses
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Specific Update Routes ---
app.post('/api/players', async (req, res) => {
  const p = req.body;
  try {
    let resolvedParentId = p.parentId;

    // Check if the incoming parentId already exists in the Parent table
    const existingParent = p.parentId
      ? await prisma.parent.findUnique({ where: { id: p.parentId } })
      : null;

    if (!existingParent) {
      // Parent doesn't exist yet — create User + Parent from player's email/phone
      const email = p.email || `najd_${p.phone || Date.now()}@najd.sa`;
      let password = p.password;
      if (!password || password === '••••••••') {
        password = `najd_${(p.phone || '0000').slice(-4)}`;
      }
      const parentName = `ولي أمر ${p.name}`;

      const user = await prisma.user.upsert({
        where: { email },
        update: { password: hashPassword(password), name: parentName },
        create: { email, password: hashPassword(password), name: parentName, role: 'PARENT' }
      });

      const parent = await prisma.parent.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id }
      });

      resolvedParentId = parent.id;
    } else {
      // Parent exists — update User details if provided
      const updateData = {};
      if (p.email) updateData.email = p.email;
      if (p.password && p.password !== '••••••••') {
        updateData.password = hashPassword(p.password);
      }
      // Note: We do NOT update parent's name to avoid overwriting it for parents with multiple children

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: existingParent.userId },
          data: updateData
        });
      }
    }

    // Parse numbers safely to prevent Prisma constraint violations
    const resolvedAge = (p.age && !isNaN(p.age) && +p.age > 0) ? parseInt(p.age) : 10;
    const resolvedWeight = (p.weight && !isNaN(p.weight)) ? parseFloat(p.weight) : null;
    const resolvedHeight = (p.height && !isNaN(p.height)) ? parseFloat(p.height) : null;

    // Create or update the Player record
    // Safe upsert: try update first, fall back to create
    let player;
    const existing = p.id ? await prisma.player.findUnique({ where: { id: p.id } }) : null;

    if (existing) {
      player = await prisma.player.update({
        where: { id: p.id },
        data: {
          name: p.name, phone: p.phone, age: resolvedAge,
          status: p.status, position: p.position,
          weight: resolvedWeight,
          height: resolvedHeight,
          score: p.score ? +p.score : null,
          joinDate: p.joinDate ? new Date(p.joinDate) : undefined,
          group: { connect: { id: p.groupId } },
          parent: { connect: { id: resolvedParentId } }
        }
      });
    } else {
      player = await prisma.player.create({
        data: {
          id: p.id,
          name: p.name, phone: p.phone, age: resolvedAge,
          status: p.status || 'نشط', position: p.position,
          weight: resolvedWeight,
          height: resolvedHeight,
          score: p.score ? +p.score : 80,
          joinDate: p.joinDate ? new Date(p.joinDate) : undefined,
          group: { connect: { id: p.groupId } },
          parent: { connect: { id: resolvedParentId } }
        }
      });
    }

    res.json({ ...player, parentId: resolvedParentId });
  } catch (e) {
    console.error('Player error:', e);
    res.status(500).json({ error: e.message });
  }
});


app.post('/api/payments', async (req, res) => {
  try {
    const { id, playerId, playerName, coachId, coachName, type, month, amount, date, note } = req.body;
    const payment = await prisma.payment.upsert({
      where: { id: id || 'new' },
      update: { 
        playerId, 
        playerName, 
        coachId, 
        coachName, 
        type, 
        month, 
        amount, 
        date: new Date(date), 
        note 
      },
      create: { 
        id, 
        playerId, 
        playerName, 
        coachId, 
        coachName, 
        type, 
        month, 
        amount, 
        date: new Date(date), 
        note 
      }
    });
    res.json(payment);
  } catch (e) {
    console.error("Payment error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { id, item, amount, purchaser, date, month, note } = req.body;
    const expense = await prisma.expense.upsert({
      where: { id: id || 'new' },
      update: {
        item,
        amount: parseFloat(amount),
        purchaser,
        date: new Date(date),
        month,
        note
      },
      create: {
        id,
        item,
        amount: parseFloat(amount),
        purchaser,
        date: new Date(date),
        month,
        note
      }
    });
    res.json(expense);
  } catch (e) {
    console.error("Expense error:", e);
    res.status(500).json({ error: e.message });
  }
});

// Save Attendance
app.post('/api/attendance', async (req, res) => {
  try {
    const a = req.body;
    const att = await prisma.attendance.upsert({
      where: { id: a.id },
      update: { records: a.records },
      create: { 
        id: a.id, 
        date: new Date(a.date), 
        records: a.records,
        group: a.groupId ? { connect: { id: a.groupId } } : undefined,
        coach: a.coachId ? { connect: { id: a.coachId } } : undefined
      }
    });
    res.json(att);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/coaches', async (req, res) => {
  const c = req.body;
  try {
    // 1. Resolve password securely (handling placeholder and empty passwords)
    let userPassword = c.password;
    if (!userPassword || userPassword === '••••••••') {
      // If we are editing, try to copy the existing hashed password
      if (c.id && c.id !== 'new') {
        const existingCoach = await prisma.coach.findUnique({
          where: { id: c.id },
          include: { user: true }
        });
        if (existingCoach && existingCoach.user) {
          userPassword = existingCoach.user.password;
        }
      }
    }

    // Now format password correctly (hash if not already hashed)
    let finalPassword = userPassword;
    if (finalPassword && finalPassword !== '••••••••') {
      if (!finalPassword.includes(':')) {
        finalPassword = hashPassword(finalPassword);
      }
    } else {
      // Fallback if password is still empty or placeholder
      const phoneDigits = (c.phone || '').replace(/\D/g, '');
      finalPassword = hashPassword(phoneDigits ? `Najd@${phoneDigits.slice(-4)}` : `Najd@${Math.floor(Math.random()*9000)+1000}`);
    }

    const userUpdate = { name: c.name, password: finalPassword };
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: userUpdate,
      create: { 
        email: c.email, 
        password: finalPassword, 
        name: c.name, 
        role: 'COACH' 
      }
    });

    // 2. Resolve Unique Constraint on groupId in Coach table
    if (c.groupId) {
      await prisma.coach.updateMany({
        where: { 
          groupId: c.groupId,
          NOT: { id: c.id || 'new' }
        },
        data: { groupId: null }
      });
    }

    // 3. Upsert Coach (including exp, cert, salary)
    const coach = await prisma.coach.upsert({
      where: { id: c.id || 'new' },
      update: { 
        specialty: c.specialty, 
        perms: c.perms, 
        salary: c.salary ? parseFloat(c.salary) : null,
        exp: c.exp ? parseInt(c.exp) : null,
        cert: c.cert,
        user: { connect: { id: user.id } },
        group: c.groupId ? { connect: { id: c.groupId } } : { disconnect: true }
      },
      create: { 
        id: c.id, 
        specialty: c.specialty, 
        perms: c.perms, 
        salary: c.salary ? parseFloat(c.salary) : null,
        exp: c.exp ? parseInt(c.exp) : null,
        cert: c.cert,
        user: { connect: { id: user.id } },
        group: c.groupId ? { connect: { id: c.groupId } } : undefined
      }
    });

    // 4. Synchronize Group table's coachId
    await prisma.group.updateMany({
      where: { 
        coachId: coach.id,
        NOT: { id: c.groupId || 'none' }
      },
      data: { coachId: null }
    });

    if (c.groupId) {
      await prisma.group.updateMany({
        where: { id: c.groupId },
        data: { coachId: null }
      });
      await prisma.group.update({
        where: { id: c.groupId },
        data: { 
          coachId: coach.id,
          coach: { connect: { id: coach.id } } 
        }
      });
    }

    res.json(coach);
  } catch (e) {
    console.error("Coach upsert error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/groups', async (req, res) => {
  const g = req.body;
  try {
    const coachId = g.coachId || null;

    // 1. Resolve Unique Constraint on coachId in Group table
    if (coachId) {
      await prisma.group.updateMany({
        where: { 
          coachId: coachId,
          NOT: { id: g.id || 'new' }
        },
        data: { coachId: null }
      });
    }

    // 2. Upsert Group
    const updateData = { name: g.name, color: g.color, coachId: coachId };
    if (coachId) updateData.coach = { connect: { id: coachId } };
    else updateData.coach = { disconnect: true };

    const createData = { id: g.id, name: g.name, color: g.color, coachId: coachId };
    if (coachId) createData.coach = { connect: { id: coachId } };

    const group = await prisma.group.upsert({
      where: { id: g.id || 'new' },
      update: updateData,
      create: createData
    });

    // 3. Synchronize Coach table's groupId
    await prisma.coach.updateMany({
      where: { 
        groupId: group.id,
        NOT: { id: coachId || 'none' }
      },
      data: { groupId: null }
    });

    if (coachId) {
      await prisma.coach.updateMany({
        where: { id: coachId },
        data: { groupId: null }
      });
      await prisma.coach.update({
        where: { id: coachId },
        data: { group: { connect: { id: group.id } } }
      });
    }

    res.json(group);
  } catch (e) {
    console.error("Group upsert error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/trainings', async (req, res) => {
  const t = req.body;
  try {
    let resolvedCoachId = t.coachId;
    if (!resolvedCoachId) {
      const firstCoach = await prisma.coach.findFirst();
      resolvedCoachId = firstCoach?.id;
    }
    if (!resolvedCoachId) {
      return res.status(400).json({ error: "لا يوجد مدرب مسجل في النظام لربط التمرين به. يرجى إضافة مدرب أولاً." });
    }

    let resolvedGroupId = t.groupId;
    if (!resolvedGroupId) {
      const firstGroup = await prisma.group.findFirst();
      resolvedGroupId = firstGroup?.id;
    }
    if (!resolvedGroupId) {
      return res.status(400).json({ error: "لا توجد مجموعة مسجلة في النظام لربط التمرين بها. يرجى إضافة مجموعة أولاً." });
    }

    const training = await prisma.training.upsert({
      where: { id: t.id || 'new' },
      update: { 
        days: t.days || [], 
        time: t.time || "4:00 م", duration: t.duration ? +t.duration : 90, field: t.field || "ملعب A", 
        title: t.title, trainingFocus: t.trainingFocus, note: t.note,
        date: t.date ? new Date(t.date) : null,
        isRecurring: t.isRecurring !== undefined ? !!t.isRecurring : true,
        type: t.type || "training",
        isFriendly: t.isFriendly !== undefined ? !!t.isFriendly : false,
        group: { connect: { id: resolvedGroupId } },
        coach: { connect: { id: resolvedCoachId } }
      },
      create: { 
        id: t.id, 
        days: t.days || [], 
        time: t.time || "4:00 م", duration: t.duration ? +t.duration : 90, field: t.field || "ملعب A", 
        title: t.title, trainingFocus: t.trainingFocus, note: t.note,
        date: t.date ? new Date(t.date) : null,
        isRecurring: t.isRecurring !== undefined ? !!t.isRecurring : true,
        type: t.type || "training",
        isFriendly: t.isFriendly !== undefined ? !!t.isFriendly : false,
        group: { connect: { id: resolvedGroupId } },
        coach: { connect: { id: resolvedCoachId } }
      }
    });
    res.json(training);
  } catch (e) {
    console.error("Training create error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { id, from, to, fromName, toName, text, files, date, read } = req.body;
    const msg = await prisma.message.upsert({
      where: { id: id || 'new' },
      update: { read },
      create: { id, from, to, fromName, toName, text, files, date: new Date(date), read: !!read }
    });
    res.json(msg);
  } catch (e) {
    console.error("Message error:", e);
    res.status(500).json({ error: e.message });
  }
});

// --- Evaluations Routes ---
app.post('/api/evaluations', async (req, res) => {
  const e = req.body;
  try {
    const evaluation = await prisma.evaluation.upsert({
      where: { id: e.id || 'new' },
      update: { 
        date: new Date(e.date), 
        note: e.note, 
        speed: parseInt(e.speed) || 80, 
        technique: parseInt(e.technique) || 80, 
        teamwork: parseInt(e.teamwork) || 80,
        player: { connect: { id: e.playerId } },
        coach: { connect: { id: e.coachId } }
      },
      create: { 
        id: e.id, 
        date: new Date(e.date), 
        note: e.note, 
        speed: parseInt(e.speed) || 80, 
        technique: parseInt(e.technique) || 80, 
        teamwork: parseInt(e.teamwork) || 80,
        player: { connect: { id: e.playerId } },
        coach: { connect: { id: e.coachId } }
      }
    });

    const avgScore = Math.round((evaluation.speed + evaluation.technique + evaluation.teamwork) / 3);
    await prisma.player.update({
      where: { id: e.playerId },
      data: { score: avgScore }
    });

    res.json(evaluation);
  } catch (err) {
    console.error("Evaluation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- Delete Routes ---
app.delete('/api/players/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const player = await prisma.player.findUnique({ where: { id } });
    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { playerId: id } }),
      prisma.evaluation.deleteMany({ where: { playerId: id } }),
      prisma.player.delete({ where: { id } })
    ]);
    
    // Clean up associated User record to prevent dangling records and unique email blockages
    if (player && player.userId) {
      await prisma.user.delete({ where: { id: player.userId } }).catch(() => {});
    }
    
    res.json({ success: true });
  } catch (e) {
    console.error("Error deleting player:", e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/groups/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.$transaction([
      prisma.training.deleteMany({ where: { groupId: id } }),
      prisma.attendance.deleteMany({ where: { groupId: id } }),
      prisma.coach.updateMany({ where: { groupId: id }, data: { groupId: null } }),
      prisma.player.deleteMany({ where: { groupId: id } }),
      prisma.group.delete({ where: { id } })
    ]);
    res.json({ success: true });
  } catch (e) {
    console.error("Error deleting group:", e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/coaches/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const coach = await prisma.coach.findUnique({ where: { id } });
    await prisma.$transaction([
      prisma.training.deleteMany({ where: { coachId: id } }),
      prisma.evaluation.deleteMany({ where: { coachId: id } }),
      prisma.attendance.updateMany({ where: { coachId: id }, data: { coachId: null } }),
      prisma.group.updateMany({ where: { coachId: id }, data: { coachId: null } }),
      prisma.coach.delete({ where: { id } })
    ]);
    
    // Clean up associated User record
    if (coach && coach.userId) {
      await prisma.user.delete({ where: { id: coach.userId } }).catch(() => {});
    }
    
    res.json({ success: true });
  } catch (e) {
    console.error("Error deleting coach:", e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/payments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.payment.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    console.error("Error deleting payment:", e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.expense.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    console.error("Error deleting expense:", e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/trainings/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.training.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    console.error("Error deleting training:", e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/attendance/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.attendance.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    console.error("Error deleting attendance:", e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/evaluations/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.evaluation.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    console.error("Error deleting evaluation:", e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/messages/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.message.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    console.error("Error deleting message:", e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

