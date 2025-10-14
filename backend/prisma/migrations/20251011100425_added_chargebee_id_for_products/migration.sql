/*
  Warnings:

  - A unique constraint covering the columns `[chargebeeInvoiceId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `order` ADD COLUMN `chargebeeInvoiceId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `product` ADD COLUMN `chargebeeItemId` VARCHAR(191) NULL,
    ADD COLUMN `chargebeeItemPriceId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Order_chargebeeInvoiceId_key` ON `Order`(`chargebeeInvoiceId`);
