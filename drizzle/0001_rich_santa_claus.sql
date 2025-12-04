CREATE TABLE `discountCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`searchId` int NOT NULL,
	`code` varchar(255) NOT NULL,
	`merchantName` varchar(255) NOT NULL,
	`merchantUrl` text,
	`description` text,
	`discountAmount` varchar(100),
	`expiryDate` timestamp,
	`verified` boolean NOT NULL DEFAULT false,
	`verifiedAt` timestamp,
	`source` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `discountCodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inboxMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`searchId` int NOT NULL,
	`discountCodeId` int NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `inboxMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`rewardGranted` boolean NOT NULL DEFAULT false,
	`rewardGrantedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `searches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`query` text NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `searches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verificationLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`discountCodeId` int NOT NULL,
	`success` boolean NOT NULL,
	`errorMessage` text,
	`verificationDetails` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verificationLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` enum('trial','active','canceled','expired') DEFAULT 'trial' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `trialEndsAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionEndsAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `referralCode` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `referredBy` int;--> statement-breakpoint
ALTER TABLE `users` ADD `freeMonthsRemaining` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_referralCode_unique` UNIQUE(`referralCode`);--> statement-breakpoint
CREATE INDEX `searchId_idx` ON `discountCodes` (`searchId`);--> statement-breakpoint
CREATE INDEX `verified_idx` ON `discountCodes` (`verified`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `inboxMessages` (`userId`);--> statement-breakpoint
CREATE INDEX `isRead_idx` ON `inboxMessages` (`isRead`);--> statement-breakpoint
CREATE INDEX `referrerId_idx` ON `referrals` (`referrerId`);--> statement-breakpoint
CREATE INDEX `referredUserId_idx` ON `referrals` (`referredUserId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `searches` (`userId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `searches` (`status`);--> statement-breakpoint
CREATE INDEX `discountCodeId_idx` ON `verificationLogs` (`discountCodeId`);--> statement-breakpoint
CREATE INDEX `referredBy_idx` ON `users` (`referredBy`);--> statement-breakpoint
CREATE INDEX `stripeCustomer_idx` ON `users` (`stripeCustomerId`);