/*
  Warnings:

  - You are about to drop the column `currency` on the `transaction` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `transaction` DROP COLUMN `currency`,
    DROP COLUMN `status`,
    ADD COLUMN `currencyCode` VARCHAR(191) NOT NULL DEFAULT 'USD',
    ADD COLUMN `orderId` VARCHAR(191) NULL,
    ADD COLUMN `paymentProvider` VARCHAR(191) NULL,
    ADD COLUMN `paymentStatus` VARCHAR(191) NULL,
    ADD COLUMN `referenceId` VARCHAR(191) NULL,
    MODIFY `description` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Transaction_orderId_idx` ON `Transaction`(`orderId`);
