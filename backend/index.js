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

