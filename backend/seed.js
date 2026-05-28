import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const USERS = [
  { id: "admin", email: "admin@najd.sa", password: "Najd@2026", role: "ADMIN", name: "مدير النادي" },
  { id: "c1", email: "ahmed@najd.sa", password: "Coach@1234", role: "COACH", name: "أحمد سالم البقمي" },
  { id: "c2", email: "khaled@najd.sa", password: "Coach@5678", role: "COACH", name: "خالد مبارك العسيري" },
  { id: "c3", email: "saad@najd.sa", password: "Coach@9012", role: "COACH", name: "سعد الرشيدي" },
  { id: "par1", email: "aalghamdi@mail.com", password: "Parent@111", role: "PARENT", name: "عبدالله الغامدي" },
  { id: "par2", email: "saqahtani@mail.com", password: "Parent@222", role: "PARENT", name: "سعد القحطاني" },
  { id: "par3", email: "kzahrani@mail.com", password: "Parent@333", role: "PARENT", name: "خالد الزهراني" },
  { id: "par4", email: "ashahri@mail.com", password: "Parent@444", role: "PARENT", name: "أحمد الشهري" },
  { id: "par5", email: "adosari@mail.com", password: "Parent@555", role: "PARENT", name: "علي الدوسري" },
  { id: "par6", email: "aharbi@mail.com", password: "Parent@666", role: "PARENT", name: "عبدالرحمن الحربي" },
  { id: "par7", email: "fsobiee@mail.com", password: "Parent@777", role: "PARENT", name: "فهد السبيعي" },
];

const INIT_GROUPS = [
  { id: "g1", name: "تحت 11", color: "#06B6D4" },
  { id: "g2", name: "تحت 13", color: "#A855F7" },
  { id: "g3", name: "تحت 15", color: "#F59E0B" },
];

const INIT_COACHES = [
  { id: "c1", specialty: "مهارات فردية", groupId: "g1", userId: "c1", perms: { attendance: true, payments: true, evals: true, messages: true } },
  { id: "c2", specialty: "تكتيك وخطط", groupId: "g2", userId: "c2", perms: { attendance: true, payments: true, evals: true, messages: true } },
  { id: "c3", specialty: "لياقة بدنية", groupId: "g3", userId: "c3", perms: { attendance: true, payments: true, evals: true, messages: true } },
];

const INIT_PARENTS = [
  { id: "par1", userId: "par1" },
  { id: "par2", userId: "par2" },
  { id: "par3", userId: "par3" },
  { id: "par4", userId: "par4" },
  { id: "par5", userId: "par5" },
  { id: "par6", userId: "par6" },
  { id: "par7", userId: "par7" },
];

const INIT_PLAYERS = [
  { id: "p1", name: "محمد عبدالله الغامدي", age: 12, groupId: "g2", phone: "0501234567", status: "نشط", score: 85, weight: 48, height: 158, position: "مهاجم", parentId: "par1" },
  { id: "p2", name: "فيصل سعد القحطاني", age: 10, groupId: "g1", phone: "0507654321", status: "نشط", score: 90, weight: 38, height: 142, position: "جناح أيمن", parentId: "par2" },
  { id: "p3", name: "عمر خالد الزهراني", age: 14, groupId: "g3", phone: "0509876543", status: "نشط", score: 78, weight: 58, height: 170, position: "وسط", parentId: "par3" },
  { id: "p4", name: "يوسف أحمد الشهري", age: 11, groupId: "g2", phone: "0501112233", status: "موقوف", score: 65, weight: 42, height: 150, position: "مدافع", parentId: "par4" },
  { id: "p5", name: "بندر علي الدوسري", age: 13, groupId: "g3", phone: "0504445566", status: "نشط", score: 92, weight: 54, height: 165, position: "جناح أيسر", parentId: "par5" },
  { id: "p6", name: "سلطان محمد العتيبي", age: 9, groupId: "g1", phone: "0506667788", status: "نشط", score: 88, weight: 32, height: 135, position: "مهاجم", parentId: "par1" },
  { id: "p7", name: "نايف عبدالرحمن الحربي", age: 12, groupId: "g2", phone: "0508889900", status: "نشط", score: 81, weight: 46, height: 155, position: "وسط", parentId: "par6" },
  { id: "p8", name: "ريان فهد السبيعي", age: 10, groupId: "g1", phone: "0502223344", status: "نشط", score: 74, weight: 36, height: 140, position: "مدافع", parentId: "par7" },
];

