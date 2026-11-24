-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "tipo_condicion" AS ENUM ('diagnostico', 'alergia');

-- CreateEnum
CREATE TYPE "forma_medicacion" AS ENUM ('comprimido', 'gota', 'ml', 'aplicacion');

-- CreateEnum
CREATE TYPE "estado_medicacion" AS ENUM ('activa', 'discontinuada');

-- CreateEnum
CREATE TYPE "estado_toma" AS ENUM ('tomada', 'omitida');

-- CreateTable
CREATE TABLE "cuidador" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuidador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persona_a_cargo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cuidador_id" UUID NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "fecha_nacimiento" DATE NOT NULL,
    "dni" TEXT,
    "parentesco" TEXT,
    "obra_social" TEXT,
    "numero_afiliado" TEXT,
    "notas" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "persona_a_cargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "condicion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "persona_id" UUID NOT NULL,
    "tipo" "tipo_condicion" NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "condicion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medico" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "persona_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "especialidad" TEXT,
    "matricula" TEXT,

    CONSTRAINT "medico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "persona_id" UUID NOT NULL,
    "medico_id" UUID,
    "droga" TEXT NOT NULL,
    "nombre_comercial" TEXT,
    "concentracion" TEXT NOT NULL,
    "cantidad_por_toma" DECIMAL(5,2) NOT NULL,
    "forma" "forma_medicacion" NOT NULL,
    "via" TEXT,
    "motivo" TEXT,
    "indicaciones" TEXT,
    "es_sos" BOOLEAN NOT NULL DEFAULT false,
    "estado" "estado_medicacion" NOT NULL DEFAULT 'activa',
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE,
    "motivo_baja" TEXT,

    CONSTRAINT "medicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horario_toma" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "medicacion_id" UUID NOT NULL,
    "hora" TIME NOT NULL,
    -- NOT NULL agregado a mano: Prisma no lo genera en listas.
    "dias_semana" SMALLINT[] NOT NULL DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6]::SMALLINT[],

    CONSTRAINT "horario_toma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toma" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "horario_id" UUID NOT NULL,
    "medicacion_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_programada" TIME NOT NULL,
    "estado" "estado_toma" NOT NULL,
    "registrada_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "toma_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "toma_horario_id_fecha_key" ON "toma"("horario_id", "fecha");

-- AddForeignKey
ALTER TABLE "persona_a_cargo" ADD CONSTRAINT "persona_a_cargo_cuidador_id_fkey" FOREIGN KEY ("cuidador_id") REFERENCES "cuidador"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condicion" ADD CONSTRAINT "condicion_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "persona_a_cargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medico" ADD CONSTRAINT "medico_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "persona_a_cargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicacion" ADD CONSTRAINT "medicacion_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "persona_a_cargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicacion" ADD CONSTRAINT "medicacion_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "medico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario_toma" ADD CONSTRAINT "horario_toma_medicacion_id_fkey" FOREIGN KEY ("medicacion_id") REFERENCES "medicacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toma" ADD CONSTRAINT "toma_horario_id_fkey" FOREIGN KEY ("horario_id") REFERENCES "horario_toma"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toma" ADD CONSTRAINT "toma_medicacion_id_fkey" FOREIGN KEY ("medicacion_id") REFERENCES "medicacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
