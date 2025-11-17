-- AlterTable
ALTER TABLE `checkin` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    ADD COLUMN `verifiedByGymStaffId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `CheckIn` ADD CONSTRAINT `CheckIn_verifiedByGymStaffId_fkey` FOREIGN KEY (`verifiedByGymStaffId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
