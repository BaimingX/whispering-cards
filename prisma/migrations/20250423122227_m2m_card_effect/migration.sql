/*
  Warnings:

  - You are about to drop the column `card_id` on the `card_effects` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "card_effects" DROP CONSTRAINT "card_effects_card_id_fkey";

-- AlterTable
ALTER TABLE "card_effects" DROP COLUMN "card_id";

-- CreateTable
CREATE TABLE "_card_effects_link" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_card_effects_link_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_card_effects_link_B_index" ON "_card_effects_link"("B");

-- AddForeignKey
ALTER TABLE "_card_effects_link" ADD CONSTRAINT "_card_effects_link_A_fkey" FOREIGN KEY ("A") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_card_effects_link" ADD CONSTRAINT "_card_effects_link_B_fkey" FOREIGN KEY ("B") REFERENCES "card_effects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
