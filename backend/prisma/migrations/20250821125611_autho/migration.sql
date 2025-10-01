/*
  Warnings:

  - A unique constraint covering the columns `[auth0_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `auth0_id` VARCHAR(191) NULL,
    MODIFY `provider` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_auth0_id_key` ON `User`(`auth0_id`);
