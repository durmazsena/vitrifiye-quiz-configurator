CREATE TABLE `configurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionId` varchar(128),
	`quizResultId` int,
	`title` varchar(256) NOT NULL,
	`roomType` enum('banyo','mutfak','tuvalet','lavabo') NOT NULL,
	`selectedProducts` text NOT NULL,
	`totalPrice` int NOT NULL,
	`previewImageUrl` text,
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `configurations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shopifyId` varchar(128),
	`title` varchar(512) NOT NULL,
	`description` text,
	`category` enum('lavabo','klozet','batarya','dus_seti','ayna','aksesuar','karo','diger') NOT NULL,
	`style` enum('modern','klasik','minimalist','rustik','endustriyel'),
	`color` varchar(64),
	`material` varchar(128),
	`price` int NOT NULL,
	`imageUrl` text,
	`dimensions` text,
	`tags` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_shopifyId_unique` UNIQUE(`shopifyId`)
);
--> statement-breakpoint
CREATE TABLE `quiz_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questionText` text NOT NULL,
	`questionType` enum('single_choice','multiple_choice','range','image_select') NOT NULL,
	`category` enum('mekan_tipi','stil','renk','butce','boyut','ozellik') NOT NULL,
	`options` text NOT NULL,
	`order` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quiz_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionId` varchar(128) NOT NULL,
	`email` varchar(320),
	`name` varchar(256),
	`answers` text NOT NULL,
	`recommendedProducts` text,
	`score` int,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quiz_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shopify_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`shopDomain` varchar(256) NOT NULL,
	`accessToken` text NOT NULL,
	`webhookSecret` varchar(256),
	`lastSyncAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shopify_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `shopify_settings_userId_unique` UNIQUE(`userId`)
);
