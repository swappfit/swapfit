/*
  Warnings:

  - You are about to drop the column `notes` on the `dietlog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `dietlog` DROP COLUMN `notes`;

-- AlterTable
ALTER TABLE `post` ADD COLUMN `imageUrl` VARCHAR(191) NULL;
