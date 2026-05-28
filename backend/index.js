import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Health & Diagnostics ---
app.get('/api/health', (req, res) => {
  const dbHost = (process.env.DATABASE_URL || '').replace(/:[^@]+@/, ':***@');
  res.json({ status: 'ok', dbHost });
});

// --- Remote Seed Endpoint (protected, for first-time setup only) ---
app.post('/api/seed', async (req, res) => {
  // TEMPORARILY OPEN for one-time seed - will be locked after use
  // const secret = req.headers['x-seed-secret'];
  // if (!process.env.SEED_SECRET) {
  //   return res.status(403).json({ error: 'Forbidden', reason: 'SEED_SECRET not configured on server' });
  // }
  // if (secret !== process.env.SEED_SECRET) {
  //   return res.status(403).json({ error: 'Forbidden', reason: 'Invalid secret' });
  // }
  try {
    const USERS = [
      { id: "admin", email: "admin@najd.sa",      password: "Najd@2026",  role: "ADMIN",  name: "مدير النادي" },
      { id: "c1",    email: "ahmed@najd.sa",      password: "Coach@1234", role: "COACH",  name: "أحمد سالم البقمي" },
      { id: "c2",    email: "khaled@najd.sa",     password: "Coach@5678", role: "COACH",  name: "خالد مبارك العسيري" },
      { id: "c3",    email: "saad@najd.sa",       password: "Coach@9012", role: "COACH",  name: "سعد الرشيدي" },
      { id: "par1",  email: "aalghamdi@mail.com", password: "Parent@111", role: "PARENT", name: "عبدالله الغامدي" },
      { id: "par2",  email: "saqahtani@mail.com", password: "Parent@222", role: "PARENT", name: "سعد القحطاني" },
      { id: "par3",  email: "kzahrani@mail.com",  password: "Parent@333", role: "PARENT", name: "خالد الزهراني" },
      { id: "par4",  email: "ashahri@mail.com",   password: "Parent@444", role: "PARENT", name: "أحمد الشهري" },
      { id: "par5",  email: "adosari@mail.com",   password: "Parent@555", role: "PARENT", name: "علي الدوسري" },
      { id: "par6",  email: "aharbi@mail.com",    password: "Parent@666", role: "PARENT", name: "عبدالرحمن الحربي" },
      { id: "par7",  email: "fsobiee@mail.com",   password: "Parent@777", role: "PARENT", name: "فهد السبيعي" },
    ];
    const GROUPS = [
      { id: "g1", name: "تحت 11", color: "#06B6D4" },
      { id: "g2", name: "تحت 13", color: "#A855F7" },
      { id: "g3", name: "تحت 15", color: "#F59E0B" },
    ];
    const COACHES = [
      { id: "c1", specialty: "مهارات فردية", groupId: "g1", userId: "c1", perms: { attendance: true, payments: true, evals: true, messages: true } },
      { id: "c2", specialty: "تكتيك وخطط",  groupId: "g2", userId: "c2", perms: { attendance: true, payments: true, evals: true, messages: true } },
      { id: "c3", specialty: "لياقة بدنية",  groupId: "g3", userId: "c3", perms: { attendance: true, payments: true, evals: true, messages: true } },
    ];
    const PARENTS = [
      { id: "par1", userId: "par1" }, { id: "par2", userId: "par2" }, { id: "par3", userId: "par3" },
      { id: "par4", userId: "par4" }, { id: "par5", userId: "par5" }, { id: "par6", userId: "par6" },
      { id: "par7", userId: "par7" },
    ];
    const PLAYERS = [
      { id: "p1", name: "محمد عبدالله الغامدي",   age: 12, groupId: "g2", phone: "0501234567", status: "نشط",   score: 85, weight: 48, height: 158, position: "مهاجم",     parentId: "par1" },
      { id: "p2", name: "فيصل سعد القحطاني",      age: 10, groupId: "g1", phone: "0507654321", status: "نشط",   score: 90, weight: 38, height: 142, position: "جناح أيمن", parentId: "par2" },
      { id: "p3", name: "عمر خالد الزهراني",      age: 14, groupId: "g3", phone: "0509876543", status: "نشط",   score: 78, weight: 58, height: 170, position: "وسط",        parentId: "par3" },
      { id: "p4", name: "يوسف أحمد الشهري",       age: 11, groupId: "g2", phone: "0501112233", status: "موقوف", score: 65, weight: 42, height: 150, position: "مدافع",      parentId: "par4" },
      { id: "p5", name: "بندر علي الدوسري",       age: 13, groupId: "g3", phone: "0504445566", status: "نشط",   score: 92, weight: 54, height: 165, position: "جناح أيسر", parentId: "par5" },
      { id: "p6", name: "سلطان محمد العتيبي",     age: 9,  groupId: "g1", phone: "0506667788", status: "نشط",   score: 88, weight: 32, height: 135, position: "مهاجم",     parentId: "par1" },
      { id: "p7", name: "نايف عبدالرحمن الحربي",  age: 12, groupId: "g2", phone: "0508889900", status: "نشط",   score: 81, weight: 46, height: 155, position: "وسط",        parentId: "par6" },
      { id: "p8", name: "ريان فهد السبيعي",       age: 10, groupId: "g1", phone: "0502223344", status: "نشط",   score: 74, weight: 36, height: 140, position: "مدافع",      parentId: "par7" },
    ];
    const PAYMENTS = [
      { id: "pay1", playerId: "p1", playerName: "محمد عبدالله الغامدي", coachId: "c2", coachName: "خالد مبارك العسيري", type: "subscription", month: "مارس 2026",  amount: 350, date: new Date("2026-03-05"), note: "دفع نقدي" },
      { id: "pay2", playerId: "p1", playerName: "محمد عبدالله الغامدي", coachId: "c2", coachName: "خالد مبارك العسيري", type: "subscription", month: "أبريل 2026", amount: 350, date: new Date("2026-04-03"), note: "تحويل بنكي" },
      { id: "pay4", playerId: "p2", playerName: "فيصل سعد القحطاني",    coachId: "c1", coachName: "أحمد سالم البقمي",   type: "subscription", month: "أبريل 2026", amount: 350, date: new Date("2026-04-02"), note: "دفع نقدي" },
      { id: "pay6", playerId: "p5", playerName: "بندر علي الدوسري",     coachId: "c3", coachName: "سعد الرشيدي",        type: "subscription", month: "أبريل 2026", amount: 350, date: new Date("2026-04-01"), note: "تحويل بنكي" },
      { id: "pay8", playerId: "p6", playerName: "سلطان محمد العتيبي",   coachId: "c1", coachName: "أحمد سالم البقمي",   type: "subscription", month: "أبريل 2026", amount: 350, date: new Date("2026-04-04"), note: "دفع نقدي" },
    ];
    const EVALS = [
      { id: "ev1", playerId: "p1", coachId: "c2", date: new Date("2026-04-20"), note: "أداء ممتاز في التمرير", speed: 80, technique: 88, teamwork: 90 },
      { id: "ev3", playerId: "p2", coachId: "c1", date: new Date("2026-04-17"), note: "سرعة رائعة، التكتيك يحتاج تطوير", speed: 90, technique: 85, teamwork: 88 },
    ];
    const ATTENDANCE = [
      { id: "att1", date: new Date("2026-04-20"), groupId: "g2", coachId: "c2", records: { p1: "حاضر", p4: "غائب", p7: "حاضر" } },
      { id: "att2", date: new Date("2026-04-17"), groupId: "g1", coachId: "c1", records: { p2: "حاضر", p6: "حاضر", p8: "بعذر" } },
    ];
    const MESSAGES = [
      { id: "msg1", from: "admin", fromName: "الإدارة", to: "par1", toName: "عبدالله الغامدي", text: "تذكير: موعد التدريب غداً الساعة 5 مساءً", date: new Date("2026-04-22"), read: false },
      { id: "msg2", from: "c2", fromName: "خالد مبارك العسيري", to: "par1", toName: "عبدالله الغامدي", text: "أداء محمد ممتاز هذا الأسبوع", date: new Date("2026-04-20"), read: true },
    ];

    // Wipe and reseed
    await prisma.message.deleteMany();
    await prisma.evaluation.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.training.deleteMany();
    await prisma.player.deleteMany();
    await prisma.coach.deleteMany();
    await prisma.parent.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();

    for (const u of USERS) await prisma.user.create({ data: u });
    for (const g of GROUPS) await prisma.group.create({ data: g });
    for (const c of COACHES) await prisma.coach.create({ data: c });
    for (const p of PARENTS) await prisma.parent.create({ data: p });
    for (const pl of PLAYERS) await prisma.player.create({ data: pl });
    for (const pay of PAYMENTS) await prisma.payment.create({ data: pay });
    for (const ev of EVALS) await prisma.evaluation.create({ data: ev });
    for (const att of ATTENDANCE) await prisma.attendance.create({ data: att });
    for (const msg of MESSAGES) await prisma.message.create({ data: msg });

    res.json({ success: true, message: 'Database seeded successfully' });
  } catch (e) {
    console.error('Seed error:', e);
    res.status(500).json({ error: e.message });
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

    if (user && user.password === password) {
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
    const [groups, coaches, players, payments, attendance, coachesAttendance, evals, messages, trainings] = await Promise.all([
      prisma.group.findMany(),
      prisma.coach.findMany({ include: { user: true } }),
      prisma.player.findMany(),
      prisma.payment.findMany(),
      prisma.attendance.findMany(),
      prisma.attendance.findMany({ where: { coachId: { not: null } } }), // Simplified for now
      prisma.evaluation.findMany(),
      prisma.message.findMany(),
      prisma.training.findMany()
    ]);

    res.json({
      groups,
      coaches: coaches.map(c => ({ 
        ...c.user, 
        ...c, 
        id: c.id, 
        userId: c.user.id,
        user: undefined 
      })),
      players,
      payments,
      attendance,
      coachesAttendance,
      evals,
      messages,
      trainings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Specific Update Routes ---
app.post('/api/players', async (req, res) => {
  const p = req.body;
  try {
    // 1. Ensure a User exists for the parent login
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: { password: p.password, name: `ولي أمر ${p.name}` },
      create: { 
        email: p.email, 
        password: p.password, 
        name: `ولي أمر ${p.name}`, 
        role: 'PARENT' 
      }
    });

    // 2. Ensure a Parent profile exists for that user
    const parent = await prisma.parent.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id }
    });

    // 3. Create or update the Player record
    const player = await prisma.player.upsert({
      where: { id: p.id || 'new' },
      update: { 
        name: p.name, phone: p.phone, age: p.age, status: p.status, 
        position: p.position, weight: p.weight, height: p.height, 
        groupId: p.groupId, score: p.score, parentId: parent.id
      },
      create: {
        id: p.id, name: p.name, phone: p.phone, age: p.age, 
        status: p.status, position: p.position, weight: p.weight, 
        height: p.height, groupId: p.groupId, parentId: parent.id
      }
    });
    res.json(player);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const { id, playerId, playerName, coachId, coachName, type, month, amount, date, note } = req.body;
    const payment = await prisma.payment.upsert({
      where: { id: id || 'new' },
      update: { playerId, playerName, coachId, coachName, type, month, amount, date: new Date(date), note },
      create: { id, playerId, playerName, coachId, coachName, type, month, amount, date: new Date(date), note }
    });
    res.json(payment);
  } catch (e) {
    console.error("Payment error:", e);
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
      create: { id: a.id, date: new Date(a.date), groupId: a.groupId, coachId: a.coachId, records: a.records }
    });
    res.json(att);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/coaches', async (req, res) => {
  const c = req.body;
  try {
    // 1. Upsert User
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { password: c.password, name: c.name },
      create: { email: c.email, password: c.password, name: c.name, role: 'COACH' }
    });
    // 2. Upsert Coach
    const coach = await prisma.coach.upsert({
      where: { id: c.id || 'new' },
      update: { specialty: c.specialty, perms: c.perms, groupId: c.groupId, userId: user.id },
      create: { id: c.id, specialty: c.specialty, perms: c.perms, groupId: c.groupId, userId: user.id }
    });
    res.json(coach);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/groups', async (req, res) => {
  const g = req.body;
  try {
    const group = await prisma.group.upsert({
      where: { id: g.id || 'new' },
      update: { name: g.name, color: g.color },
      create: { id: g.id, name: g.name, color: g.color }
    });
    res.json(group);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/trainings', async (req, res) => {
  const t = req.body;
  try {
    const training = await prisma.training.upsert({
      where: { id: t.id || 'new' },
      update: { 
        groupId: t.groupId, coachId: t.coachId, days: t.days, 
        time: t.time, duration: t.duration, field: t.field, 
        title: t.title, trainingFocus: t.trainingFocus, note: t.note 
      },
      create: { 
        id: t.id, groupId: t.groupId, coachId: t.coachId, days: t.days, 
        time: t.time, duration: t.duration, field: t.field, 
        title: t.title, trainingFocus: t.trainingFocus, note: t.note 
      }
    });
    res.json(training);
  } catch (e) {
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
        playerId: e.playerId, 
        coachId: e.coachId, 
        date: new Date(e.date), 
        note: e.note, 
        speed: parseInt(e.speed) || 80, 
        technique: parseInt(e.technique) || 80, 
        teamwork: parseInt(e.teamwork) || 80
      },
      create: { 
        id: e.id, 
        playerId: e.playerId, 
        coachId: e.coachId, 
        date: new Date(e.date), 
        note: e.note, 
        speed: parseInt(e.speed) || 80, 
        technique: parseInt(e.technique) || 80, 
        teamwork: parseInt(e.teamwork) || 80
      }
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
    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { playerId: id } }),
      prisma.evaluation.deleteMany({ where: { playerId: id } }),
      prisma.player.delete({ where: { id } })
    ]);
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
    await prisma.$transaction([
      prisma.training.deleteMany({ where: { coachId: id } }),
      prisma.evaluation.deleteMany({ where: { coachId: id } }),
      prisma.attendance.updateMany({ where: { coachId: id }, data: { coachId: null } }),
      prisma.group.updateMany({ where: { coachId: id }, data: { coachId: null } }),
      prisma.coach.delete({ where: { id } })
    ]);
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

