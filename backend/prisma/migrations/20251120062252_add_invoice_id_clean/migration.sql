/*
  Warnings:

  - You are about to drop the column `chargebeeInvoiceId` on the `order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[InvoiceId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Order_chargebeeInvoiceId_key` ON `order`;

-- AlterTable
ALTER TABLE `order` DROP COLUMN `chargebeeInvoiceId`,
    ADD COLUMN `InvoiceId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Order_InvoiceId_key` ON `Order`(`InvoiceId`);
