-- MySQL dump 10.13  Distrib 8.4.10, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: coffee_saas
-- ------------------------------------------------------
-- Server version	8.4.10-0ubuntu0.26.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `branch_products`
--

DROP TABLE IF EXISTS `branch_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=177 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branch_products`
--

LOCK TABLES `branch_products` WRITE;
/*!40000 ALTER TABLE `branch_products` DISABLE KEYS */;
INSERT INTO `branch_products` VALUES (153,1,150,2.5,0.8,100,1,5),(154,1,151,2.25,0.5,100,1,5),(155,1,152,3.5,1.5,100,1,5),(156,1,153,3.2,1.2,100,1,5),(157,1,154,6.5,5.2,100,1,5),(158,1,155,0.75,0.55,100,1,5),(159,1,156,2.2,1.65,100,1,5),(160,1,157,0.45,0.35,100,1,5),(172,1,169,2.5,1,10,1,5),(176,27,174,0.75,0,10,1,5);
/*!40000 ALTER TABLE `branch_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branch_tables`
--

DROP TABLE IF EXISTS `branch_tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branch_tables` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `business_id` int NOT NULL,
  `table_name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `qr_code_url` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('active','occupied','inactive') COLLATE utf8mb4_general_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branch_tables`
--

LOCK TABLES `branch_tables` WRITE;
/*!40000 ALTER TABLE `branch_tables` DISABLE KEYS */;
INSERT INTO `branch_tables` VALUES (1,6,5,'1','http://localhost:5173/scan?biz=5&branch=6&table=1','active','2026-03-07 03:01:19'),(2,7,6,'1','http://localhost:5173/scan?biz=6&branch=7&table=1','active','2026-03-18 03:32:29'),(3,14,14,'1','http://localhost:5173/scan?biz=14&branch=14&table=1','active','2026-04-02 08:00:00'),(4,14,14,'2','http://localhost:5173/scan?biz=14&branch=14&table=2','active','2026-04-02 08:32:21'),(5,14,14,'3','http://localhost:5173/scan?biz=14&branch=14&table=3','active','2026-04-02 08:32:26'),(6,14,14,'4','http://localhost:5173/scan?biz=14&branch=14&table=4','active','2026-04-02 08:32:29'),(7,13,13,'1','http://localhost:5173/scan?biz=13&branch=13&table=1','active','2026-04-02 14:38:15'),(8,13,13,'2','http://localhost:5173/scan?biz=13&branch=13&table=2','active','2026-04-02 16:25:02'),(9,27,30,'1','http://localhost:5173/scan?biz=30&branch=27&table=1','active','2026-06-25 11:15:02');
/*!40000 ALTER TABLE `branch_tables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `province` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `district` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_main` enum('0','1') COLLATE utf8mb4_general_ci DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `khqr_image` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `payment_merchant_id` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `payment_api_key` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `payment_receiver_name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `payment_provider` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'KHQR',
  `payment_api_url` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `lat` decimal(10,8) DEFAULT NULL,
  `lng` decimal(11,8) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `branches_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES (1,1,'Main Branch',NULL,NULL,NULL,NULL,'1','2026-03-03 12:51:40',NULL,NULL,NULL,NULL,'KHQR',NULL,NULL,NULL),(2,1,'coffee bean',NULL,NULL,'pp\nkpl','0977296971','0','2026-03-03 13:35:43',NULL,NULL,NULL,NULL,'KHQR',NULL,NULL,NULL),(27,30,'Main Branch',NULL,NULL,NULL,NULL,'1','2026-06-24 01:58:27',NULL,NULL,NULL,NULL,'KHQR',NULL,NULL,NULL),(33,36,'Main Branch',NULL,NULL,NULL,NULL,'1','2026-06-25 17:22:02',NULL,NULL,NULL,NULL,'KHQR',NULL,NULL,NULL);
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `business_categories`
--

DROP TABLE IF EXISTS `business_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `business_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `category_id` int NOT NULL,
  `is_active` tinyint DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `business_id` (`business_id`,`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=408 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `business_categories`
--

LOCK TABLES `business_categories` WRITE;
/*!40000 ALTER TABLE `business_categories` DISABLE KEYS */;
INSERT INTO `business_categories` VALUES (337,30,2,1),(338,30,15,1),(339,30,18,1),(340,30,24,0),(341,30,31,0),(342,30,32,0),(343,30,33,0),(344,30,34,0),(345,30,35,0),(346,30,36,0),(347,30,37,0),(348,30,38,0),(349,30,39,0),(350,30,40,0),(351,30,41,0),(352,30,42,0),(353,30,43,0),(354,30,44,0),(355,30,45,0),(356,30,46,0),(357,30,47,0),(358,30,48,0),(359,30,49,0),(360,30,50,0),(361,30,51,0),(362,30,52,0),(363,30,53,1),(364,30,54,1),(365,30,55,1),(366,30,56,1),(367,30,57,1),(368,30,58,1),(369,30,59,1),(370,30,60,1),(371,30,61,1),(372,30,62,1),(373,36,2,1),(374,36,18,1),(375,36,24,0),(376,36,31,0),(377,36,32,0),(378,36,33,0),(379,36,34,0),(380,36,35,0),(381,36,36,0),(382,36,37,0),(383,36,38,0),(384,36,39,0),(385,36,40,0),(386,36,41,0),(387,36,42,0),(388,36,43,0),(389,36,44,0),(390,36,45,0),(391,36,46,0),(392,36,47,0),(393,36,48,0),(394,36,49,0),(395,36,50,0),(396,36,51,0),(397,36,52,0),(398,36,53,1),(399,36,54,1),(400,36,55,1),(401,36,56,1),(402,36,57,1),(403,36,58,1),(404,36,59,1),(405,36,60,1),(406,36,61,1),(407,36,62,1);
/*!40000 ALTER TABLE `business_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `businesses`
--

DROP TABLE IF EXISTS `businesses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `businesses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `owner_name` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `province` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `district` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `logo` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `plan_type` enum('basic','standard','premium') COLLATE utf8mb4_general_ci DEFAULT 'basic',
  `package_id` int DEFAULT NULL,
  `active_modules` varchar(255) COLLATE utf8mb4_general_ci DEFAULT 'POS',
  `status` enum('active','suspended') COLLATE utf8mb4_general_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `plan_id` int DEFAULT '1',
  `tax_percent` decimal(5,2) DEFAULT '0.00',
  `service_charge` decimal(5,2) DEFAULT '0.00',
  `kh_exchange_rate` int DEFAULT '4100',
  `address` text COLLATE utf8mb4_general_ci,
  `website` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `currency_symbol` varchar(10) COLLATE utf8mb4_general_ci DEFAULT '$',
  `telegram_link` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `facebook_link` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `promo_title` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `promo_subtitle` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `promo_image` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `promo_discount` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `promo_is_active` tinyint DEFAULT '0',
  `global_discount` double DEFAULT '0',
  `telegram_token` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `telegram_chat_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `telegram_mode` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'polling',
  `telegram_webhook_url` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `global_bogo_active` tinyint DEFAULT '0',
  `global_bogo_text` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `promo_scope` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'all',
  `promo_applied_categories` text COLLATE utf8mb4_general_ci,
  `promo_applied_products` text COLLATE utf8mb4_general_ci,
  `promo_tag` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `promo_tag_color` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `promo_desc` text COLLATE utf8mb4_general_ci,
  `promo_buy_qty` int DEFAULT '0',
  `promo_get_qty` int DEFAULT '0',
  `promo_start_date` datetime DEFAULT NULL,
  `promo_end_date` datetime DEFAULT NULL,
  `discount_scope` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'all',
  `discount_applied_categories` text COLLATE utf8mb4_general_ci,
  `discount_applied_products` text COLLATE utf8mb4_general_ci,
  `smtp_user` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `smtp_pass` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `shop_size` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `business_nature` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `businesses`
--

LOCK TABLES `businesses` WRITE;
/*!40000 ALTER TABLE `businesses` DISABLE KEYS */;
INSERT INTO `businesses` VALUES (1,'System Default','Admin',NULL,NULL,NULL,NULL,NULL,'standard',NULL,'POS','active','2026-03-03 12:51:40',2,0.00,0.00,4100,NULL,NULL,'$',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,'polling',NULL,0,NULL,'all',NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,'all',NULL,NULL,NULL,NULL,NULL,NULL),(30,'ស្រីពេជ្រ កាហ្វេ','ស្រីពេជ្រ ','097759324','vahea2670@gmail.com','Battambang','Banreak',NULL,'basic',1,'POS','active','2026-06-24 01:58:27',2,0.00,0.00,4100,NULL,NULL,'$',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,'polling',NULL,0,NULL,'all',NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,'all',NULL,NULL,NULL,NULL,'small','coffee_only'),(36,'It sruk srae','Long','0977296971','vahea1510@gmail.com','Banteay Meanchey','Phnum Srok',NULL,'basic',1,'POS','active','2026-06-25 17:22:02',1,0.00,0.00,4100,NULL,NULL,'$',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,'polling',NULL,0,NULL,'all',NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,'all',NULL,NULL,NULL,NULL,'small','coffee_only');
/*!40000 ALTER TABLE `businesses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `image` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `default_moods` text COLLATE utf8mb4_general_ci,
  `default_sizes` text COLLATE utf8mb4_general_ci,
  `default_addons` text COLLATE utf8mb4_general_ci,
  `industry_code` varchar(255) COLLATE utf8mb4_general_ci DEFAULT 'coffee_cafe',
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=206 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (2,1,'Coffee','https://res.cloudinary.com/dq2iul0rv/image/upload/v1774963386/coffee-pos/img-1774963384742-162086675.avif','2026-03-04 16:12:18','[\"hot\",\"iced\",\"frappe\"]','[{\"label\":\"Small (S)\",\"value\":\"S\"},{\"label\":\"Medium (M)\",\"value\":\"M\"},{\"label\":\"Large (L)\",\"value\":\"L\"}]','[{\"label\":\"Cream\",\"value\":\"Cream\"}]','coffee_cafe'),(18,1,'Drink','https://res.cloudinary.com/dq2iul0rv/image/upload/v1774963490/coffee-pos/img-1774963487171-713940886.jpg','2026-03-31 13:24:50',NULL,NULL,NULL,'coffee_cafe'),(24,1,'General Medicine / ថ្នាំទូទៅ','https://res.cloudinary.com/dq2iul0rv/image/upload/v1775064344/coffee-pos/img-1775064341496-112733637.jpg','2026-04-01 17:24:47','Morning, Afternoon, Evening, Night, Before Meal, After Meal','Box, Strip, Pill','Keep in cool place, Avoid alcohol, Shake well\r\n','pharmacy'),(31,1,'ថ្នាំផ្សះ (Antibiotics)','https://res.cloudinary.com/dq2iul0rv/image/upload/v1775093901/coffee-pos/img-1775093899741-852292804.jpg','2026-04-02 01:38:22','លេបឱ្យអស់តាមវេជ្ជបញ្ជា (Finish course), រៀងរាល់ ៨ ម៉ោង (Every 8 hours), លេបមុនបាយ (Before Meal)','ប្រអប់ (Box), បន្ទះ (Strip), ដប (Bottle)','អាចមានប្រតិកម្មថ្នាំ (May cause allergy), កុំប្រើជាមួយគ្រឿងស្រវឹង (No alcohol)','pharmacy'),(32,1,'Vitamins & Supplements / វីតាមីន និងអាហារបំប៉ន',NULL,'2026-04-02 01:55:54','Morning, After Meal, Take with water','Bottle, Jar, Pouch','Not for treatment, Store at room temp','pharmacy'),(33,1,'Skincare & Personal Care / ថែរក្សាស្បែក និងរាងកាយ',NULL,'2026-04-02 01:55:54','After Wash, Morning/Evening, External use','Tube, Bottle, Sachet','Avoid eyes, Stop if irritation','pharmacy'),(34,1,'Medical Equipment / ឧបករណ៍វេជ្ជសាស្ត្រ',NULL,'2026-04-02 01:55:54','Single use, Emergency, Sterile','Piece, Set, Pack','Professional only, Discard after use','pharmacy'),(35,1,'Baby & Mom Care / ផលិតផលសម្រាប់ម្តាយ និងទារក',NULL,'2026-04-02 01:58:27','Daily use, Gentle, Morning/Night','Bottle, Pack, Piece','For sensitive skin, Keep away from heat','mart'),(36,1,'Seafood / គ្រឿងសមុទ្រ',NULL,'2026-04-02 04:11:27',NULL,'[{\"label\":\"Small\",\"value\":\"small\",\"price\":0},{\"label\":\"Large\",\"value\":\"large\",\"price\":5},{\"label\":\"1kg\",\"value\":\"1kg\",\"price\":15}]',NULL,'restaurant'),(37,1,'Soup / សម្ល',NULL,'2026-04-02 04:11:27',NULL,'[{\"label\":\"Small Bowl\",\"value\":\"small\",\"price\":0},{\"label\":\"Large Bowl\",\"value\":\"large\",\"price\":3}]',NULL,'restaurant'),(38,1,'Stir-Fry / ម្ហូបឆា',NULL,'2026-04-02 04:11:27',NULL,'[{\"label\":\"Normal\",\"value\":\"normal\",\"price\":0},{\"label\":\"Large\",\"value\":\"large\",\"price\":2}]',NULL,'restaurant'),(39,1,'Roasted & Deep-fried / ម្ហូបបំពង & អាំង',NULL,'2026-04-02 04:11:28',NULL,'[{\"label\":\"Half\",\"value\":\"half\",\"price\":0},{\"label\":\"Full\",\"value\":\"full\",\"price\":8}]',NULL,'restaurant'),(40,1,'Salads & Spicy Mixed / ញាំ & បុក',NULL,'2026-04-02 04:11:28','[{\"label\":\"Non-Spicy\",\"value\":\"no_spicy\"},{\"label\":\"Mild\",\"value\":\"mild\"},{\"label\":\"Spicy\",\"value\":\"spicy\"},{\"label\":\"Extra Spicy\",\"value\":\"extra_spicy\"}]','[{\"label\":\"Plate\",\"value\":\"plate\",\"price\":0}]',NULL,'restaurant'),(41,1,'Dessert / បង្អែម',NULL,'2026-04-02 04:11:28',NULL,'[{\"label\":\"Small\",\"value\":\"small\",\"price\":0},{\"label\":\"Large\",\"value\":\"large\",\"price\":1}]',NULL,'restaurant'),(42,1,'Drinks / ភេសជ្ជៈ',NULL,'2026-04-02 04:11:28','[{\"label\":\"Normal Ice\",\"value\":\"normal_ice\"},{\"label\":\"Less Ice\",\"value\":\"less_ice\"},{\"label\":\"No Ice\",\"value\":\"no_ice\"}]','[{\"label\":\"Normal\",\"value\":\"normal\",\"price\":0},{\"label\":\"Large\",\"value\":\"large\",\"price\":0.5}]',NULL,'restaurant'),(43,1,'Grocery','https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80','2026-04-02 14:07:27',NULL,'[{\"label\":\"1kg\",\"value\":\"1kg\"},{\"label\":\"5kg\",\"value\":\"5kg\"},{\"label\":\"Bulk\",\"value\":\"Bulk\"}]',NULL,'mart'),(44,1,'Beverages','https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80','2026-04-02 14:07:27','[{\"label\":\"Chilled\",\"value\":\"Chilled\"},{\"label\":\"Regular\",\"value\":\"Regular\"}]','[{\"label\":\"Can (330ml)\",\"value\":\"Can\"},{\"label\":\"Bottle (500ml)\",\"value\":\"Bottle\"},{\"label\":\"Large (1.5L)\",\"value\":\"Large\"}]',NULL,'mart'),(45,1,'Snacks & Biscuits','https://images.unsplash.com/photo-1599490659213-e2b9527bb087?auto=format&fit=crop&w=300&q=80','2026-04-02 14:07:27',NULL,'[{\"label\":\"Standard\",\"value\":\"Standard\"},{\"label\":\"Sharing Pack\",\"value\":\"Sharing\"}]',NULL,'mart'),(46,1,'Canned Goods','https://images.unsplash.com/photo-1563202970-13f649ba7c8f?auto=format&fit=crop&w=300&q=80','2026-04-02 14:07:27',NULL,'[{\"label\":\"Small Can\",\"value\":\"Small\"},{\"label\":\"Multipack\",\"value\":\"Multi\"}]',NULL,'mart'),(47,1,'Instant Noodles','https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=300&q=80','2026-04-02 14:07:27',NULL,'[{\"label\":\"Single Pack\",\"value\":\"Single\"},{\"label\":\"Bowl/Cup\",\"value\":\"Cup\"},{\"label\":\"Pack of 5\",\"value\":\"Pack5\"}]',NULL,'mart'),(48,1,'Dairy & Eggs','https://images.unsplash.com/photo-1550583724-1255d1426478?auto=format&fit=crop&w=300&q=80','2026-04-02 14:07:27',NULL,'[{\"label\":\"Single\",\"value\":\"Single\"},{\"label\":\"Dozen\",\"value\":\"Dozen\"},{\"label\":\"Pack\",\"value\":\"Pack\"}]',NULL,'mart'),(49,1,'Frozen Foods','https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=300&q=80','2026-04-02 14:07:27',NULL,'[{\"label\":\"Small\",\"value\":\"Small\"},{\"label\":\"Medium\",\"value\":\"Medium\"},{\"label\":\"Large\",\"value\":\"Large\"}]',NULL,'mart'),(50,1,'Household Supplies','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80','2026-04-02 14:07:27',NULL,'[{\"label\":\"Standard\",\"value\":\"Standard\"},{\"label\":\"Value Pack\",\"value\":\"Value\"}]',NULL,'mart'),(51,1,'Personal Care','https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=300&q=80','2026-04-02 14:07:27',NULL,'[{\"label\":\"Travel Size\",\"value\":\"Travel\"},{\"label\":\"Standard\",\"value\":\"Standard\"},{\"label\":\"Family Pack\",\"value\":\"Family\"}]',NULL,'mart'),(52,1,'Bakery','https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80','2026-04-02 14:07:27',NULL,'[{\"label\":\"Slice\",\"value\":\"Slice\"},{\"label\":\"Whole\",\"value\":\"Whole\"},{\"label\":\"Half\",\"value\":\"Half\"}]',NULL,'mart'),(53,1,'Hot Coffee','https://images.unsplash.com/photo-1541167760496-162955ed2a96?auto=format&fit=crop&w=300&q=80','2026-04-02 14:19:19','[{\"label\":\"Regular\",\"value\":\"Regular\"}]','[{\"label\":\"S\",\"value\":\"S\"},{\"label\":\"M\",\"value\":\"M\"}]','[{\"label\":\"Sugar\",\"value\":\"Sugar\"},{\"label\":\"Honey\",\"value\":\"Honey\"}]','coffee_cafe'),(54,1,'Iced Coffee','https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=300&q=80','2026-04-02 14:19:19','[{\"label\":\"No Sugar\",\"value\":\"No Sugar\"},{\"label\":\"50% Sugar\",\"value\":\"50% Sugar\"},{\"label\":\"100% Sugar\",\"value\":\"100% Sugar\"}]','[{\"label\":\"M\",\"value\":\"M\"},{\"label\":\"L\",\"value\":\"L\"}]','[{\"label\":\"Extra Shot\",\"value\":\"Extra Shot\"},{\"label\":\"Caramel\",\"value\":\"Caramel\"}]','coffee_cafe'),(55,1,'Frappe & Blended','https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=300&q=80','2026-04-02 14:19:19',NULL,'[{\"label\":\"M\",\"value\":\"M\"},{\"label\":\"L\",\"value\":\"L\"}]','[{\"label\":\"Whipped Cream\",\"value\":\"Whipped Cream\"},{\"label\":\"Chocolate Chip\",\"value\":\"Chocolate Chip\"}]','coffee_cafe'),(56,1,'Organic Tea','https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=300&q=80','2026-04-02 14:19:19','[{\"label\":\"Hot\",\"value\":\"Hot\"},{\"label\":\"Iced\",\"value\":\"Iced\"}]','[{\"label\":\"Pot\",\"value\":\"Pot\"},{\"label\":\"Cup\",\"value\":\"Cup\"}]',NULL,'coffee_cafe'),(57,1,'Fruit Soda & Refreshers','https://images.unsplash.com/photo-1513558161293-cdaf7659a18b?auto=format&fit=crop&w=300&q=80','2026-04-02 14:19:19',NULL,'[{\"label\":\"Regular\",\"value\":\"Regular\"},{\"label\":\"Large\",\"value\":\"Large\"}]','[{\"label\":\"Fresh Fruit\",\"value\":\"Fresh Fruit\"}]','coffee_cafe'),(58,1,'Milk-Based Drinks','https://images.unsplash.com/photo-1553909489-eb96057ff746?auto=format&fit=crop&w=300&q=80','2026-04-02 14:19:19','[{\"label\":\"Hot\",\"value\":\"Hot\"},{\"label\":\"Iced\",\"value\":\"Iced\"},{\"label\":\"Blended\",\"value\":\"Blended\"}]','[{\"label\":\"S\",\"value\":\"S\"},{\"label\":\"M\",\"value\":\"M\"},{\"label\":\"L\",\"value\":\"L\"}]','[{\"label\":\"Milk Foam\",\"value\":\"Milk Foam\"}]','coffee_cafe'),(59,1,'Pastries & Bread','https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80','2026-04-02 14:19:19','[{\"label\":\"Warm up\",\"value\":\"Warm up\"},{\"label\":\"Regular\",\"value\":\"Regular\"}]',NULL,'[{\"label\":\"Butter\",\"value\":\"Butter\"},{\"label\":\"Jam\",\"value\":\"Jam\"}]','coffee_cafe'),(60,1,'Signature Specials','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=300&q=80','2026-04-02 14:19:19',NULL,'[{\"label\":\"Regular\",\"value\":\"Regular\"}]',NULL,'coffee_cafe'),(61,1,'Cakes & Desserts','https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80','2026-04-02 14:19:19',NULL,'[{\"label\":\"Slice\",\"value\":\"Slice\"},{\"label\":\"Whole\",\"value\":\"Whole\"}]',NULL,'coffee_cafe'),(62,1,'Healthy Juices','https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=300&q=80','2026-04-02 14:19:19',NULL,'[{\"label\":\"Regular\",\"value\":\"Regular\"}]',NULL,'coffee_cafe');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_redeems`
--

DROP TABLE IF EXISTS `customer_redeems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_redeems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `business_id` int NOT NULL,
  `reward_name` varchar(255) NOT NULL,
  `stars_used` int DEFAULT '0',
  `redeemed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_redeems`
--

LOCK TABLES `customer_redeems` WRITE;
/*!40000 ALTER TABLE `customer_redeems` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_redeems` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `google_id` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `profile_image` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tier_id` int DEFAULT NULL,
  `points` int DEFAULT '0',
  `total_spent` double DEFAULT '0',
  `card_number` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `wallet_balance` double DEFAULT '0',
  `otp_code` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `otp_expiry` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee`
--

DROP TABLE IF EXISTS `employee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `gender` tinyint(1) DEFAULT NULL,
  `position` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT NULL,
  `tel` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_general_ci,
  `status` enum('active','resigned','suspended') COLLATE utf8mb4_general_ci DEFAULT 'active',
  `create_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `employee_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee`
--

LOCK TABLES `employee` WRITE;
/*!40000 ALTER TABLE `employee` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expense`
--

DROP TABLE IF EXISTS `expense`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `branch_id` int DEFAULT NULL,
  `expense_type_id` int DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'Cash',
  `description` text COLLATE utf8mb4_general_ci,
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense`
--

LOCK TABLES `expense` WRITE;
/*!40000 ALTER TABLE `expense` DISABLE KEYS */;
/*!40000 ALTER TABLE `expense` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expense_type`
--

DROP TABLE IF EXISTS `expense_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `expense_type_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense_type`
--

LOCK TABLES `expense_type` WRITE;
/*!40000 ALTER TABLE `expense_type` DISABLE KEYS */;
/*!40000 ALTER TABLE `expense_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favorites`
--

DROP TABLE IF EXISTS `favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_product` (`user_id`,`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favorites`
--

LOCK TABLES `favorites` WRITE;
/*!40000 ALTER TABLE `favorites` DISABLE KEYS */;
INSERT INTO `favorites` VALUES (1,7,46,'2026-03-18 09:28:01');
/*!40000 ALTER TABLE `favorites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `membership_tiers`
--

DROP TABLE IF EXISTS `membership_tiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `membership_tiers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `min_points` int DEFAULT '0',
  `discount_rate` double DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `membership_tiers`
--

LOCK TABLES `membership_tiers` WRITE;
/*!40000 ALTER TABLE `membership_tiers` DISABLE KEYS */;
INSERT INTO `membership_tiers` VALUES (1,1,'Welcome',0,0,'2026-06-11 01:40:37'),(2,1,'Silver',500,5,'2026-06-11 01:40:37'),(3,1,'Gold',1500,10,'2026-06-11 01:40:37'),(4,1,'Platinum',5000,15,'2026-06-11 01:40:37');
/*!40000 ALTER TABLE `membership_tiers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modular_packages`
--

DROP TABLE IF EXISTS `modular_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modular_packages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `icon` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ui_layout` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'coffee',
  `status` enum('active','inactive') COLLATE utf8mb4_general_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `industry_code` varchar(255) COLLATE utf8mb4_general_ci DEFAULT 'coffee_cafe',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modular_packages`
--

LOCK TABLES `modular_packages` WRITE;
/*!40000 ALTER TABLE `modular_packages` DISABLE KEYS */;
INSERT INTO `modular_packages` VALUES (1,'Coffee & Cafe','coffee_cafe','Standard setup for coffee shops and cafes','CoffeeOutlined','coffee','active','2026-04-01 02:31:12','coffee_cafe'),(2,'Restaurant & Dining','restaurant','Full dining experience with table management',NULL,'coffee','inactive','2026-04-01 02:31:12','restaurant'),(3,'Grocery & Mart','mart','Fast retail and inventory focused',NULL,'retail','inactive','2026-04-01 02:31:12','retail'),(4,'Pharmacy & Medical','',NULL,NULL,'pharmacy','inactive','2026-04-01 16:44:29','pharmacy');
/*!40000 ALTER TABLE `modular_packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `module_permissions`
--

DROP TABLE IF EXISTS `module_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `module_permissions` (
  `module_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`module_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `module_permissions_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `system_modules` (`id`) ON DELETE CASCADE,
  CONSTRAINT `module_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `module_permissions`
--

LOCK TABLES `module_permissions` WRITE;
/*!40000 ALTER TABLE `module_permissions` DISABLE KEYS */;
INSERT INTO `module_permissions` VALUES (1,1),(2,1),(1,2),(2,3),(1,4),(2,4),(1,5),(2,5),(1,6),(2,7),(2,8),(2,9),(1,10),(2,10),(1,11),(2,11),(1,12),(2,12),(1,13),(2,13),(1,14),(2,14),(1,15),(2,15),(1,16),(2,16),(1,19),(2,19),(2,20),(1,23),(2,23),(2,25),(2,29),(1,31),(1,33);
/*!40000 ALTER TABLE `module_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_details`
--

DROP TABLE IF EXISTS `order_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `qty` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `note` text COLLATE utf8mb4_general_ci,
  `kitchen_batch_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `kitchen_status` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_details_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_details_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=133 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_details`
--

LOCK TABLES `order_details` WRITE;
/*!40000 ALTER TABLE `order_details` DISABLE KEYS */;
INSERT INTO `order_details` VALUES (132,83,174,1,0.75,'iced','B1782386178216','preparing');
/*!40000 ALTER TABLE `order_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `customer_id` int DEFAULT NULL,
  `branch_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `shift_id` int DEFAULT NULL,
  `customer_name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `table_no` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `sub_total` decimal(10,2) NOT NULL,
  `tax` decimal(10,2) DEFAULT '0.00',
  `discount` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(100) COLLATE utf8mb4_general_ci DEFAULT 'cash',
  `order_type` varchar(100) COLLATE utf8mb4_general_ci DEFAULT 'dine_in',
  `status` varchar(100) COLLATE utf8mb4_general_ci DEFAULT 'ordered',
  `kitchen_status` varchar(20) COLLATE utf8mb4_general_ci DEFAULT 'pending',
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
) ENGINE=InnoDB AUTO_INCREMENT=84 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (5,1,NULL,1,1,NULL,'','',5.00,0.00,0.00,5.00,'Wing','dine_in','completed','pending','2026-03-17 09:46:45',NULL,NULL,0,1,0.00),(6,1,NULL,1,1,NULL,'','',2.50,0.00,0.00,2.50,'ABA','dine_in','completed','pending','2026-03-17 09:49:30',NULL,NULL,0,1,0.00),(7,1,NULL,1,1,NULL,'','',1.50,0.00,0.00,1.42,'Cash','dine_in','completed','pending','2026-03-17 09:50:51',NULL,NULL,0,1,0.00),(8,1,NULL,1,1,NULL,'','',1.50,0.00,0.00,1.42,'ABA','dine_in','completed','pending','2026-03-17 09:56:48',NULL,NULL,0,1,0.00),(25,1,NULL,1,1,NULL,'','',1.50,0.00,0.00,1.41,'ABA','dine_in','completed','pending','2026-03-24 12:23:08',NULL,NULL,0,1,0.00),(26,1,NULL,1,1,NULL,'','',1.50,0.00,0.00,1.41,'ABA','dine_in','completed','pending','2026-03-24 12:24:27',NULL,NULL,0,1,0.00),(27,1,NULL,1,1,NULL,'','',1.50,0.00,0.00,1.41,'ABA','dine_in','completed','pending','2026-03-24 12:39:47',NULL,NULL,0,1,0.00),(28,1,NULL,1,1,NULL,'','',0.01,0.00,0.00,0.01,'ABA','dine_in','completed','pending','2026-03-24 12:41:33',NULL,NULL,0,1,0.00),(29,1,NULL,1,1,NULL,'','',1.50,0.00,0.00,1.41,'ABA','dine_in','completed','pending','2026-03-24 12:44:46',NULL,NULL,0,1,0.00),(30,1,NULL,1,1,NULL,'','',0.01,0.00,0.00,0.01,'ABA','dine_in','completed','pending','2026-03-24 12:44:56',NULL,NULL,0,1,0.00),(31,1,NULL,1,1,NULL,'','',0.01,0.00,0.00,0.01,'Wing','dine_in','completed','pending','2026-03-24 12:45:38',NULL,NULL,0,1,0.00),(83,30,NULL,27,NULL,18,'Web Guest','1',0.75,0.00,0.00,0.75,'Other','dine_in','completed','preparing','2026-06-25 11:16:18',11.5605504,104.8838144,1,1,0.75);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `package_permissions`
--

DROP TABLE IF EXISTS `package_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `package_permissions` (
  `package_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`package_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `package_permissions_ibfk_1` FOREIGN KEY (`package_id`) REFERENCES `modular_packages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `package_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `package_permissions`
--

LOCK TABLES `package_permissions` WRITE;
/*!40000 ALTER TABLE `package_permissions` DISABLE KEYS */;
INSERT INTO `package_permissions` VALUES (3,1),(4,1),(1,2),(2,2),(3,2),(4,2),(1,4),(2,4),(3,4),(4,4),(1,5),(2,5),(4,6),(3,7),(3,8),(3,9),(4,9),(4,10),(4,23);
/*!40000 ALTER TABLE `package_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `plan_id` int NOT NULL,
  `tran_id` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('pending','paid','failed','cancelled') COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `duration_days` int DEFAULT '30',
  `payway_ref` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `error_msg` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tran_id` (`tran_id`),
  KEY `business_id` (`business_id`),
  KEY `plan_id` (`plan_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (5,30,2,'POS-1782385224581-GVLEI',30.00,'paid',30,'SIMULATED',NULL,'2026-06-25 11:00:24','2026-06-25 11:00:28');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `route_key` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `min_plan_id` int DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'Dashboard','/dashboard',1),(2,'POS','/invoices',1),(3,'Branches','/shop_managment',1),(4,'Product','/product',1),(5,'Category','/category',1),(6,'Order History','/order',1),(7,'Purchase','/purchase',1),(8,'Supplier','/supplier',1),(9,'Inventory Stock','/raw_material',1),(10,'Employees','/user',1),(11,'Permissions','/role',1),(12,'Sales Report','/report_Sale_Summary',1),(13,'Expense Report','/report_Expense_Summary',1),(14,'Best Sellers','/Top_Sale',1),(15,'Profile','/profile',1),(16,'Expense','/expense',1),(17,'Role Permissions','/permission',1),(18,'Subscription Plans','/plans',999),(19,'My Subscription','/my-plan',1),(20,'Stock View','/stock',1),(21,'Stock Adjust','stock/adjust',1),(22,'Table Management','/table',1),(23,'System Settings','/settings',1),(24,'Kitchen (KDS)','/kds',1),(25,'Service Blueprints','/service-blueprints',1),(26,'System Modules','/system-modules',1),(28,'Platform Team','/platform-user',1),(29,'Businesses','/business',1),(30,'System Subscriptions','/system-subscriptions',1),(31,'Notifications','/notifications',1),(32,'Smart Marketing','marketing/dashboard',1),(33,'Shop Landing Page','/welcome',1);
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plan_permissions`
--

DROP TABLE IF EXISTS `plan_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plan_permissions` (
  `plan_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`plan_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `plan_permissions_ibfk_1` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `plan_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plan_permissions`
--

LOCK TABLES `plan_permissions` WRITE;
/*!40000 ALTER TABLE `plan_permissions` DISABLE KEYS */;
INSERT INTO `plan_permissions` VALUES (3,1),(3,2),(3,3),(3,4),(3,5),(3,6),(2,7),(3,7),(2,8),(3,8),(3,9),(3,10),(3,12),(3,13),(3,14),(3,15),(3,16),(3,19),(2,20),(3,20),(3,21),(2,22),(3,22),(3,23),(3,24),(3,28),(3,29),(2,31),(3,31),(3,32),(3,33);
/*!40000 ALTER TABLE `plan_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `category_id` int DEFAULT NULL,
  `barcode` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `brand` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `image` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `sizes` text COLLATE utf8mb4_general_ci,
  `addons` text COLLATE utf8mb4_general_ci,
  `moods` text COLLATE utf8mb4_general_ci,
  `status` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `discount` double DEFAULT '0',
  `product_type` enum('ready','recipe') COLLATE utf8mb4_general_ci DEFAULT 'ready',
  `expiry_date` date DEFAULT NULL,
  `strength` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `generic_name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=175 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (150,1,53,'10002001',NULL,'Classic Hot Latte',NULL,'https://images.unsplash.com/photo-1570968915860-54d5c401ff31?auto=format&fit=crop&w=300&q=80','[{\"label\":\"Regular\",\"value\":\"R\",\"price\":2.5},{\"label\":\"Large\",\"value\":\"L\",\"price\":3.2}]',NULL,'[{\"label\":\"Hot\",\"value\":\"hot\"}]',1,'2026-04-02 14:24:38',0,'ready',NULL,NULL,NULL),(151,1,54,'10002002',NULL,'Iced Americano',NULL,'https://images.unsplash.com/photo-1551046710-388b93902345?auto=format&fit=crop&w=300&q=80','[{\"label\":\"Regular\",\"value\":\"R\",\"price\":2.25},{\"label\":\"Large\",\"value\":\"L\",\"price\":2.75}]',NULL,'[{\"label\":\"Iced\",\"value\":\"iced\"}]',1,'2026-04-02 14:24:38',0,'ready',NULL,NULL,NULL),(152,1,61,'10002003',NULL,'Blueberry Cheesecake',NULL,'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=300&q=80',NULL,NULL,NULL,1,'2026-04-02 14:24:38',0,'ready',NULL,NULL,NULL),(153,1,56,'10002004',NULL,'Matcha Latte',NULL,'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=300&q=80',NULL,NULL,'[{\"label\":\"Hot\",\"value\":\"hot\"},{\"label\":\"Iced\",\"value\":\"iced\"}]',1,'2026-04-02 14:24:38',0,'ready',NULL,NULL,NULL),(154,1,43,'20001001',NULL,'Angkor Jasmine Rice 5kg',NULL,'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=300&q=80',NULL,NULL,NULL,1,'2026-04-02 14:24:38',0,'ready',NULL,NULL,NULL),(155,1,44,'20001002',NULL,'Coca Cola Classic Can',NULL,'https://images.unsplash.com/photo-1581622558663-b2933044434c?auto=format&fit=crop&w=300&q=80',NULL,NULL,NULL,1,'2026-04-02 14:24:38',0,'ready',NULL,NULL,NULL),(156,1,45,'20001003',NULL,'Pringles Sour Cream 110g',NULL,'https://images.unsplash.com/photo-1582234053213-92c53300491e?auto=format&fit=crop&w=300&q=80',NULL,NULL,NULL,1,'2026-04-02 14:24:38',0,'ready',NULL,NULL,NULL),(157,1,47,'20001004',NULL,'Mama Instant Noodles (Pork)',NULL,'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=300&q=80',NULL,NULL,NULL,1,'2026-04-02 14:24:38',0,'ready',NULL,NULL,NULL),(169,1,2,'43442796',NULL,'Latte Coffee Test','Test product remarks',NULL,'[]','[]','[]',1,'2026-06-15 12:21:13',0,'ready',NULL,NULL,NULL),(174,30,2,'73620303',NULL,'Latte Coffee',NULL,'img-1782272248406-788559887.jpeg','[]','[]','[\"iced\"]',1,'2026-06-24 03:37:28',0,'ready',NULL,NULL,NULL);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase`
--

DROP TABLE IF EXISTS `purchase`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `supplier_id` int DEFAULT NULL,
  `ref` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `paid_amount` decimal(10,2) NOT NULL,
  `note` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `purchase_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(20) COLLATE utf8mb4_general_ci DEFAULT 'Pending',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `payment_method` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'Cash',
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase`
--

LOCK TABLES `purchase` WRITE;
/*!40000 ALTER TABLE `purchase` DISABLE KEYS */;
INSERT INTO `purchase` VALUES (5,30,27,3,'PO-1782388574517',50.00,0.00,NULL,'2026-06-25 11:56:14',23,'2026-06-25 18:49:39','Pending',0.00,0.00,'Cash');
/*!40000 ALTER TABLE `purchase` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_product`
--

DROP TABLE IF EXISTS `purchase_product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_product` (
  `id` int NOT NULL AUTO_INCREMENT,
  `purchase_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `raw_material_id` int DEFAULT NULL,
  `qty` int NOT NULL,
  `received_qty` decimal(10,2) DEFAULT '0.00',
  `cost` decimal(10,2) NOT NULL,
  `batch_no` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `unit` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `remark` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `purchase_id` (`purchase_id`),
  KEY `product_id` (`product_id`),
  KEY `raw_material_id` (`raw_material_id`),
  CONSTRAINT `purchase_product_ibfk_1` FOREIGN KEY (`purchase_id`) REFERENCES `purchase` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_product_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `purchase_product_ibfk_3` FOREIGN KEY (`raw_material_id`) REFERENCES `raw_material` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_product`
--

LOCK TABLES `purchase_product` WRITE;
/*!40000 ALTER TABLE `purchase_product` DISABLE KEYS */;
INSERT INTO `purchase_product` VALUES (6,5,174,NULL,10,0.00,5.00,NULL,NULL,'Pcs',NULL);
/*!40000 ALTER TABLE `purchase_product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `raw_material`
--

DROP TABLE IF EXISTS `raw_material`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `raw_material` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `branch_id` int DEFAULT NULL,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `qty` decimal(10,2) DEFAULT '0.00',
  `min_stock` decimal(10,2) DEFAULT '0.00',
  `par_level` decimal(10,2) DEFAULT '0.00',
  `unit` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `price` decimal(10,2) DEFAULT '0.00',
  `avg_cost` decimal(10,2) DEFAULT '0.00',
  `image` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `raw_material_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `raw_material_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `raw_material`
--

LOCK TABLES `raw_material` WRITE;
/*!40000 ALTER TABLE `raw_material` DISABLE KEYS */;
INSERT INTO `raw_material` VALUES (3,1,1,'Coffee Powder',NULL,5.80,2.00,0.00,'kg',12.00,0.00,NULL,1,'2026-03-04 16:12:18');
/*!40000 ALTER TABLE `raw_material` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recipe_detail`
--

DROP TABLE IF EXISTS `recipe_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recipe_detail` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `product_id` int NOT NULL,
  `raw_material_id` int NOT NULL,
  `qty` decimal(10,3) NOT NULL,
  `unit` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `raw_material_id` (`raw_material_id`),
  CONSTRAINT `recipe_detail_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `recipe_detail_ibfk_2` FOREIGN KEY (`raw_material_id`) REFERENCES `raw_material` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipe_detail`
--

LOCK TABLES `recipe_detail` WRITE;
/*!40000 ALTER TABLE `recipe_detail` DISABLE KEYS */;
/*!40000 ALTER TABLE `recipe_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1,1,1,1,1),(1,5,1,1,1,1),(1,10,1,0,0,0),(1,11,1,1,1,1),(1,15,1,1,1,1),(1,17,1,1,1,1),(1,18,1,1,1,1),(1,22,1,1,1,1),(1,23,1,1,1,1),(1,25,1,1,1,1),(1,26,1,0,0,0),(1,28,1,1,1,1),(1,29,1,1,1,1),(1,30,1,1,1,1),(1,31,1,1,1,1),(2,1,1,0,0,0),(2,2,1,0,0,0),(2,3,1,1,1,1),(2,4,1,1,1,1),(2,5,0,1,1,1),(2,6,1,1,1,1),(2,7,1,1,1,1),(2,8,1,1,1,1),(2,9,1,1,1,1),(2,10,1,1,1,1),(2,11,1,1,1,1),(2,12,1,1,1,1),(2,13,1,1,1,1),(2,14,1,1,1,1),(2,15,1,1,1,1),(2,16,1,1,1,1),(2,17,1,1,1,1),(2,18,1,0,0,0),(2,19,1,1,1,1),(2,20,1,1,1,1),(2,21,1,1,1,1),(2,22,1,1,1,1),(2,23,1,1,1,1),(2,24,1,0,0,0),(2,25,1,0,0,0),(2,26,1,0,0,0),(2,28,1,0,0,0),(2,29,1,0,0,0),(2,30,1,0,0,0),(2,31,1,1,1,1),(2,32,1,1,1,1),(2,33,1,0,0,0),(3,2,1,1,1,1),(3,4,1,1,1,1),(3,5,1,1,1,1),(3,6,1,1,1,1),(3,20,1,1,1,1),(3,21,1,1,1,1),(3,22,1,1,1,1),(3,25,1,0,0,0),(3,26,1,0,0,0),(3,31,1,1,1,1),(3,33,1,0,0,0),(64,1,1,1,1,1),(64,2,1,1,1,1),(64,3,1,1,1,1),(64,4,1,1,1,1),(64,5,1,1,1,1),(64,6,1,1,1,1),(64,7,1,1,1,1),(64,8,1,1,1,1),(64,9,1,1,1,1),(64,10,1,1,1,1),(64,11,1,1,1,1),(64,12,1,1,1,1),(64,13,1,1,1,1),(64,14,1,1,1,1),(64,15,1,1,1,1),(64,16,1,1,1,1),(64,17,1,1,1,1),(64,18,1,1,1,1),(64,19,1,1,1,1),(64,20,1,1,1,1),(64,21,1,1,1,1),(64,22,1,1,1,1),(64,23,1,1,1,1),(64,24,1,1,1,1),(64,25,1,1,1,1),(64,26,1,1,1,1),(64,28,1,1,1,1),(64,29,1,1,1,1),(64,30,1,1,1,1),(64,31,1,1,1,1),(64,32,1,1,1,1),(64,33,1,1,1,1),(65,2,1,1,1,1),(65,4,1,1,1,1),(65,5,1,1,1,1),(65,6,1,1,1,1),(65,7,1,1,1,1),(65,8,1,1,1,1),(65,12,1,1,1,1),(65,15,1,1,1,1),(65,16,1,1,1,1),(65,20,1,1,1,1),(65,22,1,1,1,1),(66,2,1,1,1,0),(66,4,1,1,1,0),(66,5,1,1,1,0),(66,6,1,1,1,0),(66,15,1,1,1,0),(66,22,1,1,1,0),(82,1,1,1,1,1),(82,2,1,1,1,1),(82,3,1,1,1,1),(82,4,1,1,1,1),(82,5,1,1,1,1),(82,6,1,1,1,1),(82,7,1,1,1,1),(82,8,1,1,1,1),(82,9,1,1,1,1),(82,10,1,1,1,1),(82,11,1,1,1,1),(82,12,1,1,1,1),(82,13,1,1,1,1),(82,14,1,1,1,1),(82,15,1,1,1,1),(82,16,1,1,1,1),(82,17,1,1,1,1),(82,18,1,1,1,1),(82,19,1,1,1,1),(82,20,1,1,1,1),(82,21,1,1,1,1),(82,22,1,1,1,1),(82,23,1,1,1,1),(82,24,1,1,1,1),(82,25,1,1,1,1),(82,26,1,1,1,1),(82,28,1,1,1,1),(82,29,1,1,1,1),(82,30,1,1,1,1),(82,31,1,1,1,1),(82,32,1,1,1,1),(82,33,1,1,1,1),(83,2,1,1,1,1),(83,4,1,1,1,1),(83,5,1,1,1,1),(83,6,1,1,1,1),(83,7,1,1,1,1),(83,8,1,1,1,1),(83,12,1,1,1,1),(83,15,1,1,1,1),(83,16,1,1,1,1),(83,20,1,1,1,1),(83,22,1,1,1,1),(84,2,1,1,1,0),(84,4,1,1,1,0),(84,5,1,1,1,0),(84,6,1,1,1,0),(84,15,1,1,1,0),(84,22,1,1,1,0);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `roles_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,1,'PlatForm Owner','PLATEFORM_OWNER'),(2,1,'Business Owner','OWNER'),(3,1,'Cashier','CASHIER'),(64,30,'Owner','owner'),(65,30,'Manager','manager'),(66,30,'Sale','sale'),(82,36,'Owner','owner'),(83,36,'Manager','manager'),(84,36,'Sale','sale');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shifts`
--

DROP TABLE IF EXISTS `shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  `remark` text COLLATE utf8mb4_general_ci,
  `status` varchar(20) COLLATE utf8mb4_general_ci DEFAULT 'Closed',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shifts`
--

LOCK TABLES `shifts` WRITE;
/*!40000 ALTER TABLE `shifts` DISABLE KEYS */;
INSERT INTO `shifts` VALUES (1,6,7,8,50.00,100000.00,51.00,100000.00,76.00,2.00,0.00,1.00,0.00,0.00,0.00,NULL,'Closed','2026-03-17 14:18:21',NULL),(2,6,7,8,0.00,0.00,0.00,0.00,1.00,2.00,0.00,1.00,0.00,0.00,-1.00,NULL,'Closed','2026-03-17 14:19:05',NULL),(3,6,7,8,50.00,10000.00,51.00,10000.00,53.50,2.00,1.00,1.00,0.00,0.00,0.00,NULL,'Closed','2026-03-18 02:03:48','2026-03-18 02:08:05'),(4,6,7,8,10.00,0.00,0.00,0.00,11.50,2.50,1.50,1.00,0.00,0.00,-11.50,NULL,'Closed','2026-03-18 02:13:13','2026-03-18 03:23:34'),(5,6,7,7,50.00,0.00,51.50,0.00,51.50,2.50,1.50,1.00,0.00,0.00,0.00,NULL,'Closed','2026-03-18 02:23:02','2026-03-18 02:24:11'),(6,6,7,7,10.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,NULL,'Open','2026-03-18 03:47:53',NULL),(7,1,1,1,50.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,NULL,'Open','2026-03-24 12:03:50',NULL),(8,5,6,6,50.00,0.00,50.00,0.00,50.00,15.00,0.00,0.00,0.00,0.00,0.00,NULL,'Closed','2026-03-24 14:40:06','2026-03-31 12:34:08'),(9,5,6,9,0.00,0.00,5.50,0.00,5.50,8.50,5.50,0.00,3.00,0.00,0.00,NULL,'Closed','2026-03-25 03:00:22','2026-04-01 09:43:59'),(10,11,11,14,50.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,NULL,'Open','2026-03-25 03:51:57',NULL),(11,12,12,15,10.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,NULL,'Open','2026-03-28 16:45:54',NULL),(12,5,6,6,50.00,0.00,50.00,0.00,50.00,0.00,0.00,0.00,0.00,0.00,0.00,NULL,'Closed','2026-03-31 12:34:15','2026-03-31 14:40:13'),(13,5,6,6,50.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,NULL,'Open','2026-03-31 14:41:12',NULL),(14,14,14,17,100.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,NULL,'Open','2026-03-31 14:45:20',NULL),(15,14,14,18,50.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,NULL,'Open','2026-03-31 15:30:55',NULL),(16,13,13,16,50.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,NULL,'Open','2026-04-02 14:20:34',NULL),(17,15,15,19,10.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,NULL,'Open','2026-06-15 12:25:08',NULL),(18,30,27,23,50.00,0.00,50.00,0.00,50.00,0.75,0.00,0.00,0.00,0.00,0.00,NULL,'Closed','2026-06-25 11:27:21','2026-06-25 11:44:25');
/*!40000 ALTER TABLE `shifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_logs`
--

DROP TABLE IF EXISTS `stock_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `item_type` enum('product','raw_material') COLLATE utf8mb4_general_ci NOT NULL,
  `item_id` int NOT NULL,
  `old_qty` decimal(10,2) NOT NULL,
  `new_qty` decimal(10,2) NOT NULL,
  `qty_changed` decimal(10,2) NOT NULL,
  `type` enum('sale','purchase','receive','adjustment','waste','return') COLLATE utf8mb4_general_ci NOT NULL,
  `ref_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reason` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `batch_no` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `unit_cost` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `idx_item_logs` (`business_id`,`item_type`,`item_id`),
  CONSTRAINT `stock_logs_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_logs`
--

LOCK TABLES `stock_logs` WRITE;
/*!40000 ALTER TABLE `stock_logs` DISABLE KEYS */;
INSERT INTO `stock_logs` VALUES (1,1,1,'raw_material',3,0.00,0.00,1.00,'purchase',NULL,'Test Purchase 1kg','2026-03-04 16:12:39',NULL,NULL,NULL,0.00),(2,1,1,'raw_material',3,1.00,0.80,-0.20,'sale',NULL,'POS Sale 10 Lattes','2026-03-04 16:12:39',NULL,NULL,NULL,0.00);
/*!40000 ALTER TABLE `stock_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_plans`
--

DROP TABLE IF EXISTS `subscription_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `max_branches` int DEFAULT '1',
  `max_staff` int DEFAULT '2',
  `max_products` int DEFAULT '50',
  `price` decimal(10,2) DEFAULT '0.00',
  `billing_cycle` enum('monthly','lifetime') COLLATE utf8mb4_general_ci DEFAULT 'monthly',
  `is_active` tinyint DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `active_modules` text COLLATE utf8mb4_general_ci,
  `max_categories` int NOT NULL DEFAULT '10',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_plans`
--

LOCK TABLES `subscription_plans` WRITE;
/*!40000 ALTER TABLE `subscription_plans` DISABLE KEYS */;
INSERT INTO `subscription_plans` VALUES (1,'Free Plan',1,2,20,0.00,'monthly',1,'2026-03-03 15:03:30','POS',3),(2,'Pro Plan',5,10,50,30.00,'monthly',1,'2026-03-03 15:03:30','POS',10),(3,'Enterprise',999,999,9999,800.00,'lifetime',1,'2026-03-03 15:03:30','POS',999);
/*!40000 ALTER TABLE `subscription_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscriptions`
--

DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `plan_type` enum('basic','standard','premium') COLLATE utf8mb4_general_ci NOT NULL,
  `price` decimal(10,2) DEFAULT '0.00',
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('active','expired','cancelled') COLLATE utf8mb4_general_ci DEFAULT 'active',
  `tran_id` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `payment_status` enum('pending','paid','failed') COLLATE utf8mb4_general_ci DEFAULT 'paid',
  `plan_id` int DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscriptions`
--

LOCK TABLES `subscriptions` WRITE;
/*!40000 ALTER TABLE `subscriptions` DISABLE KEYS */;
INSERT INTO `subscriptions` VALUES (1,1,'standard',29.00,'2026-03-03','2027-03-03','active',NULL,'paid',2,'2026-03-04 14:12:33'),(30,30,'basic',0.00,'2026-06-24','2026-07-24','expired',NULL,'paid',1,'2026-06-24 01:58:27'),(31,30,'standard',0.00,'2026-06-25','2026-07-25','active','POS-1782385224581-GVLEI','paid',2,'2026-06-25 11:02:38'),(37,36,'basic',0.00,'2026-06-25','2026-07-25','active',NULL,'paid',1,'2026-06-25 17:22:02');
/*!40000 ALTER TABLE `subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `tel` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_general_ci,
  `website` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `business_id` (`business_id`),
  CONSTRAINT `suppliers_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (3,30,'OWNER','Pong Chiva','099822282/093822282','pongchiva257@gmail.com','pp',NULL,NULL,'2026-06-25 11:49:36');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_modules`
--

DROP TABLE IF EXISTS `system_modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_modules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `status` enum('active','inactive') COLLATE utf8mb4_general_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_modules`
--

LOCK TABLES `system_modules` WRITE;
/*!40000 ALTER TABLE `system_modules` DISABLE KEYS */;
INSERT INTO `system_modules` VALUES (1,'Core POS System','POS',NULL,'active','2026-04-01 03:49:49'),(2,'Web QR Ordering','ORDERING',NULL,'active','2026-04-01 03:49:49'),(3,'Advanced Inventory','INVENTORY',NULL,'active','2026-04-01 03:49:49');
/*!40000 ALTER TABLE `system_modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_notifications`
--

DROP TABLE IF EXISTS `system_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) DEFAULT 'system',
  `is_read` tinyint DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_notifications`
--

LOCK TABLES `system_notifications` WRITE;
/*!40000 ALTER TABLE `system_notifications` DISABLE KEYS */;
INSERT INTO `system_notifications` VALUES (1,NULL,'Ecosystem Update v2.0.4','A platform-wide update was successfully deployed. You can now manage global category definitions seamlessly.','system',1,'2026-06-12 03:39:18'),(2,1,'System Health Check','All SMTP nodes and database services are reporting stable conditions.','system',1,'2026-06-12 03:39:18'),(3,NULL,'Welcome to Coffee POS!','Explore the new dashboard analytics and manage your branches from a single workspace.','system',1,'2026-06-12 03:39:18'),(4,15,'Low Product Stock / ផលិតផលស្តុកទាប','Product \"Latte Coffee\" is running low in branch. Current stock: 5, below minimum limit of 5.','inventory',1,'2026-06-18 07:00:07');
/*!40000 ALTER TABLE `system_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sett_key` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `sett_value` text COLLATE utf8mb4_general_ci,
  `description` text COLLATE utf8mb4_general_ci,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sett_key` (`sett_key`)
) ENGINE=InnoDB AUTO_INCREMENT=1703 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES (1,'payway_merchant_id',NULL,NULL,'2026-03-08 13:39:54'),(2,'payway_api_key',NULL,NULL,'2026-03-08 13:39:54'),(3,'payway_receiver_name',NULL,NULL,'2026-03-08 13:39:54'),(4,'payway_khqr_image',NULL,NULL,'2026-03-08 13:39:54'),(1101,'landing_page','{\"heroTitle\":\"Innovating your Global Solutions.\",\"heroSubtext\":\"High-performance POS management tailored for large-scale operations. Strategic control, unified intelligence, limitless scaling.\",\"primaryCTA\":\"EXPLORE SOLUTIONS\",\"secondaryCTA\":\"WATCH DEMO\",\"promoMart\":\"SROKSRE-MART-20\",\"promoRx\":\"SROKSRE-RX-15\",\"promoResto\":\"SROKSRE-RESTO-12\",\"telegram\":\"@pongchiva\",\"phone\":\"+855 081 257 XXX\"}',NULL,'2026-04-03 13:21:04'),(1662,'telegram_support_link','https://t.me/growme_support',NULL,'2026-06-25 16:00:48'),(1663,'payment_imap_host','imap.gmail.com',NULL,'2026-06-25 16:00:48'),(1664,'payment_imap_port','993',NULL,'2026-06-25 16:00:48'),(1665,'payment_imap_user','',NULL,'2026-06-25 16:00:48'),(1666,'payment_imap_pass','',NULL,'2026-06-25 16:00:48');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `business_id` int NOT NULL,
  `branch_id` int DEFAULT NULL,
  `role_id` int DEFAULT NULL,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `image` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_general_ci DEFAULT 'active',
  `tel` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_general_ci,
  `is_super_admin` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_verified` tinyint(1) DEFAULT '0',
  `verify_token` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `pin_code` varchar(10) COLLATE utf8mb4_general_ci DEFAULT '1234',
  `reset_token` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `business_id` (`business_id`),
  KEY `branch_id` (`branch_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `users_ibfk_3` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,1,1,'Super Admin','admin@gmail.com','$2b$10$e2nn6KeWqlmuJNbNnwJhs.ML/DvoMrBjU6quM3DIdCgyYNy0L2rnK','https://res.cloudinary.com/dq2iul0rv/image/upload/v1774958973/coffee-pos/img-1774958969047-740284381.jpg','active',NULL,NULL,1,'2026-03-03 12:53:14',1,NULL,'1234',NULL,NULL),(2,1,2,1,'Pong Chiva','pongchiva257@gmail.com','$2b$10$0ps0cwYbTUWcr4Y34wEhNelPl/d9ceC4VuAOCdFeM2aYMrSOqi/yS','upload_image-1772547527529-495920070','active','0999888777','pp',1,'2026-03-03 14:15:55',1,NULL,'1234',NULL,NULL),(23,30,27,64,'ស្រីពេជ្រ ','vahea2670@gmail.com','$2b$10$u6w0WpyPF8SzCCEjMOz00..tnR41ToMQkWGyQFsaqqIuo/nhcJbi2',NULL,'active',NULL,NULL,0,'2026-06-24 01:58:27',1,'fa64a4aab147d1a683d10a2d16237e8da11179015a449f06c3fcebd06f8a1da8','1234',NULL,NULL),(29,36,33,82,'Long','vahea1510@gmail.com','$2b$10$n8x7xUq6PW4iFrMkIFavr.6gCc.5Ga98vno.eCK7nxOn3S9TiItmC',NULL,'active',NULL,NULL,0,'2026-06-25 17:22:02',0,'01821b00015180c935070d0d94a580bc8ee0720c989b8f94bd0b6bf43df1392b','1234',NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `waste`
--

DROP TABLE IF EXISTS `waste`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `waste`
--

LOCK TABLES `waste` WRITE;
/*!40000 ALTER TABLE `waste` DISABLE KEYS */;
/*!40000 ALTER TABLE `waste` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-26  9:11:57
