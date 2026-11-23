CREATE TABLE `Payment` (
  `id` VARCHAR(191) NOT NULL,
  `orderId` VARCHAR(191) NOT NULL,
  `method` VARCHAR(191) NOT NULL,
  `mode` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `amount` INTEGER NOT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'PEN',
  `reference` VARCHAR(191) NULL,
  `refundReference` VARCHAR(191) NULL,
  `reviewNote` TEXT NOT NULL,
  `reviewedBy` VARCHAR(191) NULL,
  `createdAt` VARCHAR(191) NOT NULL,
  `updatedAt` VARCHAR(191) NOT NULL,
  UNIQUE INDEX `Payment_orderId_key`(`orderId`),
  UNIQUE INDEX `Payment_mode_reference_key`(`mode`, `reference`),
  INDEX `Payment_status_createdAt_idx`(`status`, `createdAt`),
  INDEX `Payment_reviewedBy_idx`(`reviewedBy`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_reviewedBy_fkey` FOREIGN KEY (`reviewedBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
