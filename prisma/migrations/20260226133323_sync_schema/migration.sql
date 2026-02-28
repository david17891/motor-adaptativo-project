-- AlterTable
ALTER TABLE "evaluations" ADD COLUMN     "durationMinutes" INTEGER;

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "hint" TEXT,
ADD COLUMN     "subarea" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastActiveDate" TIMESTAMP(3),
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "subject_areas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_topics" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adaptive_evaluations" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetArea" TEXT NOT NULL,
    "targetSubarea" TEXT,
    "totalQuestions" INTEGER NOT NULL DEFAULT 10,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER,

    CONSTRAINT "adaptive_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dynamic_sessions" (
    "id" TEXT NOT NULL,
    "adaptiveEvaluationId" TEXT,
    "studentId" TEXT NOT NULL,
    "estimatedScore" DOUBLE PRECISION,
    "currentLevel" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "practiceArea" TEXT,
    "practiceSubarea" TEXT,
    "durationMinutes" INTEGER,
    "totalQuestions" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "dynamic_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dynamic_session_answers" (
    "id" TEXT NOT NULL,
    "dynamicSessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "presentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),
    "selectedOptionId" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "questionLevel" INTEGER NOT NULL,

    CONSTRAINT "dynamic_session_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subject_areas_name_key" ON "subject_areas"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subject_topics_areaId_name_key" ON "subject_topics"("areaId", "name");

-- CreateIndex
CREATE INDEX "adaptive_evaluations_groupId_idx" ON "adaptive_evaluations"("groupId");

-- CreateIndex
CREATE INDEX "dynamic_sessions_studentId_idx" ON "dynamic_sessions"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "dynamic_session_answers_dynamicSessionId_questionId_key" ON "dynamic_session_answers"("dynamicSessionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "dynamic_session_answers_dynamicSessionId_orderIndex_key" ON "dynamic_session_answers"("dynamicSessionId", "orderIndex");

-- AddForeignKey
ALTER TABLE "subject_topics" ADD CONSTRAINT "subject_topics_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "subject_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adaptive_evaluations" ADD CONSTRAINT "adaptive_evaluations_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dynamic_sessions" ADD CONSTRAINT "dynamic_sessions_adaptiveEvaluationId_fkey" FOREIGN KEY ("adaptiveEvaluationId") REFERENCES "adaptive_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dynamic_sessions" ADD CONSTRAINT "dynamic_sessions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dynamic_session_answers" ADD CONSTRAINT "dynamic_session_answers_dynamicSessionId_fkey" FOREIGN KEY ("dynamicSessionId") REFERENCES "dynamic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dynamic_session_answers" ADD CONSTRAINT "dynamic_session_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
