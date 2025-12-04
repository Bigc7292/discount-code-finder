CREATE TABLE `analyticsEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`eventType` enum('email_sent','email_opened','email_clicked','trial_started','trial_converted','trial_expired','subscription_created','subscription_canceled') NOT NULL,
	`eventCategory` varchar(64),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyticsEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `userId_idx` ON `analyticsEvents` (`userId`);--> statement-breakpoint
CREATE INDEX `eventType_idx` ON `analyticsEvents` (`eventType`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `analyticsEvents` (`createdAt`);