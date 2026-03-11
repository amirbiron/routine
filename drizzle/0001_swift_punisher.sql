CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`icon` varchar(50) NOT NULL DEFAULT 'star',
	`color` varchar(20) NOT NULL DEFAULT 'coral',
	`category` enum('alone','together','calming','body','room','custom') NOT NULL DEFAULT 'custom',
	`isDefault` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reflections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scheduleId` int,
	`date` varchar(10) NOT NULL,
	`enjoyedMost` text,
	`hardest` text,
	`whatHelped` text,
	`tomorrowWish` text,
	`mood` enum('great','good','okay','hard','tough'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reflections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`items` json NOT NULL,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tokenEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`reason` varchar(200) NOT NULL,
	`date` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tokenEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `childName` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingDone` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `tokenBalance` int DEFAULT 0 NOT NULL;