-- PlatformOS Native Database Dump
-- Database: coffee_saas
-- Generated: 2026-07-14T15:32:42.109Z

SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `blocked_ips`;
CREATE TABLE `blocked_ips` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ip` varchar(45) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `blocked_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ip` (`ip`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `branch_products`;
CREATE TABLE `branch_products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `product_id` int NOT NULL,
  `price` double DEFAULT '0',
  `cost_price` double DEFAULT '0',
  `stock_qty` int DEFAULT '0',
  `is_available` tinyint(1) DEFAULT '1',
  `min_stock_alert` int DEFAULT '5',
  PRIMARY KEY (`id`),
  UNIQUE KEY `branch_id` (`branch_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `branch_products_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `branch_products_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=179 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `branch_products` VALUES 
(153, 1, 150, 2.5, 0.8, 100, 1, 5),
(154, 1, 151, 2.25, 0.5, 100, 1, 5),
(155, 1, 152, 3.5, 1.5, 100, 1, 5),
(156, 1, 153, 3.2, 1.2, 100, 1, 5),
(157, 1, 154, 6.5, 5.2, 100, 1, 5),
(158, 1, 155, 0.75, 0.55, 100, 1, 5),
(159, 1, 156, 2.2, 1.65, 100, 1, 5),
(160, 1, 157, 0.45, 0.35, 100, 1, 5),
(172, 1, 169, 2.5, 1, 10, 1, 5),
(178, 45, 176, 0, 0, 15, 1, 5);

DROP TABLE IF EXISTS `branch_tables`;
CREATE TABLE `branch_tables` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `business_id` int NOT NULL,
  `table_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `qr_code_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('active','occupied','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `branch_tables` VALUES 
(1, 6, 5, '1', 'http://localhost:5173/scan?biz=5&branch=6&table=1', 'active', '2026-03-07 03:01:19'),
(2, 7, 6, '1', 'http://localhost:5173/scan?biz=6&branch=7&table=1', 'active', '2026-03-18 03:32:29'),
(3, 14, 14, '1', 'http://localhost:5173/scan?biz=14&branch=14&table=1', 'active', '2026-04-02 08:00:00'),
(4, 14, 14, '2', 'http://localhost:5173/scan?biz=14&branch=14&table=2', 'active', '2026-04-02 08:32:21'),
(5, 14, 14, '3', 'http://localhost:5173/scan?biz=14&branch=14&table=3', 'active', '2026-04-02 08:32:26'),
(6, 14, 14, '4', 'http://localhost:5173/scan?biz=14&branch=14&table=4', 'active', '2026-04-02 08:32:29'),
(7, 13, 13, '1', 'http://localhost:5173/scan?biz=13&branch=13&table=1', 'active', '2026-04-02 14:38:15'),
(8, 13, 13, '2', 'http://localhost:5173/scan?biz=13&branch=13&table=2', 'active', '2026-04-02 16:25:02'),
(9, 27, 30, '1', 'http://localhost:5173/scan?biz=30&branch=27&table=1', 'active', '2026-06-25 11:15:02');

DROP TABLE IF EXISTS `branches`;
CREATE TABLE `branches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `province` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `district` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_main` enum('0','1') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `khqr_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `payment_merchant_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `payment_api_key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `payment_receiver_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `payment_provider` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'KHQR',
  `payment_api_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `lat` decimal(10,8) DEFAULT NULL,
  `lng` decimal(11,8) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `branches_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `branches` VALUES 
(1, 1, 'Main Branch', NULL, NULL, NULL, NULL, '1', '2026-03-03 12:51:40', NULL, NULL, NULL, NULL, 'KHQR', NULL, NULL, NULL),
(2, 1, 'coffee bean', NULL, NULL, 'pp
kpl', '0977296971', '0', '2026-03-03 13:35:43', NULL, NULL, NULL, NULL, 'KHQR', NULL, NULL, NULL),
(45, 49, 'Main Branch', NULL, NULL, 'Chamkar Mon, Phnom Penh', '+855977296971', '1', '2026-06-30 14:04:57', 'coffee-pos/img-1782836970475-832516557', NULL, '@#$Heava1821', 'Pheak990@gmail.com', 'KHQR', NULL, NULL, NULL),
(47, 51, 'Main Branch', NULL, NULL, NULL, NULL, '1', '2026-07-01 14:39:39', NULL, NULL, NULL, NULL, 'KHQR', NULL, NULL, NULL);

DROP TABLE IF EXISTS `business_categories`;
CREATE TABLE `business_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `category_id` int NOT NULL,
  `is_active` tinyint DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `business_id` (`business_id`,`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1211 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `business_categories` VALUES 
(1047, 49, 2, 1),
(1048, 49, 18, 1),
(1049, 49, 24, 0),
(1050, 49, 31, 0),
(1051, 49, 32, 0),
(1052, 49, 33, 0),
(1053, 49, 34, 0),
(1054, 49, 35, 0),
(1055, 49, 36, 0),
(1056, 49, 37, 0),
(1057, 49, 38, 0),
(1058, 49, 39, 0),
(1059, 49, 40, 0),
(1060, 49, 41, 0),
(1061, 49, 42, 0),
(1062, 49, 43, 0),
(1063, 49, 44, 0),
(1064, 49, 45, 0),
(1065, 49, 46, 0),
(1066, 49, 47, 0),
(1067, 49, 48, 0),
(1068, 49, 49, 0),
(1069, 49, 50, 0),
(1070, 49, 51, 0),
(1071, 49, 52, 0),
(1072, 49, 53, 0),
(1073, 49, 54, 0),
(1074, 49, 55, 0),
(1075, 49, 56, 0),
(1076, 49, 57, 1),
(1077, 49, 58, 0),
(1078, 49, 59, 0),
(1079, 49, 60, 0),
(1080, 49, 61, 0),
(1081, 49, 62, 0),
(1176, 51, 2, 0),
(1177, 51, 18, 0),
(1178, 51, 24, 0),
(1179, 51, 31, 0),
(1180, 51, 32, 0),
(1181, 51, 33, 0),
(1182, 51, 34, 0),
(1183, 51, 35, 0),
(1184, 51, 36, 0),
(1185, 51, 37, 0),
(1186, 51, 38, 0),
(1187, 51, 39, 0),
(1188, 51, 40, 0),
(1189, 51, 41, 0),
(1190, 51, 42, 0),
(1191, 51, 43, 0),
(1192, 51, 44, 0),
(1193, 51, 45, 0),
(1194, 51, 46, 0),
(1195, 51, 47, 0),
(1196, 51, 48, 0),
(1197, 51, 49, 0),
(1198, 51, 50, 0),
(1199, 51, 51, 0),
(1200, 51, 52, 0),
(1201, 51, 53, 0),
(1202, 51, 54, 0),
(1203, 51, 55, 0),
(1204, 51, 56, 0),
(1205, 51, 57, 0),
(1206, 51, 58, 0),
(1207, 51, 59, 0),
(1208, 51, 60, 0),
(1209, 51, 61, 0),
(1210, 51, 62, 0);

DROP TABLE IF EXISTS `businesses`;
CREATE TABLE `businesses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `owner_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `province` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `district` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `logo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `plan_type` enum('basic','standard','premium') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'basic',
  `package_id` int DEFAULT NULL,
  `active_modules` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'POS',
  `status` enum('active','suspended') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `plan_id` int DEFAULT '1',
  `tax_percent` decimal(5,2) DEFAULT '0.00',
  `service_charge` decimal(5,2) DEFAULT '0.00',
  `kh_exchange_rate` int DEFAULT '4100',
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `website` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `currency_symbol` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT '$',
  `telegram_link` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `facebook_link` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `promo_title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `promo_subtitle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `promo_image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `promo_discount` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `promo_is_active` tinyint DEFAULT '0',
  `global_discount` double DEFAULT '0',
  `telegram_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `telegram_chat_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `telegram_mode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'polling',
  `telegram_webhook_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `global_bogo_active` tinyint DEFAULT '0',
  `global_bogo_text` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `promo_scope` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'all',
  `promo_applied_categories` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `promo_applied_products` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `promo_tag` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `promo_tag_color` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `promo_desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `promo_buy_qty` int DEFAULT '0',
  `promo_get_qty` int DEFAULT '0',
  `promo_start_date` datetime DEFAULT NULL,
  `promo_end_date` datetime DEFAULT NULL,
  `discount_scope` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'all',
  `discount_applied_categories` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `discount_applied_products` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `smtp_user` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `smtp_pass` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `shop_size` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `business_nature` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_active` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `businesses` VALUES 
(1, 'System Default', 'Admin', NULL, NULL, NULL, NULL, NULL, 'standard', NULL, 'POS', 'active', '2026-03-03 12:51:40', 2, '0.00', '0.00', 4100, NULL, NULL, '$', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, 'polling', NULL, 0, NULL, 'all', NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, 'all', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-03 12:51:40'),
(49, 'It sruk srae', 'Pong Chiva', '+855977296971', 'Pheak990@gmail.com', 'Phnom Penh', 'Chamkar Mon', NULL, 'basic', NULL, 'POS', 'active', '2026-06-30 14:04:57', 1, '0.00', '0.00', 4100, NULL, NULL, '$', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, 'polling', NULL, 0, NULL, 'all', NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, 'all', NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-30 14:04:57'),
(51, 'Hong Coffee', 'Pong Chiva', '+855977296971', 'admin7777@gmail.com', 'Phnom Penh', 'Chamkar Mon', NULL, 'basic', NULL, 'POS', 'active', '2026-07-01 14:39:39', 1, '0.00', '0.00', 4100, NULL, NULL, '$', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 'UB7ai61IAd!J', NULL, 'polling', NULL, 0, '', 'all', '[]', '[]', '', '#C8952A', '', 1, 1, NULL, NULL, 'all', '[]', '[]', NULL, NULL, NULL, NULL, NULL);

DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `default_moods` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `default_sizes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `default_addons` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `industry_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'coffee_cafe',
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=286 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `categories` VALUES 
(2, 1, 'Coffee', 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1774963386/coffee-pos/img-1774963384742-162086675.avif', '2026-03-04 16:12:18', '["hot","iced","frappe"]', '[{"label":"Small (S)","value":"S"},{"label":"Medium (M)","value":"M"},{"label":"Large (L)","value":"L"}]', '[{"label":"Cream","value":"Cream"}]', 'coffee_cafe'),
(18, 1, 'Drink', 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1774963490/coffee-pos/img-1774963487171-713940886.jpg', '2026-03-31 13:24:50', NULL, NULL, NULL, 'coffee_cafe'),
(24, 1, 'General Medicine / ថ្នាំទូទៅ', 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775064344/coffee-pos/img-1775064341496-112733637.jpg', '2026-04-01 17:24:47', 'Morning, Afternoon, Evening, Night, Before Meal, After Meal', 'Box, Strip, Pill', 'Keep in cool place, Avoid alcohol, Shake well', 'pharmacy'),
(31, 1, 'ថ្នាំផ្សះ (Antibiotics)', 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775093901/coffee-pos/img-1775093899741-852292804.jpg', '2026-04-02 01:38:22', 'លេបឱ្យអស់តាមវេជ្ជបញ្ជា (Finish course), រៀងរាល់ ៨ ម៉ោង (Every 8 hours), លេបមុនបាយ (Before Meal)', 'ប្រអប់ (Box), បន្ទះ (Strip), ដប (Bottle)', 'អាចមានប្រតិកម្មថ្នាំ (May cause allergy), កុំប្រើជាមួយគ្រឿងស្រវឹង (No alcohol)', 'pharmacy'),
(32, 1, 'Vitamins & Supplements / វីតាមីន និងអាហារបំប៉ន', NULL, '2026-04-02 01:55:54', 'Morning, After Meal, Take with water', 'Bottle, Jar, Pouch', 'Not for treatment, Store at room temp', 'pharmacy'),
(33, 1, 'Skincare & Personal Care / ថែរក្សាស្បែក និងរាងកាយ', NULL, '2026-04-02 01:55:54', 'After Wash, Morning/Evening, External use', 'Tube, Bottle, Sachet', 'Avoid eyes, Stop if irritation', 'pharmacy'),
(34, 1, 'Medical Equipment / ឧបករណ៍វេជ្ជសាស្ត្រ', NULL, '2026-04-02 01:55:54', 'Single use, Emergency, Sterile', 'Piece, Set, Pack', 'Professional only, Discard after use', 'pharmacy'),
(35, 1, 'Baby & Mom Care / ផលិតផលសម្រាប់ម្តាយ និងទារក', NULL, '2026-04-02 01:58:27', 'Daily use, Gentle, Morning/Night', 'Bottle, Pack, Piece', 'For sensitive skin, Keep away from heat', 'mart'),
(36, 1, 'Seafood / គ្រឿងសមុទ្រ', NULL, '2026-04-02 04:11:27', NULL, '[{"label":"Small","value":"small","price":0},{"label":"Large","value":"large","price":5},{"label":"1kg","value":"1kg","price":15}]', NULL, 'restaurant'),
(37, 1, 'Soup / សម្ល', NULL, '2026-04-02 04:11:27', NULL, '[{"label":"Small Bowl","value":"small","price":0},{"label":"Large Bowl","value":"large","price":3}]', NULL, 'restaurant'),
(38, 1, 'Stir-Fry / ម្ហូបឆា', NULL, '2026-04-02 04:11:27', NULL, '[{"label":"Normal","value":"normal","price":0},{"label":"Large","value":"large","price":2}]', NULL, 'restaurant'),
(39, 1, 'Roasted & Deep-fried / ម្ហូបបំពង & អាំង', NULL, '2026-04-02 04:11:28', NULL, '[{"label":"Half","value":"half","price":0},{"label":"Full","value":"full","price":8}]', NULL, 'restaurant'),
(40, 1, 'Salads & Spicy Mixed / ញាំ & បុក', NULL, '2026-04-02 04:11:28', '[{"label":"Non-Spicy","value":"no_spicy"},{"label":"Mild","value":"mild"},{"label":"Spicy","value":"spicy"},{"label":"Extra Spicy","value":"extra_spicy"}]', '[{"label":"Plate","value":"plate","price":0}]', NULL, 'restaurant'),
(41, 1, 'Dessert / បង្អែម', NULL, '2026-04-02 04:11:28', NULL, '[{"label":"Small","value":"small","price":0},{"label":"Large","value":"large","price":1}]', NULL, 'restaurant'),
(42, 1, 'Drinks / ភេសជ្ជៈ', NULL, '2026-04-02 04:11:28', '[{"label":"Normal Ice","value":"normal_ice"},{"label":"Less Ice","value":"less_ice"},{"label":"No Ice","value":"no_ice"}]', '[{"label":"Normal","value":"normal","price":0},{"label":"Large","value":"large","price":0.5}]', NULL, 'restaurant'),
(43, 1, 'Grocery', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:07:27', NULL, '[{"label":"1kg","value":"1kg"},{"label":"5kg","value":"5kg"},{"label":"Bulk","value":"Bulk"}]', NULL, 'mart'),
(44, 1, 'Beverages', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:07:27', '[{"label":"Chilled","value":"Chilled"},{"label":"Regular","value":"Regular"}]', '[{"label":"Can (330ml)","value":"Can"},{"label":"Bottle (500ml)","value":"Bottle"},{"label":"Large (1.5L)","value":"Large"}]', NULL, 'mart'),
(45, 1, 'Snacks & Biscuits', 'https://images.unsplash.com/photo-1599490659213-e2b9527bb087?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:07:27', NULL, '[{"label":"Standard","value":"Standard"},{"label":"Sharing Pack","value":"Sharing"}]', NULL, 'mart'),
(46, 1, 'Canned Goods', 'https://images.unsplash.com/photo-1563202970-13f649ba7c8f?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:07:27', NULL, '[{"label":"Small Can","value":"Small"},{"label":"Multipack","value":"Multi"}]', NULL, 'mart'),
(47, 1, 'Instant Noodles', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:07:27', NULL, '[{"label":"Single Pack","value":"Single"},{"label":"Bowl/Cup","value":"Cup"},{"label":"Pack of 5","value":"Pack5"}]', NULL, 'mart'),
(48, 1, 'Dairy & Eggs', 'https://images.unsplash.com/photo-1550583724-1255d1426478?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:07:27', NULL, '[{"label":"Single","value":"Single"},{"label":"Dozen","value":"Dozen"},{"label":"Pack","value":"Pack"}]', NULL, 'mart'),
(49, 1, 'Frozen Foods', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:07:27', NULL, '[{"label":"Small","value":"Small"},{"label":"Medium","value":"Medium"},{"label":"Large","value":"Large"}]', NULL, 'mart'),
(50, 1, 'Household Supplies', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:07:27', NULL, '[{"label":"Standard","value":"Standard"},{"label":"Value Pack","value":"Value"}]', NULL, 'mart'),
(51, 1, 'Personal Care', 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:07:27', NULL, '[{"label":"Travel Size","value":"Travel"},{"label":"Standard","value":"Standard"},{"label":"Family Pack","value":"Family"}]', NULL, 'mart'),
(52, 1, 'Bakery', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:07:27', NULL, '[{"label":"Slice","value":"Slice"},{"label":"Whole","value":"Whole"},{"label":"Half","value":"Half"}]', NULL, 'mart'),
(53, 1, 'Hot Coffee', 'https://images.unsplash.com/photo-1541167760496-162955ed2a96?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:19:19', '[{"label":"Regular","value":"Regular"}]', '[{"label":"S","value":"S"},{"label":"M","value":"M"}]', '[{"label":"Sugar","value":"Sugar"},{"label":"Honey","value":"Honey"}]', 'coffee_cafe'),
(54, 1, 'Iced Coffee', 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:19:19', '[{"label":"No Sugar","value":"No Sugar"},{"label":"50% Sugar","value":"50% Sugar"},{"label":"100% Sugar","value":"100% Sugar"}]', '[{"label":"M","value":"M"},{"label":"L","value":"L"}]', '[{"label":"Extra Shot","value":"Extra Shot"},{"label":"Caramel","value":"Caramel"}]', 'coffee_cafe'),
(55, 1, 'Frappe & Blended', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:19:19', NULL, '[{"label":"M","value":"M"},{"label":"L","value":"L"}]', '[{"label":"Whipped Cream","value":"Whipped Cream"},{"label":"Chocolate Chip","value":"Chocolate Chip"}]', 'coffee_cafe'),
(56, 1, 'Organic Tea', 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:19:19', '[{"label":"Hot","value":"Hot"},{"label":"Iced","value":"Iced"}]', '[{"label":"Pot","value":"Pot"},{"label":"Cup","value":"Cup"}]', NULL, 'coffee_cafe'),
(57, 1, 'Fruit Soda & Refreshers', 'https://images.unsplash.com/photo-1513558161293-cdaf7659a18b?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:19:19', NULL, '[{"label":"Regular","value":"Regular"},{"label":"Large","value":"Large"}]', '[{"label":"Fresh Fruit","value":"Fresh Fruit"}]', 'coffee_cafe'),
(58, 1, 'Milk-Based Drinks', 'https://images.unsplash.com/photo-1553909489-eb96057ff746?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:19:19', '[{"label":"Hot","value":"Hot"},{"label":"Iced","value":"Iced"},{"label":"Blended","value":"Blended"}]', '[{"label":"S","value":"S"},{"label":"M","value":"M"},{"label":"L","value":"L"}]', '[{"label":"Milk Foam","value":"Milk Foam"}]', 'coffee_cafe'),
(59, 1, 'Pastries & Bread', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:19:19', '[{"label":"Warm up","value":"Warm up"},{"label":"Regular","value":"Regular"}]', NULL, '[{"label":"Butter","value":"Butter"},{"label":"Jam","value":"Jam"}]', 'coffee_cafe'),
(60, 1, 'Signature Specials', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:19:19', NULL, '[{"label":"Regular","value":"Regular"}]', NULL, 'coffee_cafe'),
(61, 1, 'Cakes & Desserts', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:19:19', NULL, '[{"label":"Slice","value":"Slice"},{"label":"Whole","value":"Whole"}]', NULL, 'coffee_cafe'),
(62, 1, 'Healthy Juices', 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:19:19', NULL, '[{"label":"Regular","value":"Regular"}]', NULL, 'coffee_cafe');

DROP TABLE IF EXISTS `customer_redeems`;
CREATE TABLE `customer_redeems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `business_id` int NOT NULL,
  `reward_name` varchar(255) NOT NULL,
  `stars_used` int DEFAULT '0',
  `redeemed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `google_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `profile_image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tier_id` int DEFAULT NULL,
  `points` int DEFAULT '0',
  `total_spent` double DEFAULT '0',
  `card_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `wallet_balance` double DEFAULT '0',
  `otp_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `otp_expiry` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `developer_keys`;
CREATE TABLE `developer_keys` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `client_id` varchar(100) NOT NULL,
  `client_secret` varchar(255) NOT NULL,
  `scopes` text,
  `status` varchar(50) DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `client_id` (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `employee`;
CREATE TABLE `employee` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `gender` tinyint(1) DEFAULT NULL,
  `position` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT NULL,
  `tel` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `status` enum('active','resigned','suspended') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'active',
  `create_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `employee_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `expense`;
CREATE TABLE `expense` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `branch_id` int DEFAULT NULL,
  `shift_id` int DEFAULT NULL,
  `expense_type_id` int DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'Cash',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `expense_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `branch_id` (`branch_id`),
  KEY `expense_type_id` (`expense_type_id`),
  CONSTRAINT `expense_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `expense_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `expense_ibfk_3` FOREIGN KEY (`expense_type_id`) REFERENCES `expense_type` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `expense_type`;
CREATE TABLE `expense_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `expense_type_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_product` (`user_id`,`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `favorites` VALUES 
(1, 7, 46, '2026-03-18 09:28:01');

DROP TABLE IF EXISTS `membership_tiers`;
CREATE TABLE `membership_tiers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `min_points` int DEFAULT '0',
  `discount_rate` double DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `membership_tiers` VALUES 
(1, 1, 'Welcome', 0, 0, '2026-06-11 01:40:37'),
(2, 1, 'Silver', 500, 5, '2026-06-11 01:40:37'),
(3, 1, 'Gold', 1500, 10, '2026-06-11 01:40:37'),
(4, 1, 'Platinum', 5000, 15, '2026-06-11 01:40:37');

DROP TABLE IF EXISTS `modular_packages`;
CREATE TABLE `modular_packages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `icon` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ui_layout` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'coffee',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `industry_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'coffee_cafe',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `modular_packages` VALUES 
(1, 'Coffee & Cafe', 'coffee_cafe', 'Standard setup for coffee shops and cafes', 'CoffeeOutlined', 'coffee', 'active', '2026-04-01 02:31:12', 'coffee_cafe'),
(2, 'Restaurant & Dining', 'restaurant', 'Full dining experience with table management', NULL, 'coffee', 'inactive', '2026-04-01 02:31:12', 'restaurant'),
(3, 'Grocery & Mart', 'mart', 'Fast retail and inventory focused', NULL, 'retail', 'inactive', '2026-04-01 02:31:12', 'retail'),
(4, 'Pharmacy & Medical', '', NULL, NULL, 'pharmacy', 'inactive', '2026-04-01 16:44:29', 'pharmacy');

DROP TABLE IF EXISTS `module_permissions`;
CREATE TABLE `module_permissions` (
  `module_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`module_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `module_permissions_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `system_modules` (`id`) ON DELETE CASCADE,
  CONSTRAINT `module_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `module_permissions` VALUES 
(1, 1),
(2, 1),
(1, 2),
(2, 3),
(1, 4),
(2, 4),
(1, 5),
(2, 5),
(1, 6),
(2, 7),
(2, 8),
(2, 9),
(1, 10),
(2, 10),
(1, 11),
(2, 11),
(1, 12),
(2, 12),
(1, 13),
(2, 13),
(1, 14),
(2, 14),
(1, 15),
(2, 15),
(1, 16),
(2, 16),
(1, 19),
(2, 19),
(2, 20),
(1, 23),
(2, 23),
(2, 25),
(2, 29),
(1, 31),
(3, 31),
(1, 33);

DROP TABLE IF EXISTS `order_details`;
CREATE TABLE `order_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `qty` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `kitchen_batch_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `kitchen_status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_details_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_details_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=138 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `order_details` VALUES 
(133, 84, 176, 1, '2.00', 'iced, S + Cream', 'B1782836228080', 'preparing'),
(134, 85, 176, 1, '1.00', 'iced, S', 'B1782836987466', 'preparing'),
(135, 86, 176, 1, '1.00', 'iced, S', 'B1782837115609', 'preparing'),
(136, 87, 176, 1, '1.00', 'iced, S', 'B1782837591995', 'preparing'),
(137, 88, 176, 1, '1.00', 'iced, S', 'B1782873339934', 'preparing');

DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `customer_id` int DEFAULT NULL,
  `branch_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `shift_id` int DEFAULT NULL,
  `customer_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `table_no` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `sub_total` decimal(10,2) NOT NULL,
  `tax` decimal(10,2) DEFAULT '0.00',
  `discount` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(100) COLLATE utf8mb4_general_ci DEFAULT 'cash',
  `order_type` varchar(100) COLLATE utf8mb4_general_ci DEFAULT 'dine_in',
  `status` varchar(100) COLLATE utf8mb4_general_ci DEFAULT 'ordered',
  `kitchen_status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lat` double DEFAULT NULL,
  `lng` double DEFAULT NULL,
  `is_verified` tinyint DEFAULT '0',
  `guest_count` int DEFAULT '1',
  `total_paid` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `branch_id` (`branch_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=89 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `orders` VALUES 
(5, 1, NULL, 1, 1, NULL, '', '', '5.00', '0.00', '0.00', '5.00', 'Wing', 'dine_in', 'completed', 'pending', '2026-03-17 09:46:45', NULL, NULL, 0, 1, '0.00'),
(6, 1, NULL, 1, 1, NULL, '', '', '2.50', '0.00', '0.00', '2.50', 'ABA', 'dine_in', 'completed', 'pending', '2026-03-17 09:49:30', NULL, NULL, 0, 1, '0.00'),
(7, 1, NULL, 1, 1, NULL, '', '', '1.50', '0.00', '0.00', '1.42', 'Cash', 'dine_in', 'completed', 'pending', '2026-03-17 09:50:51', NULL, NULL, 0, 1, '0.00'),
(8, 1, NULL, 1, 1, NULL, '', '', '1.50', '0.00', '0.00', '1.42', 'ABA', 'dine_in', 'completed', 'pending', '2026-03-17 09:56:48', NULL, NULL, 0, 1, '0.00'),
(25, 1, NULL, 1, 1, NULL, '', '', '1.50', '0.00', '0.00', '1.41', 'ABA', 'dine_in', 'completed', 'pending', '2026-03-24 12:23:08', NULL, NULL, 0, 1, '0.00'),
(26, 1, NULL, 1, 1, NULL, '', '', '1.50', '0.00', '0.00', '1.41', 'ABA', 'dine_in', 'completed', 'pending', '2026-03-24 12:24:27', NULL, NULL, 0, 1, '0.00'),
(27, 1, NULL, 1, 1, NULL, '', '', '1.50', '0.00', '0.00', '1.41', 'ABA', 'dine_in', 'completed', 'pending', '2026-03-24 12:39:47', NULL, NULL, 0, 1, '0.00'),
(28, 1, NULL, 1, 1, NULL, '', '', '0.01', '0.00', '0.00', '0.01', 'ABA', 'dine_in', 'completed', 'pending', '2026-03-24 12:41:33', NULL, NULL, 0, 1, '0.00'),
(29, 1, NULL, 1, 1, NULL, '', '', '1.50', '0.00', '0.00', '1.41', 'ABA', 'dine_in', 'completed', 'pending', '2026-03-24 12:44:46', NULL, NULL, 0, 1, '0.00'),
(30, 1, NULL, 1, 1, NULL, '', '', '0.01', '0.00', '0.00', '0.01', 'ABA', 'dine_in', 'completed', 'pending', '2026-03-24 12:44:56', NULL, NULL, 0, 1, '0.00'),
(31, 1, NULL, 1, 1, NULL, '', '', '0.01', '0.00', '0.00', '0.01', 'Wing', 'dine_in', 'completed', 'pending', '2026-03-24 12:45:38', NULL, NULL, 0, 1, '0.00'),
(84, 49, NULL, 45, 41, 20, '', '', '2.00', '0.00', '0.00', '2.00', 'Wing', 'take_away', 'completed', 'pending', '2026-06-30 16:17:08', NULL, NULL, 0, 1, '2.00'),
(85, 49, NULL, 45, 41, 20, '', '', '1.00', '0.00', '0.00', '1.00', 'Wing', 'take_away', 'completed', 'pending', '2026-06-30 16:29:47', NULL, NULL, 0, 1, '1.00'),
(86, 49, NULL, 45, 41, 20, '', '', '1.00', '0.00', '0.00', '1.00', 'ABA', 'take_away', 'completed', 'pending', '2026-06-30 16:31:55', NULL, NULL, 0, 1, '1.00'),
(87, 49, NULL, 45, 41, 20, '', '', '1.00', '0.00', '0.00', '1.00', 'Wing', 'take_away', 'completed', 'pending', '2026-06-30 16:39:51', NULL, NULL, 0, 1, '1.00'),
(88, 49, NULL, 45, 41, 20, '', '', '1.00', '0.00', '0.00', '1.00', 'ABA', 'take_away', 'completed', 'pending', '2026-07-01 02:35:39', NULL, NULL, 0, 1, '1.00');

DROP TABLE IF EXISTS `package_permissions`;
CREATE TABLE `package_permissions` (
  `package_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`package_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `package_permissions_ibfk_1` FOREIGN KEY (`package_id`) REFERENCES `modular_packages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `package_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `package_permissions` VALUES 
(3, 1),
(4, 1),
(1, 2),
(2, 2),
(3, 2),
(4, 2),
(1, 4),
(2, 4),
(3, 4),
(4, 4),
(1, 5),
(2, 5),
(4, 6),
(3, 7),
(3, 8),
(3, 9),
(4, 9),
(4, 10),
(4, 23);

DROP TABLE IF EXISTS `payment_gateways`;
CREATE TABLE `payment_gateways` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `merchant_id` varchar(255) DEFAULT NULL,
  `api_key` varchar(255) DEFAULT NULL,
  `secure_hash` varchar(255) DEFAULT NULL,
  `currency` varchar(50) DEFAULT 'USD/KHR',
  `status` varchar(50) DEFAULT 'inactive',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `payment_gateways` VALUES 
(1, 'ABA PayWay', 'm_aba_coffee', 'api_aba_live_******************', 'hash_aba_live_******************', 'USD/KHR', 'active', '2026-07-14 15:26:05'),
(2, 'Stripe', 'acct_stripe_1120', 'sk_live_51M******************', 'hash_stripe_live_******************', 'USD', 'active', '2026-07-14 15:26:05'),
(3, 'Wing Pay', 'm_wing_489', 'key_wing_live_******************', 'hash_wing_live_******************', 'USD/KHR', 'inactive', '2026-07-14 15:26:05'),
(4, 'Acleda X-Pay', 'ac_xpay_902', 'sk_acleda_live_******************', 'hash_acleda_live_******************', 'KHR', 'inactive', '2026-07-14 15:26:05');

DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `plan_id` int NOT NULL,
  `tran_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('pending','paid','failed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `duration_days` int DEFAULT '30',
  `payway_ref` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `error_msg` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tran_id` (`tran_id`),
  KEY `business_id` (`business_id`),
  KEY `plan_id` (`plan_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `route_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `min_plan_id` int DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `permissions` VALUES 
(1, 'Dashboard', '/dashboard', 1),
(2, 'POS', '/invoices', 1),
(3, 'Branches', '/shop_managment', 1),
(4, 'Product', '/product', 1),
(5, 'Category', '/category', 1),
(6, 'Order History', '/order', 1),
(7, 'Purchase', '/purchase', 1),
(8, 'Supplier', '/supplier', 1),
(9, 'Inventory Stock', '/raw_material', 1),
(10, 'Employees', '/user', 1),
(11, 'Permissions', '/role', 1),
(12, 'Sales Report', '/report_Sale_Summary', 1),
(13, 'Expense Report', '/report_Expense_Summary', 1),
(14, 'Best Sellers', '/Top_Sale', 1),
(15, 'Profile', '/profile', 1),
(16, 'Expense', '/expense', 1),
(17, 'Role Permissions', '/permission', 1),
(18, 'Subscription Plans', '/plans', 999),
(19, 'My Subscription', '/my-plan', 1),
(20, 'Stock View', '/stock', 1),
(21, 'Stock Adjust', 'stock/adjust', 1),
(22, 'Table Management', '/table', 1),
(23, 'System Settings', '/settings', 1),
(24, 'Kitchen (KDS)', '/kds', 1),
(25, 'Service Blueprints', '/service-blueprints', 1),
(26, 'System Modules', '/system-modules', 1),
(28, 'Platform Team', '/platform-user', 1),
(29, 'Businesses', '/business', 1),
(30, 'System Subscriptions', '/system-subscriptions', 1),
(31, 'Notifications', '/notifications', 1),
(32, 'Smart Marketing', 'marketing/dashboard', 1),
(33, 'Shop Landing Page', '/welcome', 1),
(34, 'Recipe Management', '/recipe', 1),
(35, 'Exchange Rate Settings', '/exchange_rate', 1),
(36, 'Business Config', '/config', 1),
(37, 'Billing Management', '/billing', 1),
(38, 'Shift Management', '/shift', 1),
(39, 'Loyalty Management', '/loyalty', 1),
(40, 'Waste Management', '/waste', 1),
(41, 'Payment Processing', '/payment', 1),
(42, 'Employee Management', '/employee', 1),
(43, 'Inventory Receiving', '/receiving', 1),
(44, 'Branch Management', '/branch', 1),
(45, 'Membership Tiers', '/membership', 1),
(46, 'System Settings', '/system-settings', 1),
(47, 'Subscription Setup', '/subscription', 1),
(48, 'Customer Management', '/customer', 1),
(49, 'Security Management', '/security-logs', 1);

DROP TABLE IF EXISTS `plan_permissions`;
CREATE TABLE `plan_permissions` (
  `plan_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`plan_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `plan_permissions_ibfk_1` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `plan_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `plan_permissions` VALUES 
(3, 1),
(3, 2),
(1, 3),
(3, 3),
(3, 4),
(3, 5),
(3, 6),
(2, 7),
(3, 7),
(2, 8),
(3, 8),
(3, 9),
(3, 10),
(3, 12),
(3, 13),
(3, 14),
(3, 15),
(3, 16),
(3, 19),
(2, 20),
(3, 20),
(3, 21),
(2, 22),
(3, 22),
(3, 23),
(3, 24),
(3, 28),
(3, 29),
(2, 31),
(3, 31),
(3, 32),
(3, 33);

DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `category_id` int DEFAULT NULL,
  `barcode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `brand` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `sizes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `addons` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `moods` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `status` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `discount` double DEFAULT '0',
  `product_type` enum('ready','recipe') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'ready',
  `expiry_date` date DEFAULT NULL,
  `strength` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `generic_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=177 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `products` VALUES 
(150, 1, 53, '10002001', NULL, 'Classic Hot Latte', NULL, 'https://images.unsplash.com/photo-1570968915860-54d5c401ff31?auto=format&fit=crop&w=300&q=80', '[{"label":"Regular","value":"R","price":2.5},{"label":"Large","value":"L","price":3.2}]', NULL, '[{"label":"Hot","value":"hot"}]', 1, '2026-04-02 14:24:38', 0, 'ready', NULL, NULL, NULL),
(151, 1, 54, '10002002', NULL, 'Iced Americano', NULL, 'https://images.unsplash.com/photo-1551046710-388b93902345?auto=format&fit=crop&w=300&q=80', '[{"label":"Regular","value":"R","price":2.25},{"label":"Large","value":"L","price":2.75}]', NULL, '[{"label":"Iced","value":"iced"}]', 1, '2026-04-02 14:24:38', 0, 'ready', NULL, NULL, NULL),
(152, 1, 61, '10002003', NULL, 'Blueberry Cheesecake', NULL, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=300&q=80', NULL, NULL, NULL, 1, '2026-04-02 14:24:38', 0, 'ready', NULL, NULL, NULL),
(153, 1, 56, '10002004', NULL, 'Matcha Latte', NULL, 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=300&q=80', NULL, NULL, '[{"label":"Hot","value":"hot"},{"label":"Iced","value":"iced"}]', 1, '2026-04-02 14:24:38', 0, 'ready', NULL, NULL, NULL),
(154, 1, 43, '20001001', NULL, 'Angkor Jasmine Rice 5kg', NULL, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=300&q=80', NULL, NULL, NULL, 1, '2026-04-02 14:24:38', 0, 'ready', NULL, NULL, NULL),
(155, 1, 44, '20001002', NULL, 'Coca Cola Classic Can', NULL, 'https://images.unsplash.com/photo-1581622558663-b2933044434c?auto=format&fit=crop&w=300&q=80', NULL, NULL, NULL, 1, '2026-04-02 14:24:38', 0, 'ready', NULL, NULL, NULL),
(156, 1, 45, '20001003', NULL, 'Pringles Sour Cream 110g', NULL, 'https://images.unsplash.com/photo-1582234053213-92c53300491e?auto=format&fit=crop&w=300&q=80', NULL, NULL, NULL, 1, '2026-04-02 14:24:38', 0, 'ready', NULL, NULL, NULL),
(157, 1, 47, '20001004', NULL, 'Mama Instant Noodles (Pork)', NULL, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=300&q=80', NULL, NULL, NULL, 1, '2026-04-02 14:24:38', 0, 'ready', NULL, NULL, NULL),
(169, 1, 2, '43442796', NULL, 'Latte Coffee Test', 'Test product remarks', NULL, '[]', '[]', '[]', 1, '2026-06-15 12:21:13', 0, 'ready', NULL, NULL, NULL),
(176, 49, 2, '41044082', 'Cafe Manager', 'កាហ្វេឡាតេទឹកក', '{"text":"ភេសជ្ជៈកាហ្វេអេសប្រេសសូស្រស់ លាយជាមួយទឹកដោះគោស្រស់មានស្រទាប់ខាប់ទាក់ទាញ បន្ថែមដោយដុំទឹកកកត្រជាក់ស្រស់ស្រាយ និងមានសាច់កាហ្វេឈ្ងុយឆ្ងាញ់។","prep_time":5,"shelf_life":2,"storage_condition":"Refrigerated (2-5°C)","allergens":[],"tags":[],"cost_price":0.45,"tax_rate":"10%","product_type":"Variant Product","sub_category":"Hot Coffee","preparation":"","ingredients":"","notes":""}', 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1782832432/coffee-pos/img-1782832430229-794704217.jpg', '[{"label":"S","price":1}]', '[{"label":"Cream","price":1},{"label":"ទឹកកកក្រៅ","price":0.5}]', '[{"value":"iced","label":"iced","price":0}]', 1, '2026-06-30 15:13:53', 0, 'ready', NULL, NULL, NULL);

DROP TABLE IF EXISTS `purchase`;
CREATE TABLE `purchase` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `supplier_id` int DEFAULT NULL,
  `ref` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `paid_amount` decimal(10,2) NOT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `purchase_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'Pending',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `payment_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'Cash',
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `branch_id` (`branch_id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `purchase_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_ibfk_3` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `purchase_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `purchase_product`;
CREATE TABLE `purchase_product` (
  `id` int NOT NULL AUTO_INCREMENT,
  `purchase_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `raw_material_id` int DEFAULT NULL,
  `qty` int NOT NULL,
  `received_qty` decimal(10,2) DEFAULT '0.00',
  `cost` decimal(10,2) NOT NULL,
  `batch_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `unit` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `purchase_id` (`purchase_id`),
  KEY `product_id` (`product_id`),
  KEY `raw_material_id` (`raw_material_id`),
  CONSTRAINT `purchase_product_ibfk_1` FOREIGN KEY (`purchase_id`) REFERENCES `purchase` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_product_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `purchase_product_ibfk_3` FOREIGN KEY (`raw_material_id`) REFERENCES `raw_material` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `raw_material`;
CREATE TABLE `raw_material` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `branch_id` int DEFAULT NULL,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `qty` decimal(10,2) DEFAULT '0.00',
  `min_stock` decimal(10,2) DEFAULT '0.00',
  `par_level` decimal(10,2) DEFAULT '0.00',
  `unit` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `price` decimal(10,2) DEFAULT '0.00',
  `avg_cost` decimal(10,2) DEFAULT '0.00',
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `raw_material_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `raw_material_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `raw_material` VALUES 
(3, 1, 1, 'Coffee Powder', NULL, '5.80', '2.00', '0.00', 'kg', '12.00', '0.00', NULL, 1, '2026-03-04 16:12:18');

DROP TABLE IF EXISTS `recipe_detail`;
CREATE TABLE `recipe_detail` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `product_id` int NOT NULL,
  `raw_material_id` int NOT NULL,
  `qty` decimal(10,3) NOT NULL,
  `unit` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `raw_material_id` (`raw_material_id`),
  CONSTRAINT `recipe_detail_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `recipe_detail_ibfk_2` FOREIGN KEY (`raw_material_id`) REFERENCES `raw_material` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  `can_view` tinyint(1) DEFAULT '1',
  `can_create` tinyint(1) DEFAULT '0',
  `can_edit` tinyint(1) DEFAULT '0',
  `can_delete` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `role_permissions` VALUES 
(1, 1, 1, 1, 1, 1),
(1, 5, 1, 1, 1, 1),
(1, 10, 1, 0, 0, 0),
(1, 11, 1, 1, 1, 1),
(1, 15, 1, 1, 1, 1),
(1, 17, 1, 1, 1, 1),
(1, 18, 1, 1, 1, 1),
(1, 22, 1, 1, 1, 1),
(1, 23, 1, 1, 1, 1),
(1, 25, 1, 1, 1, 1),
(1, 26, 1, 0, 0, 0),
(1, 28, 1, 1, 1, 1),
(1, 29, 1, 1, 1, 1),
(1, 30, 1, 1, 1, 1),
(1, 31, 1, 1, 1, 1),
(1, 34, 1, 1, 1, 1),
(1, 35, 1, 1, 1, 1),
(1, 36, 1, 1, 1, 1),
(1, 37, 1, 1, 1, 1),
(1, 38, 1, 1, 1, 1),
(1, 39, 1, 1, 1, 1),
(1, 40, 1, 1, 1, 1),
(1, 41, 1, 1, 1, 1),
(1, 42, 1, 1, 1, 1),
(1, 43, 1, 1, 1, 1),
(1, 44, 1, 1, 1, 1),
(1, 45, 1, 1, 1, 1),
(1, 46, 1, 1, 1, 1),
(1, 47, 1, 1, 1, 1),
(1, 49, 1, 1, 1, 1),
(2, 1, 1, 0, 0, 0),
(2, 2, 1, 0, 0, 0),
(2, 3, 1, 1, 1, 1),
(2, 4, 1, 1, 1, 1),
(2, 5, 0, 1, 1, 1),
(2, 6, 1, 1, 1, 1),
(2, 7, 1, 1, 1, 1),
(2, 8, 1, 1, 1, 1),
(2, 9, 1, 1, 1, 1),
(2, 10, 1, 1, 1, 1),
(2, 11, 1, 1, 1, 1),
(2, 12, 1, 1, 1, 1),
(2, 13, 1, 1, 1, 1),
(2, 14, 1, 1, 1, 1),
(2, 15, 1, 1, 1, 1),
(2, 16, 1, 1, 1, 1),
(2, 17, 1, 1, 1, 1),
(2, 18, 1, 0, 0, 0),
(2, 19, 1, 1, 1, 1),
(2, 20, 1, 1, 1, 1),
(2, 21, 1, 1, 1, 1),
(2, 22, 1, 1, 1, 1),
(2, 23, 1, 1, 1, 1),
(2, 24, 1, 0, 0, 0),
(2, 25, 1, 0, 0, 0),
(2, 26, 1, 0, 0, 0),
(2, 28, 1, 0, 0, 0),
(2, 29, 1, 0, 0, 0),
(2, 30, 1, 0, 0, 0),
(2, 31, 1, 1, 1, 1),
(2, 32, 1, 1, 1, 1),
(2, 33, 1, 0, 0, 0),
(2, 34, 1, 1, 1, 1),
(2, 35, 1, 1, 1, 1),
(2, 36, 1, 1, 1, 1),
(2, 37, 1, 1, 1, 1),
(2, 38, 1, 1, 1, 1),
(2, 39, 1, 1, 1, 1),
(2, 40, 1, 1, 1, 1),
(2, 41, 1, 1, 1, 1),
(2, 42, 1, 1, 1, 1),
(2, 43, 1, 1, 1, 1),
(2, 44, 1, 1, 1, 1),
(2, 45, 1, 1, 1, 1),
(2, 46, 1, 1, 1, 1),
(2, 47, 1, 1, 1, 1),
(2, 48, 1, 1, 1, 1),
(2, 49, 1, 1, 1, 1),
(3, 2, 1, 1, 1, 1),
(3, 4, 1, 1, 1, 1),
(3, 5, 1, 1, 1, 1),
(3, 6, 1, 1, 1, 1),
(3, 20, 1, 1, 1, 1),
(3, 21, 1, 1, 1, 1),
(3, 22, 1, 1, 1, 1),
(3, 25, 1, 0, 0, 0),
(3, 26, 1, 0, 0, 0),
(3, 31, 1, 1, 1, 1),
(3, 33, 1, 0, 0, 0),
(3, 34, 1, 1, 1, 1),
(3, 35, 1, 1, 1, 1),
(3, 36, 1, 1, 1, 1),
(3, 37, 1, 1, 1, 1),
(3, 38, 1, 1, 1, 1),
(3, 39, 1, 1, 1, 1),
(3, 40, 1, 1, 1, 1),
(3, 41, 1, 1, 1, 1),
(3, 42, 1, 1, 1, 1),
(3, 43, 1, 1, 1, 1),
(3, 44, 1, 1, 1, 1),
(3, 45, 1, 1, 1, 1),
(3, 46, 1, 1, 1, 1),
(3, 47, 1, 1, 1, 1),
(118, 1, 1, 1, 1, 1),
(118, 2, 1, 1, 1, 1),
(118, 3, 1, 1, 1, 1),
(118, 4, 1, 1, 1, 1),
(118, 5, 1, 1, 1, 1),
(118, 6, 1, 1, 1, 1),
(118, 7, 1, 1, 1, 1),
(118, 8, 1, 1, 1, 1),
(118, 9, 1, 1, 1, 1),
(118, 10, 1, 1, 1, 1),
(118, 11, 1, 1, 1, 1),
(118, 12, 1, 1, 1, 1),
(118, 13, 1, 1, 1, 1),
(118, 14, 1, 1, 1, 1),
(118, 15, 1, 1, 1, 1),
(118, 16, 1, 1, 1, 1),
(118, 17, 1, 1, 1, 1),
(118, 18, 1, 1, 1, 1),
(118, 19, 1, 1, 1, 1),
(118, 20, 1, 1, 1, 1),
(118, 21, 1, 1, 1, 1),
(118, 22, 1, 1, 1, 1),
(118, 23, 1, 1, 1, 1),
(118, 24, 1, 1, 1, 1),
(118, 25, 1, 1, 1, 1),
(118, 26, 1, 1, 1, 1),
(118, 28, 1, 1, 1, 1),
(118, 29, 1, 1, 1, 1),
(118, 30, 1, 1, 1, 1),
(118, 31, 1, 1, 1, 1),
(118, 32, 1, 1, 1, 1),
(118, 33, 1, 1, 1, 1),
(118, 34, 1, 1, 1, 1),
(118, 35, 1, 1, 1, 1),
(118, 36, 1, 1, 1, 1),
(118, 37, 1, 1, 1, 1),
(118, 38, 1, 1, 1, 1),
(118, 39, 1, 1, 1, 1),
(118, 40, 1, 1, 1, 1),
(118, 41, 1, 1, 1, 1),
(118, 42, 1, 1, 1, 1),
(118, 43, 1, 1, 1, 1),
(118, 44, 1, 1, 1, 1),
(118, 45, 1, 1, 1, 1),
(118, 46, 1, 1, 1, 1),
(118, 47, 1, 1, 1, 1),
(118, 48, 1, 1, 1, 1),
(118, 49, 1, 1, 1, 1),
(120, 2, 1, 1, 1, 0),
(120, 4, 1, 1, 1, 0),
(120, 5, 1, 1, 1, 0),
(120, 6, 1, 1, 1, 0),
(120, 15, 1, 1, 1, 0),
(120, 22, 1, 1, 1, 0),
(120, 34, 1, 1, 1, 1),
(120, 35, 1, 1, 1, 1),
(120, 36, 1, 1, 1, 1),
(120, 37, 1, 1, 1, 1),
(120, 38, 1, 1, 1, 1),
(120, 39, 1, 1, 1, 1),
(120, 40, 1, 1, 1, 1),
(120, 41, 1, 1, 1, 1),
(120, 42, 1, 1, 1, 1),
(120, 43, 1, 1, 1, 1),
(120, 44, 1, 1, 1, 1),
(120, 45, 1, 1, 1, 1),
(120, 46, 1, 1, 1, 1),
(120, 47, 1, 1, 1, 1),
(124, 1, 1, 1, 1, 1),
(124, 2, 1, 1, 1, 1),
(124, 3, 1, 1, 1, 1),
(124, 4, 1, 1, 1, 1),
(124, 5, 1, 1, 1, 1),
(124, 6, 1, 1, 1, 1),
(124, 7, 1, 1, 1, 1),
(124, 8, 1, 1, 1, 1),
(124, 9, 1, 1, 1, 1),
(124, 10, 1, 1, 1, 1),
(124, 11, 1, 1, 1, 1),
(124, 12, 1, 1, 1, 1),
(124, 13, 1, 1, 1, 1),
(124, 14, 1, 1, 1, 1),
(124, 15, 1, 1, 1, 1),
(124, 16, 1, 1, 1, 1),
(124, 17, 1, 1, 1, 1),
(124, 18, 1, 1, 1, 1),
(124, 19, 1, 1, 1, 1),
(124, 20, 1, 1, 1, 1),
(124, 21, 1, 1, 1, 1),
(124, 22, 1, 1, 1, 1),
(124, 23, 1, 1, 1, 1),
(124, 24, 1, 1, 1, 1),
(124, 25, 1, 1, 1, 1),
(124, 26, 1, 1, 1, 1),
(124, 28, 1, 1, 1, 1),
(124, 29, 1, 1, 1, 1),
(124, 30, 1, 1, 1, 1),
(124, 31, 1, 1, 1, 1),
(124, 32, 1, 1, 1, 1),
(124, 33, 1, 1, 1, 1),
(124, 34, 1, 1, 1, 1),
(124, 35, 1, 1, 1, 1),
(124, 36, 1, 1, 1, 1),
(124, 37, 1, 1, 1, 1),
(124, 38, 1, 1, 1, 1),
(124, 39, 1, 1, 1, 1),
(124, 40, 1, 1, 1, 1),
(124, 41, 1, 1, 1, 1),
(124, 42, 1, 1, 1, 1),
(124, 43, 1, 1, 1, 1),
(124, 44, 1, 1, 1, 1),
(124, 45, 1, 1, 1, 1),
(124, 46, 1, 1, 1, 1),
(124, 47, 1, 1, 1, 1),
(124, 48, 1, 1, 1, 1),
(124, 49, 1, 1, 1, 1),
(125, 2, 1, 1, 1, 1),
(125, 4, 1, 1, 1, 1),
(125, 5, 1, 1, 1, 1),
(125, 6, 1, 1, 1, 1),
(125, 7, 1, 1, 1, 1),
(125, 8, 1, 1, 1, 1),
(125, 12, 1, 1, 1, 1),
(125, 15, 1, 1, 1, 1),
(125, 16, 1, 1, 1, 1),
(125, 20, 1, 1, 1, 1),
(125, 22, 1, 1, 1, 1),
(125, 34, 1, 1, 1, 1),
(125, 35, 1, 1, 1, 1),
(125, 36, 1, 1, 1, 1),
(125, 37, 1, 1, 1, 1),
(125, 38, 1, 1, 1, 1),
(125, 39, 1, 1, 1, 1),
(125, 40, 1, 1, 1, 1),
(125, 41, 1, 1, 1, 1),
(125, 42, 1, 1, 1, 1),
(125, 43, 1, 1, 1, 1),
(125, 44, 1, 1, 1, 1),
(125, 45, 1, 1, 1, 1),
(125, 46, 1, 1, 1, 1),
(125, 47, 1, 1, 1, 1),
(126, 2, 1, 1, 1, 0),
(126, 4, 1, 1, 1, 0),
(126, 5, 1, 1, 1, 0),
(126, 6, 1, 1, 1, 0),
(126, 15, 1, 1, 1, 0),
(126, 22, 1, 1, 1, 0),
(126, 34, 1, 1, 1, 1),
(126, 35, 1, 1, 1, 1),
(126, 36, 1, 1, 1, 1),
(126, 37, 1, 1, 1, 1),
(126, 38, 1, 1, 1, 1),
(126, 39, 1, 1, 1, 1),
(126, 40, 1, 1, 1, 1),
(126, 41, 1, 1, 1, 1),
(126, 42, 1, 1, 1, 1),
(126, 43, 1, 1, 1, 1),
(126, 44, 1, 1, 1, 1),
(126, 45, 1, 1, 1, 1),
(126, 46, 1, 1, 1, 1),
(126, 47, 1, 1, 1, 1),
(127, 2, 1, 1, 1, 1),
(127, 4, 1, 1, 1, 1),
(127, 5, 1, 1, 1, 1),
(127, 6, 1, 1, 1, 1),
(127, 7, 1, 1, 1, 1),
(127, 8, 1, 1, 1, 1),
(127, 12, 1, 1, 1, 1),
(127, 15, 1, 1, 1, 1),
(127, 16, 1, 1, 1, 1),
(127, 20, 1, 1, 1, 1),
(127, 22, 1, 1, 1, 1),
(127, 34, 1, 1, 1, 1),
(127, 35, 1, 1, 1, 1),
(127, 36, 1, 1, 1, 1),
(127, 37, 1, 1, 1, 1),
(127, 38, 1, 1, 1, 1),
(127, 39, 1, 1, 1, 1),
(127, 40, 1, 1, 1, 1),
(127, 41, 1, 1, 1, 1),
(127, 42, 1, 1, 1, 1),
(127, 43, 1, 1, 1, 1),
(127, 44, 1, 1, 1, 1),
(127, 45, 1, 1, 1, 1),
(127, 46, 1, 1, 1, 1),
(127, 47, 1, 1, 1, 1),
(128, 2, 1, 1, 1, 1),
(128, 4, 1, 1, 1, 1),
(128, 5, 1, 1, 1, 1),
(128, 6, 1, 1, 1, 1),
(128, 15, 1, 1, 1, 1),
(128, 22, 1, 1, 1, 1),
(128, 34, 1, 1, 1, 1),
(128, 35, 1, 1, 1, 1),
(128, 36, 1, 1, 1, 1),
(128, 37, 1, 1, 1, 1),
(128, 38, 1, 1, 1, 1),
(128, 39, 1, 1, 1, 1),
(128, 40, 1, 1, 1, 1),
(128, 41, 1, 1, 1, 1),
(128, 42, 1, 1, 1, 1),
(128, 43, 1, 1, 1, 1),
(128, 44, 1, 1, 1, 1),
(128, 45, 1, 1, 1, 1),
(128, 46, 1, 1, 1, 1),
(128, 47, 1, 1, 1, 1);

DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `roles_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=129 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `roles` VALUES 
(1, 1, 'PlatForm Owner', 'PLATEFORM_OWNER'),
(2, 1, 'Business Owner', 'OWNER'),
(3, 1, 'Cashier', 'CASHIER'),
(118, 49, 'Owner', 'owner'),
(120, 49, 'Sale', 'sale'),
(124, 51, 'Owner', 'owner'),
(125, 51, 'Manager', 'manager'),
(126, 51, 'Sale', 'sale'),
(127, 1, 'Manager', 'manager'),
(128, 1, 'Sale', 'sale');

DROP TABLE IF EXISTS `security_logs`;
CREATE TABLE `security_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ip` varchar(45) NOT NULL,
  `event_type` varchar(50) NOT NULL,
  `endpoint` varchar(255) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `details` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `shifts`;
CREATE TABLE `shifts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `user_id` int NOT NULL,
  `opening_cash_usd` decimal(10,2) DEFAULT '0.00',
  `opening_cash_khr` decimal(10,2) DEFAULT '0.00',
  `actual_cash_usd` decimal(10,2) DEFAULT '0.00',
  `actual_cash_khr` decimal(10,2) DEFAULT '0.00',
  `expected_cash_usd` decimal(10,2) DEFAULT '0.00',
  `total_sales_usd` decimal(10,2) DEFAULT '0.00',
  `total_cash_usd` decimal(10,2) DEFAULT '0.00',
  `total_aba_usd` decimal(10,2) DEFAULT '0.00',
  `total_wing_usd` decimal(10,2) DEFAULT '0.00',
  `total_expense_usd` decimal(10,2) DEFAULT '0.00',
  `diff_usd` decimal(10,2) DEFAULT '0.00',
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'Closed',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `shifts` VALUES 
(1, 6, 7, 8, '50.00', '100000.00', '51.00', '100000.00', '76.00', '2.00', '0.00', '1.00', '0.00', '0.00', '0.00', NULL, 'Closed', '2026-03-17 14:18:21', NULL),
(2, 6, 7, 8, '0.00', '0.00', '0.00', '0.00', '1.00', '2.00', '0.00', '1.00', '0.00', '0.00', '-1.00', NULL, 'Closed', '2026-03-17 14:19:05', NULL),
(3, 6, 7, 8, '50.00', '10000.00', '51.00', '10000.00', '53.50', '2.00', '1.00', '1.00', '0.00', '0.00', '0.00', NULL, 'Closed', '2026-03-18 02:03:48', '2026-03-18 02:08:05'),
(4, 6, 7, 8, '10.00', '0.00', '0.00', '0.00', '11.50', '2.50', '1.50', '1.00', '0.00', '0.00', '-11.50', NULL, 'Closed', '2026-03-18 02:13:13', '2026-03-18 03:23:34'),
(5, 6, 7, 7, '50.00', '0.00', '51.50', '0.00', '51.50', '2.50', '1.50', '1.00', '0.00', '0.00', '0.00', NULL, 'Closed', '2026-03-18 02:23:02', '2026-03-18 02:24:11'),
(6, 6, 7, 7, '10.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', NULL, 'Open', '2026-03-18 03:47:53', NULL),
(7, 1, 1, 1, '50.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', NULL, 'Open', '2026-03-24 12:03:50', NULL),
(8, 5, 6, 6, '50.00', '0.00', '50.00', '0.00', '50.00', '15.00', '0.00', '0.00', '0.00', '0.00', '0.00', NULL, 'Closed', '2026-03-24 14:40:06', '2026-03-31 12:34:08'),
(9, 5, 6, 9, '0.00', '0.00', '5.50', '0.00', '5.50', '8.50', '5.50', '0.00', '3.00', '0.00', '0.00', NULL, 'Closed', '2026-03-25 03:00:22', '2026-04-01 09:43:59'),
(10, 11, 11, 14, '50.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', NULL, 'Open', '2026-03-25 03:51:57', NULL),
(11, 12, 12, 15, '10.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', NULL, 'Open', '2026-03-28 16:45:54', NULL),
(12, 5, 6, 6, '50.00', '0.00', '50.00', '0.00', '50.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', NULL, 'Closed', '2026-03-31 12:34:15', '2026-03-31 14:40:13'),
(13, 5, 6, 6, '50.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', NULL, 'Open', '2026-03-31 14:41:12', NULL),
(14, 14, 14, 17, '100.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', NULL, 'Open', '2026-03-31 14:45:20', NULL),
(15, 14, 14, 18, '50.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', NULL, 'Open', '2026-03-31 15:30:55', NULL),
(16, 13, 13, 16, '50.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', NULL, 'Open', '2026-04-02 14:20:34', NULL),
(17, 15, 15, 19, '10.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', NULL, 'Open', '2026-06-15 12:25:08', NULL),
(18, 30, 27, 23, '50.00', '0.00', '50.00', '0.00', '50.00', '0.75', '0.00', '0.00', '0.00', '0.00', '0.00', NULL, 'Closed', '2026-06-25 11:27:21', '2026-06-25 11:44:25'),
(19, 37, 34, 30, '23.00', '0.00', '23.00', '0.00', '23.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', NULL, 'Closed', '2026-06-27 12:50:21', '2026-06-27 12:52:13'),
(20, 49, 45, 41, '50.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', NULL, 'Open', '2026-06-30 16:17:00', NULL);

DROP TABLE IF EXISTS `stock_logs`;
CREATE TABLE `stock_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `item_type` enum('product','raw_material') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `item_id` int NOT NULL,
  `old_qty` decimal(10,2) NOT NULL,
  `new_qty` decimal(10,2) NOT NULL,
  `qty_changed` decimal(10,2) NOT NULL,
  `type` enum('sale','purchase','receive','adjustment','waste','return') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `ref_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `batch_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `unit_cost` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `idx_item_logs` (`business_id`,`item_type`,`item_id`),
  CONSTRAINT `stock_logs_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `stock_logs` VALUES 
(1, 1, 1, 'raw_material', 3, '0.00', '0.00', '1.00', 'purchase', NULL, 'Test Purchase 1kg', '2026-03-04 16:12:39', NULL, NULL, NULL, '0.00'),
(2, 1, 1, 'raw_material', 3, '1.00', '0.80', '-0.20', 'sale', NULL, 'POS Sale 10 Lattes', '2026-03-04 16:12:39', NULL, NULL, NULL, '0.00'),
(19, 49, 45, 'product', 176, '20.00', '19.00', '-1.00', 'sale', 'ORD-84', 'Sale: iced, S + Cream', '2026-06-30 16:17:08', 41, NULL, NULL, '0.00'),
(20, 49, 45, 'product', 176, '19.00', '18.00', '-1.00', 'sale', 'ORD-85', 'Sale: iced, S', '2026-06-30 16:29:47', 41, NULL, NULL, '0.00'),
(21, 49, 45, 'product', 176, '18.00', '17.00', '-1.00', 'sale', 'ORD-86', 'Sale: iced, S', '2026-06-30 16:31:55', 41, NULL, NULL, '0.00'),
(22, 49, 45, 'product', 176, '17.00', '16.00', '-1.00', 'sale', 'ORD-87', 'Sale: iced, S', '2026-06-30 16:39:52', 41, NULL, NULL, '0.00'),
(23, 49, 45, 'product', 176, '16.00', '15.00', '-1.00', 'sale', 'ORD-88', 'Sale: iced, S', '2026-07-01 02:35:39', 41, NULL, NULL, '0.00');

DROP TABLE IF EXISTS `subscription_plans`;
CREATE TABLE `subscription_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `max_branches` int DEFAULT '1',
  `max_staff` int DEFAULT '2',
  `max_products` int DEFAULT '50',
  `price` decimal(10,2) DEFAULT '0.00',
  `billing_cycle` enum('monthly','lifetime') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'monthly',
  `is_active` tinyint DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `active_modules` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `max_categories` int NOT NULL DEFAULT '10',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `subscription_plans` VALUES 
(1, 'Free Plan', 1, 2, 20, '0.00', 'monthly', 1, '2026-03-03 15:03:30', 'POS', 3),
(2, 'Pro Plan', 5, 10, 50, '30.00', 'monthly', 1, '2026-03-03 15:03:30', 'POS', 10),
(3, 'Enterprise', 999, 999, 9999, '800.00', 'lifetime', 1, '2026-03-03 15:03:30', 'POS', 999);

DROP TABLE IF EXISTS `subscriptions`;
CREATE TABLE `subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `plan_type` enum('basic','standard','premium') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `price` decimal(10,2) DEFAULT '0.00',
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('active','expired','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'active',
  `tran_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `payment_status` enum('pending','paid','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'paid',
  `plan_id` int DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `subscriptions` VALUES 
(1, 1, 'standard', '29.00', '2026-03-03 00:00:00', '2027-03-03 00:00:00', 'active', NULL, 'paid', 2, '2026-03-04 14:12:33'),
(56, 49, 'basic', '0.00', '2026-06-30 00:00:00', '2026-07-30 00:00:00', 'active', NULL, 'paid', 1, '2026-06-30 14:04:57'),
(58, 51, 'basic', '0.00', '2026-07-01 00:00:00', '2026-07-31 00:00:00', 'active', NULL, 'paid', 1, '2026-07-01 14:39:39');

DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `tel` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `website` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `suppliers_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `system_modules`;
CREATE TABLE `system_modules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `system_modules` VALUES 
(1, 'Core POS System', 'POS', NULL, 'active', '2026-04-01 03:49:49'),
(2, 'Web QR Ordering', 'ORDERING', NULL, 'active', '2026-04-01 03:49:49'),
(3, 'Advanced Inventory', 'INVENTORY', NULL, 'active', '2026-04-01 03:49:49');

DROP TABLE IF EXISTS `system_notifications`;
CREATE TABLE `system_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) DEFAULT 'system',
  `is_read` tinyint DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `system_notifications` VALUES 
(1, NULL, 'Ecosystem Update v2.0.4', 'A platform-wide update was successfully deployed. You can now manage global category definitions seamlessly.', 'system', 1, '2026-06-12 03:39:18'),
(2, 1, 'System Health Check', 'All SMTP nodes and database services are reporting stable conditions.', 'system', 1, '2026-06-12 03:39:18'),
(4, 15, 'Low Product Stock / ??????????????????????????????????????????', 'Product "Latte Coffee" is running low in branch. Current stock: 5, below minimum limit of 5.', 'inventory', 1, '2026-06-18 07:00:07'),
(5, 41, 'Welcome to Coffee POS!', 'Explore your new dashboard analytics and manage your branches from a single workspace.', 'system', 1, '2026-06-29 14:21:30'),
(6, 42, 'Welcome to Coffee POS!', 'Explore your new dashboard analytics and manage your branches from a single workspace.', 'system', 0, '2026-06-29 14:42:06'),
(7, 44, 'Welcome to Coffee POS!', 'Explore your new dashboard analytics and manage your branches from a single workspace.', 'system', 0, '2026-06-29 16:42:04'),
(8, 45, 'Welcome to Coffee POS!', 'Explore your new dashboard analytics and manage your branches from a single workspace.', 'system', 0, '2026-06-29 16:43:50'),
(9, 46, 'Welcome to Coffee POS!', 'Explore your new dashboard analytics and manage your branches from a single workspace.', 'system', 0, '2026-06-29 16:47:43'),
(10, 47, 'Welcome to Coffee POS!', 'Explore your new dashboard analytics and manage your branches from a single workspace.', 'system', 0, '2026-06-30 01:00:55'),
(11, 48, 'Welcome to Coffee POS!', 'Explore your new dashboard analytics and manage your branches from a single workspace.', 'system', 0, '2026-06-30 13:51:49'),
(12, 49, 'Welcome to Coffee POS!', 'Explore your new dashboard analytics and manage your branches from a single workspace.', 'system', 0, '2026-06-30 14:04:57'),
(13, 50, 'Welcome to Coffee POS!', 'Explore your new dashboard analytics and manage your branches from a single workspace.', 'system', 0, '2026-07-01 13:28:54'),
(14, 51, 'Welcome to Coffee POS!', 'Explore your new dashboard analytics and manage your branches from a single workspace.', 'system', 0, '2026-07-01 14:39:39');

DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sett_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `sett_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sett_key` (`sett_key`)
) ENGINE=InnoDB AUTO_INCREMENT=2032 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `system_settings` VALUES 
(1, 'payway_merchant_id', '', NULL, '2026-06-27 12:04:51'),
(2, 'payway_api_key', '', NULL, '2026-06-27 12:04:51'),
(3, 'payway_receiver_name', '', NULL, '2026-06-27 12:04:51'),
(4, 'payway_khqr_image', NULL, NULL, '2026-03-08 13:39:54'),
(1101, 'landing_page', '{"heroTitle":"Innovating your Global Solutions.","heroSubtext":"High-performance POS management tailored for large-scale operations. Strategic control, unified intelligence, limitless scaling.","primaryCTA":"EXPLORE SOLUTIONS","secondaryCTA":"WATCH DEMO","promoMart":"SROKSRE-MART-20","promoRx":"SROKSRE-RX-15","promoResto":"SROKSRE-RESTO-12","telegram":"@pongchiva","phone":"+855 081 257 XXX"}', NULL, '2026-06-27 12:04:51'),
(1662, 'telegram_support_link', 'https://t.me/growme_support', NULL, '2026-06-25 16:00:48'),
(1663, 'payment_imap_host', 'imap.gmail.com', NULL, '2026-06-25 16:00:48'),
(1664, 'payment_imap_port', '993', NULL, '2026-06-25 16:00:48'),
(1665, 'payment_imap_user', '', NULL, '2026-06-25 16:00:48'),
(1666, 'payment_imap_pass', '', NULL, '2026-06-25 16:00:48'),
(2023, 'telegram_bot_token', '', NULL, '2026-07-14 15:27:35'),
(2024, 'telegram_chat_id', '', NULL, '2026-07-14 15:27:35'),
(2025, 'twilio_sid', '', NULL, '2026-07-14 15:27:35'),
(2026, 'slack_webhook_url', '', NULL, '2026-07-14 15:27:35'),
(2027, 'twilio_token', '', NULL, '2026-07-14 15:27:35'),
(2028, 'twilio_sender', '', NULL, '2026-07-14 15:27:35'),
(2029, 'telegram_active', '', NULL, '2026-07-14 15:27:35'),
(2030, 'slack_active', '', NULL, '2026-07-14 15:27:35'),
(2031, 'sms_active', '', NULL, '2026-07-14 15:27:35');

DROP TABLE IF EXISTS `user_sessions`;
CREATE TABLE `user_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token_uuid` varchar(100) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_activity` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_uuid` (`token_uuid`)
) ENGINE=InnoDB AUTO_INCREMENT=137 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `user_sessions` VALUES 
(136, 2, '05de0ee8-8ec1-435d-a91c-47ed8c582e6a', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '2026-07-14 15:05:44', '2026-07-14 15:05:44', '2026-07-21 15:05:45');

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `branch_id` int DEFAULT NULL,
  `role_id` int DEFAULT NULL,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'active',
  `tel` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `is_super_admin` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_verified` tinyint(1) DEFAULT '0',
  `verify_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `pin_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT '1234',
  `reset_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `business_id` (`business_id`),
  KEY `branch_id` (`branch_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `users_ibfk_3` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `users` VALUES 
(1, 1, 1, 1, 'Super Admin', 'admin@gmail.com', '$2b$10$e2nn6KeWqlmuJNbNnwJhs.ML/DvoMrBjU6quM3DIdCgyYNy0L2rnK', 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1774958973/coffee-pos/img-1774958969047-740284381.jpg', 'active', NULL, NULL, 1, '2026-03-03 12:53:14', 1, NULL, '1234', NULL, NULL),
(2, 1, 2, 1, 'Pong Chiva', 'pongchiva257@gmail.com', '$2b$12$JRlhiUShXFLrqV0VFOzfEObQeuEZJp3BqumZVCQZ996PcM5slqBhu', 'upload_image-1772547527529-495920070', 'active', '0999888777', 'pp', 1, '2026-03-03 14:15:55', 1, NULL, '1234', NULL, NULL),
(41, 49, 45, 118, 'Pong Chiva', 'Pheak990@gmail.com', '$2b$10$9oCP6/yUs7.TS/XBjUFyBuNZWbjs1fUkwtkLrk6AckDK1XyEtLRSS', NULL, 'active', NULL, NULL, 0, '2026-06-30 14:04:57', 1, '7f1529deea8fce3846afc11a93680814684522e9a5e01249c21f685b3373c774', '1234', NULL, NULL),
(47, 51, 47, 124, 'Pong Chiva', 'admin7777@gmail.com', '$2b$12$C7SMkK0xOCyNNYYLmCohp.hb2m.W6FZkDlYTQslLfx0KmFPG/66QO', NULL, 'active', NULL, NULL, 0, '2026-07-01 14:39:39', 1, '0b9182c2e8c0e5b4c34039aaa48538c5400e726400b0094e4f2d6afa1814dbd7', '1234', NULL, NULL),
(49, 51, 47, 125, 'អ្នកគ្រប់គ្រង', 'manager@gmail.com', '$2b$12$vXlSDUCciHZ4gnAP8T/FqOt96d6b1L.Ld5pkHFxJa.sxcHiwjz13a', NULL, 'active', '0965001001', 'GV6J+Q54', 0, '2026-07-01 14:51:27', 1, NULL, '1234', NULL, NULL);

DROP TABLE IF EXISTS `waste`;
CREATE TABLE `waste` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `raw_material_id` int DEFAULT NULL,
  `qty` decimal(10,2) NOT NULL,
  `reason` text,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `waste_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `webhook_endpoints`;
CREATE TABLE `webhook_endpoints` (
  `id` int NOT NULL AUTO_INCREMENT,
  `url` varchar(500) NOT NULL,
  `events` text,
  `status` varchar(50) DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS=1;
