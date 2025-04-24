-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('COMMON', 'RARE', 'MYTHIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "Quality" AS ENUM ('COMMON', 'RARE', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "CardScope" AS ENUM ('GLOBAL', 'SCENARIO');

-- CreateEnum
CREATE TYPE "AttributeKey" AS ENUM ('PHYSICAL', 'MEDICAL', 'ENERGY', 'SURVIVAL', 'INSIGHT', 'SOCIAL', 'WISDOM', 'AGILITY', 'SPIRIT', 'CONSTITUTION', 'VOID');

-- CreateEnum
CREATE TYPE "EffectType" AS ENUM ('PASSIVE', 'CONSUME', 'RETURN', 'KEY');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('DUST', 'FAITH', 'ECHO');

-- CreateEnum
CREATE TYPE "ScenarioStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReviewResult" AS ENUM ('APPROVED', 'REJECTED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "GrantTiming" AS ENUM ('ENTRY', 'NODE', 'CLEAR');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "old_gods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "alias" TEXT,
    "personality" TEXT NOT NULL,
    "style_prompt" TEXT NOT NULL,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "old_gods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_draw" TIMESTAMP(3),
    "shared_today" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "instruction" TEXT NOT NULL DEFAULT '',
    "scope" "CardScope" NOT NULL DEFAULT 'GLOBAL',
    "rarity" "Rarity" NOT NULL DEFAULT 'COMMON',
    "carry_out" BOOLEAN NOT NULL DEFAULT false,
    "art_url" TEXT,
    "origin_scenario_id" TEXT,
    "max_durability" INTEGER,
    "old_god_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_attributes" (
    "card_id" TEXT NOT NULL,
    "key" "AttributeKey" NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "card_attributes_pkey" PRIMARY KEY ("card_id","key")
);

-- CreateTable
CREATE TABLE "card_effects" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "implementation_id" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "target" TEXT,

    CONSTRAINT "card_effects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "effect_implementations" (
    "id" TEXT NOT NULL,
    "type" "EffectType" NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "param_schema" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "effect_implementations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_instances" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "quality" "Quality" NOT NULL DEFAULT 'COMMON',
    "durability" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scenario_run_id" TEXT,

    CONSTRAINT "card_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_draws" (
    "user_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "can_draw_again" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_draws_pkey" PRIMARY KEY ("user_id","date")
);

-- CreateTable
CREATE TABLE "scenarios" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "genres" TEXT[],
    "difficulty" INTEGER NOT NULL,
    "recommended_deck" JSONB,
    "status" "ScenarioStatus" NOT NULL DEFAULT 'DRAFT',
    "current_version_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_versions" (
    "id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "version" DOUBLE PRECISION NOT NULL,
    "changelog" TEXT,
    "blueprint_json" JSONB NOT NULL,
    "node_count" INTEGER NOT NULL,
    "edge_count" INTEGER NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),
    "reviewer_id" TEXT,
    "review_result" "ReviewResult",
    "review_comment" TEXT,

    CONSTRAINT "scenario_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_card_grants" (
    "id" TEXT NOT NULL,
    "scenario_version_id" TEXT NOT NULL,
    "timing" "GrantTiming" NOT NULL,
    "node_id" TEXT,
    "card_id" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "exportable" BOOLEAN NOT NULL DEFAULT false,
    "chance" DOUBLE PRECISION,

    CONSTRAINT "scenario_card_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_metrics" (
    "scenario_version_id" TEXT NOT NULL,
    "avg_clear_minutes" DOUBLE PRECISION,
    "fail_rate" DOUBLE PRECISION,
    "branch_coverage" DOUBLE PRECISION,
    "inflation_factor" DOUBLE PRECISION,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenario_metrics_pkey" PRIMARY KEY ("scenario_version_id")
);

-- CreateTable
CREATE TABLE "scenario_runs" (
    "id" TEXT NOT NULL,
    "scenario_version_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "state_json" JSONB NOT NULL,
    "path_json" JSONB,
    "dice_log_json" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "scenario_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_reviews" (
    "id" TEXT NOT NULL,
    "scenario_version_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "result" "ReviewResult" NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenario_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_comments" (
    "id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenario_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ScenarioCards" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ScenarioCards_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "effect_implementations_code_key" ON "effect_implementations"("code");

-- CreateIndex
CREATE INDEX "card_instances_user_id_idx" ON "card_instances"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "scenarios_slug_key" ON "scenarios"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "scenarios_current_version_id_key" ON "scenarios"("current_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "scenario_versions_scenario_id_version_key" ON "scenario_versions"("scenario_id", "version");

-- CreateIndex
CREATE INDEX "scenario_card_grants_scenario_version_id_timing_idx" ON "scenario_card_grants"("scenario_version_id", "timing");

-- CreateIndex
CREATE INDEX "scenario_reviews_scenario_version_id_idx" ON "scenario_reviews"("scenario_version_id");

-- CreateIndex
CREATE INDEX "scenario_comments_scenario_id_idx" ON "scenario_comments"("scenario_id");

-- CreateIndex
CREATE INDEX "_ScenarioCards_B_index" ON "_ScenarioCards"("B");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_old_god_id_fkey" FOREIGN KEY ("old_god_id") REFERENCES "old_gods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_origin_scenario_id_fkey" FOREIGN KEY ("origin_scenario_id") REFERENCES "scenarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_attributes" ADD CONSTRAINT "card_attributes_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_effects" ADD CONSTRAINT "card_effects_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_effects" ADD CONSTRAINT "card_effects_implementation_id_fkey" FOREIGN KEY ("implementation_id") REFERENCES "effect_implementations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_instances" ADD CONSTRAINT "card_instances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_instances" ADD CONSTRAINT "card_instances_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_instances" ADD CONSTRAINT "card_instances_scenario_run_id_fkey" FOREIGN KEY ("scenario_run_id") REFERENCES "scenario_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_draws" ADD CONSTRAINT "card_draws_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "scenario_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_versions" ADD CONSTRAINT "scenario_versions_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_card_grants" ADD CONSTRAINT "scenario_card_grants_scenario_version_id_fkey" FOREIGN KEY ("scenario_version_id") REFERENCES "scenario_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_card_grants" ADD CONSTRAINT "scenario_card_grants_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_metrics" ADD CONSTRAINT "scenario_metrics_scenario_version_id_fkey" FOREIGN KEY ("scenario_version_id") REFERENCES "scenario_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_runs" ADD CONSTRAINT "scenario_runs_scenario_version_id_fkey" FOREIGN KEY ("scenario_version_id") REFERENCES "scenario_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_runs" ADD CONSTRAINT "scenario_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_reviews" ADD CONSTRAINT "scenario_reviews_scenario_version_id_fkey" FOREIGN KEY ("scenario_version_id") REFERENCES "scenario_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_comments" ADD CONSTRAINT "scenario_comments_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_comments" ADD CONSTRAINT "scenario_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ScenarioCards" ADD CONSTRAINT "_ScenarioCards_A_fkey" FOREIGN KEY ("A") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ScenarioCards" ADD CONSTRAINT "_ScenarioCards_B_fkey" FOREIGN KEY ("B") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
