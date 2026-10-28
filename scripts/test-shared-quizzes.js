// Integration test: all fixtures and writes are rolled back, even on failure.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
require("@next/env").loadEnvConfig(process.cwd());

function loadTs(file, overrides = {}) {
  const filename = path.resolve(file);
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = mod.require.bind(mod);
  mod.require = name => name in overrides ? overrides[name] : originalRequire(name);
  mod._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, filename);
  return mod.exports;
}

async function main() {
  const { db } = loadTs("lib/db.ts");
  const rollback = new Error("ROLLBACK_TEST_FIXTURES");
  let checks = 0;
  try {
    await db.$transaction(async tx => {
      const stamp = `${Date.now()}-${process.pid}`;
      const teacher = await tx.user.create({ data: { fullName: "Quiz test teacher", phoneNumber: `test-teacher-${stamp}`, role: "TEACHER" } });
      const student = await tx.user.create({ data: { fullName: "Quiz test student", phoneNumber: `test-student-${stamp}` } });
      const courses = [];
      for (let i = 0; i < 3; i++) courses.push(await tx.course.create({ data: { title: `Quiz test ${i}`, userId: teacher.id, price: 100, isPublished: true } }));
      let currentUser = teacher;
      const scopedDb = new Proxy(tx, { get: (target, name) => name === "$transaction" ? callback => callback(scopedDb) : target[name] });
      const overrides = {
        "@/lib/db": { db: scopedDb },
        "@/lib/auth": { auth: async () => ({ userId: currentUser?.id, user: currentUser }) },
        "@/lib/utils": { parseQuizOptions: value => value ? JSON.parse(value) : [], stringifyQuizOptions: JSON.stringify },
      };
      const access = loadTs("lib/quiz-access.ts", overrides);
      overrides["@/lib/quiz-access"] = access;
      const createRoute = loadTs("app/api/teacher/quizzes/route.ts", overrides);
      const editRoute = loadTs("app/api/teacher/quizzes/[quizId]/route.ts", overrides);
      const request = data => new Request("http://localhost/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const payload = { title: "Shared quiz test", courseIds: [courses[0].id, courses[1].id, courses[1].id], isFree: false, maxAttempts: 3, questions: [{ text: "True?", type: "TRUE_FALSE", correctAnswer: "true", points: 1 }] };
      let response = await createRoute.POST(request(payload));
      assert.equal(response.status, 200, await response.clone().text()); checks++;
      let quiz = await response.json();
      assert.equal(quiz.courses.length, 2); checks++;
      for (const course of courses.slice(0, 2)) {
        const found = await tx.course.findUnique({ where: { id: course.id }, include: { quizzes: true } });
        assert.equal(found.quizzes[0].id, quiz.id); checks++;
      }
      const canAccess = course => access.canAccessQuiz(student.id, course.id, quiz.id);
      assert.equal(await canAccess(courses[1]), false); checks++;
      await tx.purchase.create({ data: { userId: student.id, courseId: courses[1].id, status: "PENDING" } });
      assert.equal(await canAccess(courses[1]), false); checks++;
      await tx.purchase.update({ where: { userId_courseId: { userId: student.id, courseId: courses[1].id } }, data: { status: "ACTIVE" } });
      assert.equal(await canAccess(courses[1]), true); checks++;
      await tx.purchase.deleteMany({ where: { userId: student.id } });
      await tx.course.update({ where: { id: courses[1].id }, data: { price: 0 } });
      assert.equal(await canAccess(courses[1]), true); checks++;
      await tx.course.update({ where: { id: courses[1].id }, data: { price: 100 } });
      await tx.quiz.update({ where: { id: quiz.id }, data: { isFree: true } });
      assert.equal(await canAccess(courses[1]), true); checks++;
      assert.equal(await canAccess(courses[2]), false); checks++;
      await tx.quiz.update({ where: { id: quiz.id }, data: { isPublished: false } });
      assert.equal(await canAccess(courses[1]), false); checks++;
      await tx.quiz.update({ where: { id: quiz.id }, data: { isPublished: true } });
      await tx.course.update({ where: { id: courses[1].id }, data: { isPublished: false } });
      assert.equal(await canAccess(courses[1]), false); checks++;
      await tx.course.update({ where: { id: courses[1].id }, data: { isPublished: true } });

      currentUser = student;
      const routeContext = { params: Promise.resolve({ courseId: courses[1].id, quizId: quiz.id }) };
      const base = "app/api/courses/[courseId]/quizzes/[quizId]/";
      for (const file of ["info/route.ts", "navigation/route.ts", "route.ts"]) {
        response = await loadTs(base + file, overrides).GET(request({}), routeContext);
        assert.equal(response.status, 200, `${file}: ${await response.clone().text()}`); checks++;
      }
      response = await loadTs(base + "submit/route.ts", overrides).POST(request({ answers: [{ questionId: quiz.questions[0].id, answer: "true" }] }), routeContext);
      assert.equal(response.status, 200, await response.clone().text()); checks++;
      assert.equal((await response.json()).percentage, 100); checks++;
      response = await loadTs(base + "result/route.ts", overrides).GET(request({}), routeContext);
      assert.equal(response.status, 200, await response.clone().text()); checks++;
      response = await loadTs(base + "retry/route.ts", overrides).POST(request({}), routeContext);
      assert.equal(response.status, 200, await response.clone().text()); checks++;

      currentUser = teacher;
      response = await editRoute.PATCH(request({ ...payload, questions: [{ ...payload.questions[0], id: quiz.questions[0].id }], courseIds: [courses[1].id, courses[2].id], isFree: true }), { params: Promise.resolve({ quizId: quiz.id }) });
      assert.equal(response.status, 200, await response.clone().text()); checks++;
      assert.equal(await tx.quizAnswer.count({ where: { questionId: quiz.questions[0].id } }), 1); checks++;
      assert.equal(await canAccess(courses[0]), false); checks++;
      assert.equal(await canAccess(courses[2]), true); checks++;
      response = await createRoute.POST(request({ ...payload, courseIds: [] }));
      assert.equal(response.status, 400); checks++;
      response = await createRoute.POST(request({ ...payload, courseIds: ["missing-course"] }));
      assert.equal(response.status, 404); checks++;
      currentUser = student;
      response = await createRoute.POST(request(payload));
      assert.equal(response.status, 403); checks++;
      currentUser = { ...teacher, role: "ADMIN" };
      response = await createRoute.POST(request({ ...payload, title: "Admin quiz", isFree: true }));
      assert.equal(response.status, 200, await response.clone().text()); checks++;
      currentUser = teacher;
      const courseRoute = loadTs("app/api/courses/[courseId]/route.ts", overrides);
      response = await courseRoute.DELETE(request({}), { params: Promise.resolve({ courseId: courses[1].id }) });
      assert.equal(response.status, 200, await response.clone().text()); checks++;
      const preserved = await tx.quiz.findUnique({ where: { id: quiz.id } });
      assert.equal(preserved.courseId, courses[2].id); checks++;
      throw rollback;
    }, { timeout: 120000, maxWait: 15000 });
  } catch (error) {
    if (error !== rollback) throw error;
  } finally {
    await db.$disconnect();
  }
  console.log(`Passed ${checks} shared quiz integration checks; all test data rolled back.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
