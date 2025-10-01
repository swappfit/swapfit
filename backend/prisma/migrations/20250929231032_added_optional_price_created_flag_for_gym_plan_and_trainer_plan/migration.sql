-- AlterTable
ALTER TABLE `gymplan` ADD COLUMN `priceCreated` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `trainerplan` ADD COLUMN `priceCreated` BOOLEAN NOT NULL DEFAULT false;
