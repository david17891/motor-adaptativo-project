-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'PROFESOR', 'ALUMNO');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ALUMNO',
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "profesorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "options" JSONB NOT NULL,
    "difficultyLevel" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_versions" (
    "id" TEXT NOT NULL,
    "versionCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_questions" (
    "id" TEXT NOT NULL,
    "examVersionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "exam_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "examVersionId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "results" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "result_answers" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionId" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "result_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "groups_tenantId_idx" ON "groups"("tenantId");

-- CreateIndex
CREATE INDEX "groups_profesorId_idx" ON "groups"("profesorId");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_groupId_studentId_key" ON "group_members"("groupId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_versions_versionCode_key" ON "exam_versions"("versionCode");

-- CreateIndex
CREATE UNIQUE INDEX "exam_questions_examVersionId_questionId_key" ON "exam_questions"("examVersionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_questions_examVersionId_orderIndex_key" ON "exam_questions"("examVersionId", "orderIndex");

-- CreateIndex
CREATE INDEX "evaluations_groupId_idx" ON "evaluations"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "results_evaluationId_studentId_key" ON "results"("evaluationId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "result_answers_resultId_questionId_key" ON "result_answers"("resultId", "questionId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_profesorId_fkey" FOREIGN KEY ("profesorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_examVersionId_fkey" FOREIGN KEY ("examVersionId") REFERENCES "exam_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_examVersionId_fkey" FOREIGN KEY ("examVersionId") REFERENCES "exam_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_answers" ADD CONSTRAINT "result_answers_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_answers" ADD CONSTRAINT "result_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
