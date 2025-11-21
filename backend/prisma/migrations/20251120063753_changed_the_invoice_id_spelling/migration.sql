/*
  Warnings:

  - You are about to drop the column `InvoiceId` on the `order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[invoiceId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Order_InvoiceId_key` ON `order`;

-- AlterTable
ALTER TABLE `order` DROP COLUMN `InvoiceId`,
    ADD COLUMN `invoiceId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Order_invoiceId_key` ON `Order`(`invoiceId`);
