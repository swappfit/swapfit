/*
  Warnings:

  - You are about to drop the `multigymmemberprofile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `multigymmemberprofile` DROP FOREIGN KEY `MultiGymMemberProfile_userId_fkey`;

-- DropTable
DROP TABLE `multigymmemberprofile`;
