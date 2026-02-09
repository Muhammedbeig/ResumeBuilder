-- Resume Builder tables that live inside the Panel MySQL database (eclassify).
-- This keeps the Panel as the "master DB" while allowing the website to store its own data.
--
-- Apply locally (XAMPP):
--   C:\xampp\mysql\bin\mysql.exe -u root -D eclassify < prisma\panel-extra-tables.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `accounts` (
  `id` VARCHAR(191) NOT NULL,
  `userId` BIGINT UNSIGNED NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `provider` VARCHAR(191) NOT NULL,
  `providerAccountId` VARCHAR(191) NOT NULL,
  `refresh_token` TEXT NULL,
  `access_token` TEXT NULL,
  `expires_at` INT NULL,
  `token_type` VARCHAR(191) NULL,
  `scope` VARCHAR(191) NULL,
  `id_token` TEXT NULL,
  `session_state` TEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `accounts_provider_providerAccountId_key` (`provider`, `providerAccountId`),
  KEY `accounts_userId_idx` (`userId`),
  CONSTRAINT `accounts_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(191) NOT NULL,
  `sessionToken` VARCHAR(191) NOT NULL,
  `userId` BIGINT UNSIGNED NOT NULL,
  `expires` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sessions_sessionToken_key` (`sessionToken`),
  KEY `sessions_userId_idx` (`userId`),
  CONSTRAINT `sessions_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `verification_tokens` (
  `identifier` VARCHAR(191) NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `expires` DATETIME(3) NOT NULL,
  UNIQUE KEY `verification_tokens_token_key` (`token`),
  UNIQUE KEY `verification_tokens_identifier_token_key` (`identifier`, `token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bank_transfer_receipts` (
  `id` VARCHAR(191) NOT NULL,
  `userId` BIGINT UNSIGNED NOT NULL,
  `planId` VARCHAR(191) NOT NULL,
  `amountCents` INT NOT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'usd',
  `filePath` VARCHAR(191) NOT NULL,
  `fileName` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `bank_transfer_receipts_userId_idx` (`userId`),
  CONSTRAINT `bank_transfer_receipts_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `market_value_reports` (
  `id` VARCHAR(191) NOT NULL,
  `userId` BIGINT UNSIGNED NOT NULL,
  `resumeId` VARCHAR(191) NULL,
  `source` VARCHAR(191) NOT NULL,
  `periodLabel` VARCHAR(191) NOT NULL,
  `reportJson` JSON NOT NULL,
  `resumeJson` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `market_value_reports_userId_idx` (`userId`),
  KEY `market_value_reports_resumeId_idx` (`resumeId`),
  CONSTRAINT `market_value_reports_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `resumes` (
  `id` VARCHAR(191) NOT NULL,
  `shortId` VARCHAR(191) NULL,
  `userId` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(191) NOT NULL DEFAULT 'Untitled Resume',
  `template` VARCHAR(191) NOT NULL DEFAULT 'modern',
  `isPublic` TINYINT(1) NOT NULL DEFAULT 0,
  `activeVersionId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `resumes_shortId_key` (`shortId`),
  KEY `resumes_userId_idx` (`userId`),
  KEY `resumes_activeVersionId_idx` (`activeVersionId`),
  CONSTRAINT `resumes_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `resume_versions` (
  `id` VARCHAR(191) NOT NULL,
  `resumeId` VARCHAR(191) NOT NULL,
  `jsonData` JSON NOT NULL,
  `source` VARCHAR(191) NOT NULL DEFAULT 'manual',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `resume_versions_resumeId_idx` (`resumeId`),
  CONSTRAINT `resume_versions_resumeId_fkey`
    FOREIGN KEY (`resumeId`) REFERENCES `resumes` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `exports` (
  `id` VARCHAR(191) NOT NULL,
  `resumeId` VARCHAR(191) NOT NULL,
  `resumeVersionId` VARCHAR(191) NOT NULL,
  `fileUrl` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `exports_resumeId_idx` (`resumeId`),
  KEY `exports_resumeVersionId_idx` (`resumeVersionId`),
  CONSTRAINT `exports_resumeId_fkey`
    FOREIGN KEY (`resumeId`) REFERENCES `resumes` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cvs` (
  `id` VARCHAR(191) NOT NULL,
  `shortId` VARCHAR(191) NULL,
  `userId` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(191) NOT NULL DEFAULT 'Untitled CV',
  `template` VARCHAR(191) NOT NULL DEFAULT 'academic-cv',
  `isPublic` TINYINT(1) NOT NULL DEFAULT 0,
  `activeVersionId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `cvs_shortId_key` (`shortId`),
  KEY `cvs_userId_idx` (`userId`),
  KEY `cvs_activeVersionId_idx` (`activeVersionId`),
  CONSTRAINT `cvs_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cv_versions` (
  `id` VARCHAR(191) NOT NULL,
  `cvId` VARCHAR(191) NOT NULL,
  `jsonData` JSON NOT NULL,
  `source` VARCHAR(191) NOT NULL DEFAULT 'manual',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `cv_versions_cvId_idx` (`cvId`),
  CONSTRAINT `cv_versions_cvId_fkey`
    FOREIGN KEY (`cvId`) REFERENCES `cvs` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cv_exports` (
  `id` VARCHAR(191) NOT NULL,
  `cvId` VARCHAR(191) NOT NULL,
  `cvVersionId` VARCHAR(191) NOT NULL,
  `fileUrl` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `cv_exports_cvId_idx` (`cvId`),
  KEY `cv_exports_cvVersionId_idx` (`cvVersionId`),
  CONSTRAINT `cv_exports_cvId_fkey`
    FOREIGN KEY (`cvId`) REFERENCES `cvs` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_jobs` (
  `id` VARCHAR(191) NOT NULL,
  `userId` BIGINT UNSIGNED NULL,
  `type` VARCHAR(191) NOT NULL,
  `inputHash` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `resultJson` JSON NULL,
  `tokensUsed` INT NULL,
  `costEstimate` DOUBLE NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ai_jobs_userId_idx` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

