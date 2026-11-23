-- AlterTable
ALTER TABLE `Product` ADD COLUMN `discount` INTEGER NOT NULL DEFAULT 0;

-- Preserve a useful initial offers showcase for existing installations.
UPDATE `Product`
SET `discount` = CASE
  WHEN `id` = 'prod-1' THEN 40
  WHEN `id` = 'prod-2' THEN 30
  WHEN `id` = 'prod-3' THEN 25
  WHEN `id` = 'prod-4' THEN 20
  WHEN `id` = 'prod-5' THEN 15
  WHEN `id` = 'prod-6' THEN 12
  WHEN `id` = 'prod-7' THEN 10
  WHEN `id` = 'prod-8' THEN 25
  WHEN `id` = 'prod-9' THEN 20
  WHEN `id` = 'prod-10' THEN 15
  WHEN `id` = 'prod-11' THEN 12
  WHEN `id` = 'prod-12' THEN 10
  ELSE 0
END;
