/*
  Warnings:

  - You are about to drop the `_card_effects_link` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `card_effects` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_card_effects_link" DROP CONSTRAINT "_card_effects_link_A_fkey";

-- DropForeignKey
ALTER TABLE "_card_effects_link" DROP CONSTRAINT "_card_effects_link_B_fkey";

-- DropForeignKey
ALTER TABLE "card_effects" DROP CONSTRAINT "card_effects_implementation_id_fkey";

-- DropTable
DROP TABLE "_card_effects_link";

-- DropTable
DROP TABLE "card_effects";

-- CreateTable
CREATE TABLE "card_effect_links" (
    "card_id" TEXT NOT NULL,
    "implementation_id" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "target" TEXT,

    CONSTRAINT "card_effect_links_pkey" PRIMARY KEY ("card_id","implementation_id")
);

-- AddForeignKey
ALTER TABLE "card_effect_links" ADD CONSTRAINT "card_effect_links_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_effect_links" ADD CONSTRAINT "card_effect_links_implementation_id_fkey" FOREIGN KEY ("implementation_id") REFERENCES "effect_implementations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
