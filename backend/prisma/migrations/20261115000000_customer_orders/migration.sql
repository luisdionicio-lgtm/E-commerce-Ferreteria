ALTER TABLE `Order`
  ADD COLUMN `userId` VARCHAR(191) NULL,
  ADD COLUMN `fulfillmentStatus` VARCHAR(191) NOT NULL DEFAULT 'POR_PREPARAR';
CREATE INDEX `Order_userId_createdAt_idx` ON `Order`(`userId`, `createdAt`);
ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `OrderItem`
  ADD COLUMN `productName` TEXT NULL,
  ADD COLUMN `productImage` VARCHAR(191) NULL;
