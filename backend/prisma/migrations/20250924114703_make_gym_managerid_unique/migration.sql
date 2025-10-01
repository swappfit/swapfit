/*
  Warnings:

  - A unique constraint covering the columns `[managerId]` on the table `Gym` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Gym_managerId_key` ON `Gym`(`managerId`);
