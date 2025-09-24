-- CreateTable
CREATE TABLE `City` (
    `id` BIGINT NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `city_ascii` VARCHAR(191) NOT NULL,
    `lat` DOUBLE NOT NULL,
    `lng` DOUBLE NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `iso2` VARCHAR(191) NOT NULL,
    `iso3` VARCHAR(191) NOT NULL,
    `admin_name` VARCHAR(191) NOT NULL,
    `capital` VARCHAR(191) NULL,
    `population` BIGINT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