const INIT_PAYMENTS = [
  { id: "pay1", playerId: "p1", playerName: "محمد عبدالله الغامدي", coachId: "c2", coachName: "خالد مبارك العسيري", type: "subscription", month: "مارس 2026", amount: 350, date: new Date("2026-03-05"), note: "دفع نقدي" },
  { id: "pay2", playerId: "p1", playerName: "محمد عبدالله الغامدي", coachId: "c2", coachName: "خالد مبارك العسيري", type: "subscription", month: "أبريل 2026", amount: 350, date: new Date("2026-04-03"), note: "تحويل بنكي" },
  { id: "pay3", playerId: "p1", playerName: "محمد عبدالله الغامدي", coachId: "c2", coachName: "خالد مبارك العسيري", type: "uniform", month: "مارس 2026", amount: 180, date: new Date("2026-03-10"), note: "طقم تدريب" },
  { id: "pay4", playerId: "p2", playerName: "فيصل سعد القحطاني", coachId: "c1", coachName: "أحمد سالم البقمي", type: "subscription", month: "أبريل 2026", amount: 350, date: new Date("2026-04-02"), note: "دفع نقدي" },
  { id: "pay5", playerId: "p2", playerName: "فيصل سعد القحطاني", coachId: "c1", coachName: "أحمد سالم البقمي", type: "bag", month: "أبريل 2026", amount: 95, date: new Date("2026-04-08"), note: "شنطة رياضية" },
  { id: "pay6", playerId: "p5", playerName: "بندر علي الدوسري", coachId: "c3", coachName: "سعد الرشيدي", type: "subscription", month: "أبريل 2026", amount: 350, date: new Date("2026-04-01"), note: "تحويل بنكي" },
  { id: "pay7", playerId: "p5", playerName: "بندر علي الدوسري", coachId: "c3", coachName: "سعد الرشيدي", type: "jersey", month: "مارس 2026", amount: 120, date: new Date("2026-03-20"), note: "قميص رسمي" },
  { id: "pay8", playerId: "p6", playerName: "سلطان محمد العتيبي", coachId: "c1", coachName: "أحمد سالم البقمي", type: "subscription", month: "أبريل 2026", amount: 350, date: new Date("2026-04-04"), note: "دفع نقدي" },
];

const INIT_ATTENDANCE = [
  { id: "att1", date: new Date("2026-04-20"), groupId: "g2", coachId: "c2", records: { p1: "حاضر", p4: "غائب", p7: "حاضر" } },
  { id: "att2", date: new Date("2026-04-17"), groupId: "g1", coachId: "c1", records: { p2: "حاضر", p6: "حاضر", p8: "بعذر" } },
  { id: "att3", date: new Date("2026-04-22"), groupId: "g2", coachId: "c2", records: { p1: "حاضر", p4: "بعذر", p7: "حاضر" } },
];

const INIT_EVALS = [
  { id: "ev1", playerId: "p1", coachId: "c2", date: new Date("2026-04-20"), note: "أداء ممتاز في التمرير، يحتاج تحسين الضربات الرأسية", speed: 80, technique: 88, teamwork: 90 },
  { id: "ev2", playerId: "p7", coachId: "c2", date: new Date("2026-04-20"), note: "تحسن ملحوظ في الدفاع، يجب التركيز على اللياقة", speed: 75, technique: 78, teamwork: 85 },
  { id: "ev3", playerId: "p2", coachId: "c1", date: new Date("2026-04-17"), note: "سرعة رائعة، التكتيك يحتاج تطوير", speed: 90, technique: 85, teamwork: 88 },
];

const INIT_MESSAGES = [
  { id: "msg1", from: "admin", fromName: "الإدارة", to: "par1", toName: "عبدالله الغامدي", text: "تذكير: موعد التدريب غداً الساعة 5 مساءً في ملعب B", date: new Date("2026-04-22"), read: false },
  { id: "msg2", from: "c2", fromName: "خالد مبارك العسيري", to: "par1", toName: "عبدالله الغامدي", text: "أداء محمد ممتاز هذا الأسبوع، أنصح بإضافة تمارين في المنزل", date: new Date("2026-04-20"), read: true },
  { id: "msg3", from: "admin", fromName: "الإدارة", to: "par4", toName: "أحمد الشهري", text: "لاحظنا تغيباً متكرراً ليوسف، نرجو التواصل مع الإدارة", date: new Date("2026-04-19"), read: false },
  { id: "msg4", from: "par1", fromName: "عبدالله الغامدي", to: "c2", toName: "خالد مبارك", text: "شكراً على الاهتمام، هل يمكن تدريب إضافي الجمعة؟", date: new Date("2026-04-21"), read: true },
];

async function main() {
  console.log("Cleaning database...");
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

  console.log("Seeding database...");

  // 1. Seed Users
  for (const u of USERS) {
    await prisma.user.create({
      data: u,
    });
  }

  // 2. Seed Groups
  for (const g of INIT_GROUPS) {
    await prisma.group.create({
      data: g,
    });
  }

  // 3. Seed Coaches
  for (const c of INIT_COACHES) {
    await prisma.coach.create({
      data: c,
    });
  }

  // 4. Seed Parents
  for (const p of INIT_PARENTS) {
    await prisma.parent.create({
      data: p,
    });
  }

  // 5. Seed Players
  for (const pl of INIT_PLAYERS) {
    await prisma.player.create({
      data: pl,
    });
  }

  // 6. Seed Payments
  for (const pay of INIT_PAYMENTS) {
    await prisma.payment.create({
      data: pay,
    });
  }

  // 7. Seed Attendance
  for (const att of INIT_ATTENDANCE) {
    await prisma.attendance.create({
      data: att,
    });
  }

  // 8. Seed Evals
  for (const ev of INIT_EVALS) {
    await prisma.evaluation.create({
      data: ev,
    });
  }

  // 9. Seed Messages
  for (const msg of INIT_MESSAGES) {
    await prisma.message.create({
      data: msg,
    });
  }

  console.log("Seeding successfully completed!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
