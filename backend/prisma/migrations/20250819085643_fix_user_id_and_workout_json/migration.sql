/*
  Warnings:

  - You are about to drop the column `fat` on the `dietlog` table. All the data in the column will be lost.
  - You are about to drop the column `foodName` on the `dietlog` table. All the data in the column will be lost.
  - Added the required column `mealName` to the `DietLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `equipment` to the `WorkoutSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `muscleGroups` to the `WorkoutSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `dietlog` DROP COLUMN `fat`,
    DROP COLUMN `foodName`,
    ADD COLUMN `fats` INTEGER NULL DEFAULT 0,
    ADD COLUMN `fiber` INTEGER NULL DEFAULT 0,
    ADD COLUMN `mealName` VARCHAR(191) NOT NULL,
    ADD COLUMN `sugar` INTEGER NULL DEFAULT 0,
    MODIFY `protein` INTEGER NULL DEFAULT 0,
    MODIFY `carbs` INTEGER NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `memberprofile` ADD COLUMN `name` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `workoutlog` ADD COLUMN `notes` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `workoutsession` ADD COLUMN `duration` INTEGER NULL,
    ADD COLUMN `equipment` JSON NOT NULL,
    ADD COLUMN `intensity` VARCHAR(191) NULL,
    ADD COLUMN `muscleGroups` JSON NOT NULL,
    ADD COLUMN `notes` VARCHAR(191) NULL,
    ADD COLUMN `workoutName` VARCHAR(191) NULL,
    ADD COLUMN `workoutType` VARCHAR(191) NULL;

-- RenameIndex
ALTER TABLE `_conversationparticipants` RENAME INDEX `_conversationparticipants_AB_unique` TO `_ConversationParticipants_AB_unique`;

-- RenameIndex
ALTER TABLE `_conversationparticipants` RENAME INDEX `_conversationparticipants_B_index` TO `_ConversationParticipants_B_index`;

-- RenameIndex
ALTER TABLE `_gymtrainers` RENAME INDEX `_gymtrainers_AB_unique` TO `_GymTrainers_AB_unique`;

-- RenameIndex
ALTER TABLE `_gymtrainers` RENAME INDEX `_gymtrainers_B_index` TO `_GymTrainers_B_index`;
