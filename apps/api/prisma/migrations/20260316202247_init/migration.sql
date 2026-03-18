-- CreateEnum
CREATE TYPE "CourtType" AS ENUM ('5v5', '7v7', '11v11');

-- CreateEnum
CREATE TYPE "SurfaceType" AS ENUM ('artificial_grass', 'natural_grass');

-- CreateEnum
CREATE TYPE "CustomerSegment" AS ENUM ('new', 'occasional', 'regular', 'vip');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('ar', 'en');

-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('regular', 'birthday', 'private_event');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('confirmed', 'cancelled', 'completed', 'no_show');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('birthday', 'corporate', 'tournament', 'private_event');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('web_test', 'whatsapp', 'voice');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('active', 'waiting_customer', 'waiting_system', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "Intent" AS ENUM ('booking', 'cancellation', 'inquiry', 'general_inquiry', 'event', 'modification', 'unknown');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('owner', 'manager', 'staff');

-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('agent', 'admin', 'web_test');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant', 'system', 'tool');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('admin', 'agent', 'system');

-- CreateTable
CREATE TABLE "courts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "name_ar" VARCHAR(100) NOT NULL,
    "type" "CourtType" NOT NULL,
    "surface" "SurfaceType" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "hourly_rate" DECIMAL(10,2) NOT NULL,
    "peak_rate" DECIMAL(10,2) NOT NULL,
    "google_cal_id" VARCHAR(255),
    "location_lat" DECIMAL(10,8),
    "location_lng" DECIMAL(11,8),
    "maps_link" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "courts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phone" VARCHAR(20) NOT NULL,
    "name" VARCHAR(200),
    "email" VARCHAR(255),
    "preferred_lang" "Language" NOT NULL DEFAULT 'ar',
    "segment" "CustomerSegment" NOT NULL DEFAULT 'new',
    "total_bookings" INTEGER NOT NULL DEFAULT 0,
    "total_spent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "first_contact" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_contact" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "court_id" UUID NOT NULL,
    "created_by_conversation_id" UUID,
    "booking_type" "BookingType" NOT NULL DEFAULT 'regular',
    "source" "BookingSource" NOT NULL DEFAULT 'agent',
    "status" "BookingStatus" NOT NULL DEFAULT 'confirmed',
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ NOT NULL,
    "duration_mins" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cancel_reason" TEXT,
    "cancelled_at" TIMESTAMPTZ,
    "confirmed_at" TIMESTAMPTZ,
    "cancel_token" VARCHAR(255),
    "modify_token" VARCHAR(255),

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_packages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "name_ar" VARCHAR(100) NOT NULL,
    "type" "EventType" NOT NULL,
    "description" TEXT,
    "description_ar" TEXT,
    "base_price" DECIMAL(10,2) NOT NULL,
    "max_guests" INTEGER,
    "includes_decorations" BOOLEAN NOT NULL DEFAULT false,
    "includes_catering" BOOLEAN NOT NULL DEFAULT false,
    "duration_mins" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_extras" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_id" UUID NOT NULL,
    "package_id" UUID,
    "event_type" "EventType" NOT NULL,
    "guest_count" INTEGER,
    "decorations" BOOLEAN NOT NULL DEFAULT false,
    "catering" BOOLEAN NOT NULL DEFAULT false,
    "special_requests" TEXT,
    "package_name" VARCHAR(100),
    "package_price" DECIMAL(10,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_extras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "court_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "day_of_week" INTEGER,
    "start_hour" INTEGER NOT NULL,
    "end_hour" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "is_peak" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "valid_from" DATE,
    "valid_until" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID,
    "channel" "Channel" NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'active',
    "intent" "Intent",
    "summary" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_at" TIMESTAMPTZ,
    "ended_at" TIMESTAMPTZ,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'staff',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'Asia/Amman',
    "slot_interval_mins" INTEGER NOT NULL DEFAULT 60,
    "min_booking_duration_mins" INTEGER NOT NULL DEFAULT 60,
    "max_booking_duration_mins" INTEGER NOT NULL DEFAULT 180,
    "min_lead_time_mins" INTEGER NOT NULL DEFAULT 60,
    "cancellation_cutoff_mins" INTEGER NOT NULL DEFAULT 180,
    "modification_cutoff_mins" INTEGER NOT NULL DEFAULT 180,
    "opening_time" VARCHAR(10) NOT NULL DEFAULT '09:00',
    "closing_time" VARCHAR(10) NOT NULL DEFAULT '23:00',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "booking_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "court_unavailability" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "court_id" UUID,
    "created_by_admin_id" UUID,
    "reason" VARCHAR(255) NOT NULL,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "court_unavailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "content_json" JSONB,
    "tool_name" VARCHAR(120),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_type" "AuditActorType" NOT NULL,
    "actor_id" UUID,
    "entity_type" VARCHAR(120) NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" VARCHAR(120) NOT NULL,
    "before_json" JSONB,
    "after_json" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "courts_is_active_idx" ON "courts"("is_active");

-- CreateIndex
CREATE INDEX "courts_type_idx" ON "courts"("type");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_segment_idx" ON "customers"("segment");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_cancel_token_key" ON "bookings"("cancel_token");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_modify_token_key" ON "bookings"("modify_token");

-- CreateIndex
CREATE INDEX "bookings_customer_id_idx" ON "bookings"("customer_id");

-- CreateIndex
CREATE INDEX "bookings_court_id_idx" ON "bookings"("court_id");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_court_id_start_time_end_time_idx" ON "bookings"("court_id", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "event_packages_type_idx" ON "event_packages"("type");

-- CreateIndex
CREATE INDEX "event_packages_is_active_idx" ON "event_packages"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "event_extras_booking_id_key" ON "event_extras"("booking_id");

-- CreateIndex
CREATE INDEX "event_extras_package_id_idx" ON "event_extras"("package_id");

-- CreateIndex
CREATE INDEX "pricing_rules_court_id_idx" ON "pricing_rules"("court_id");

-- CreateIndex
CREATE INDEX "pricing_rules_day_of_week_idx" ON "pricing_rules"("day_of_week");

-- CreateIndex
CREATE INDEX "conversations_customer_id_idx" ON "conversations"("customer_id");

-- CreateIndex
CREATE INDEX "conversations_status_idx" ON "conversations"("status");

-- CreateIndex
CREATE INDEX "conversations_channel_idx" ON "conversations"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "admin_users_role_idx" ON "admin_users"("role");

-- CreateIndex
CREATE INDEX "court_unavailability_court_id_idx" ON "court_unavailability"("court_id");

-- CreateIndex
CREATE INDEX "conversation_messages_conversation_id_idx" ON "conversation_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_conversation_id_fkey" FOREIGN KEY ("created_by_conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_extras" ADD CONSTRAINT "event_extras_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_extras" ADD CONSTRAINT "event_extras_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "event_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "court_unavailability" ADD CONSTRAINT "court_unavailability_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "court_unavailability" ADD CONSTRAINT "court_unavailability_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
