-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 04, 2026 at 05:34 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `coffee_saas`
--

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `is_main` enum('0','1') DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `khqr_image` varchar(255) DEFAULT NULL,
  `payment_merchant_id` varchar(255) DEFAULT NULL,
  `payment_api_key` varchar(255) DEFAULT NULL,
  `payment_receiver_name` varchar(255) DEFAULT NULL,
  `payment_provider` varchar(50) DEFAULT 'KHQR',
  `payment_api_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`id`, `business_id`, `name`, `location`, `phone`, `is_main`, `created_at`, `khqr_image`, `payment_merchant_id`, `payment_api_key`, `payment_receiver_name`, `payment_provider`, `payment_api_url`) VALUES
(1, 1, 'Main Branch', NULL, NULL, '1', '2026-03-03 12:51:40', NULL, NULL, NULL, NULL, 'KHQR', NULL),
(2, 1, 'coffee bean', 'pp\nkpl', '0977296971', '0', '2026-03-03 13:35:43', NULL, NULL, NULL, NULL, 'KHQR', NULL),
(3, 2, 'Main Branch', NULL, NULL, '1', '2026-03-04 02:50:07', NULL, NULL, NULL, NULL, 'KHQR', NULL),
(6, 5, 'Grocery & Mart', 'GV6J+Q54\r\nSt 9', '0999998888', '1', '2026-03-06 12:09:45', NULL, 'pong_chiva@bkrt', NULL, 'Koh Kong Kafe', 'KHQR', NULL),
(7, 6, 'Main Branch', NULL, NULL, '1', '2026-03-17 12:04:09', NULL, NULL, NULL, NULL, 'KHQR', NULL),
(8, 7, 'Main Branch', NULL, NULL, '1', '2026-03-25 03:31:30', NULL, NULL, NULL, NULL, 'KHQR', NULL),
(9, 9, 'Main Branch', NULL, NULL, '1', '2026-03-25 03:43:43', NULL, NULL, NULL, NULL, 'KHQR', NULL),
(11, 11, 'Main Branch', NULL, NULL, '1', '2026-03-25 03:48:10', NULL, NULL, NULL, NULL, 'KHQR', NULL),
(12, 12, 'Main Branch', NULL, NULL, '1', '2026-03-28 15:57:42', NULL, NULL, NULL, NULL, 'KHQR', NULL),
(13, 13, 'Main Branch', NULL, NULL, '1', '2026-03-28 16:49:31', NULL, NULL, NULL, NULL, 'KHQR', NULL),
(14, 14, 'Main Branch', NULL, NULL, '1', '2026-03-31 14:44:57', NULL, NULL, NULL, NULL, 'KHQR', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `branch_products`
--

CREATE TABLE `branch_products` (
  `id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `price` double DEFAULT 0,
  `cost_price` double DEFAULT 0,
  `stock_qty` int(11) DEFAULT 0,
  `is_available` tinyint(1) DEFAULT 1,
  `min_stock_alert` int(11) DEFAULT 5
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `branch_products`
--

INSERT INTO `branch_products` (`id`, `branch_id`, `product_id`, `price`, `cost_price`, `stock_qty`, `is_available`, `min_stock_alert`) VALUES
(108, 6, 105, 2.5, 1.25, 100, 1, 5),
(109, 6, 106, 2.5, 1.25, 100, 1, 5),
(110, 6, 107, 2.5, 1.25, 100, 1, 5),
(111, 6, 108, 2.5, 1.25, 100, 1, 5),
(112, 6, 109, 3, 1.5, 100, 1, 5),
(113, 6, 110, 2, 1, 100, 1, 5),
(114, 6, 111, 2.5, 1.25, 100, 1, 5),
(115, 6, 112, 3, 1.5, 100, 1, 5),
(116, 6, 113, 2.5, 1.25, 100, 1, 5),
(117, 6, 114, 2.5, 1.25, 100, 1, 5),
(118, 6, 115, 1.5, 0.75, 100, 1, 5),
(119, 6, 116, 1.5, 0.75, 100, 1, 5),
(120, 6, 117, 2, 1, 100, 1, 5),
(121, 6, 118, 3.5, 1.75, 100, 1, 5),
(122, 6, 119, 2.5, 1.25, 100, 1, 5),
(123, 6, 120, 4.5, 2.25, 100, 1, 5),
(124, 6, 121, 1, 0.5, 100, 1, 5),
(125, 6, 122, 1.5, 0.75, 100, 1, 5),
(126, 6, 123, 5, 2.5, 100, 1, 5),
(127, 6, 124, 4, 2, 100, 1, 5),
(128, 6, 125, 3.5, 1.75, 100, 1, 5),
(129, 6, 126, 4, 2, 100, 1, 5),
(130, 6, 127, 3.5, 1.75, 100, 1, 5),
(131, 6, 128, 2.5, 1.25, 100, 1, 5),
(132, 6, 129, 3, 0, 100, 1, 5),
(133, 12, 130, 1.5, 0, 10, 1, 5),
(134, 12, 131, 1.5, 0, 10, 1, 5),
(135, 12, 132, 2.5, 0, 100, 1, 5),
(136, 12, 133, 3.5, 0, 100, 1, 5),
(137, 12, 134, 4, 0, 100, 1, 5),
(138, 12, 135, 12, 0, 100, 1, 5),
(139, 12, 136, 15, 0, 100, 1, 5),
(140, 12, 137, 18.5, 0, 100, 1, 5),
(141, 12, 138, 22, 0, 100, 1, 5),
(142, 12, 139, 14.5, 0, 100, 1, 5),
(143, 12, 140, 5.5, 0, 100, 1, 5),
(144, 12, 141, 9, 0, 100, 1, 5),
(145, 12, 142, 20, 0, 100, 1, 5),
(146, 12, 143, 19.5, 0, 100, 1, 5),
(147, 12, 144, 3.5, 0, 100, 1, 5),
(148, 14, 145, 12.5, 0, 10, 1, 5),
(149, 14, 146, 8, 0, 10, 1, 5),
(150, 14, 147, 6.5, 0, 10, 1, 5),
(151, 14, 148, 18, 0, 10, 1, 5),
(152, 14, 149, 2.5, 0, 10, 1, 5),
(153, 1, 150, 2.5, 0.8, 100, 1, 5),
(154, 1, 151, 2.25, 0.5, 100, 1, 5),
(155, 1, 152, 3.5, 1.5, 100, 1, 5),
(156, 1, 153, 3.2, 1.2, 100, 1, 5),
(157, 1, 154, 6.5, 5.2, 100, 1, 5),
(158, 1, 155, 0.75, 0.55, 100, 1, 5),
(159, 1, 156, 2.2, 1.65, 100, 1, 5),
(160, 1, 157, 0.45, 0.35, 100, 1, 5),
(161, 13, 158, 2.5, 0, 100, 1, 5),
(162, 13, 159, 2.25, 0, 100, 1, 5),
(163, 13, 160, 3.5, 1.5, 100, 1, 5),
(164, 13, 161, 3.2, 1.2, 100, 1, 5),
(165, 13, 162, 6.5, 5.2, 100, 1, 5),
(166, 13, 163, 0.75, 0, 100, 1, 5),
(167, 13, 164, 2.2, 0, 100, 1, 5),
(168, 13, 165, 0.45, 0, 100, 1, 5);

-- --------------------------------------------------------

--
-- Table structure for table `branch_tables`
--

CREATE TABLE `branch_tables` (
  `id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `table_name` varchar(50) NOT NULL,
  `qr_code_url` varchar(255) DEFAULT NULL,
  `status` enum('active','occupied','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `branch_tables`
--

INSERT INTO `branch_tables` (`id`, `branch_id`, `business_id`, `table_name`, `qr_code_url`, `status`, `created_at`) VALUES
(1, 6, 5, '1', 'http://localhost:5173/scan?biz=5&branch=6&table=1', 'active', '2026-03-07 03:01:19'),
(2, 7, 6, '1', 'http://localhost:5173/scan?biz=6&branch=7&table=1', 'active', '2026-03-18 03:32:29'),
(3, 14, 14, '1', 'http://localhost:5173/scan?biz=14&branch=14&table=1', 'active', '2026-04-02 08:00:00'),
(4, 14, 14, '2', 'http://localhost:5173/scan?biz=14&branch=14&table=2', 'active', '2026-04-02 08:32:21'),
(5, 14, 14, '3', 'http://localhost:5173/scan?biz=14&branch=14&table=3', 'active', '2026-04-02 08:32:26'),
(6, 14, 14, '4', 'http://localhost:5173/scan?biz=14&branch=14&table=4', 'active', '2026-04-02 08:32:29'),
(7, 13, 13, '1', 'http://localhost:5173/scan?biz=13&branch=13&table=1', 'active', '2026-04-02 14:38:15'),
(8, 13, 13, '2', 'http://localhost:5173/scan?biz=13&branch=13&table=2', 'active', '2026-04-02 16:25:02');

-- --------------------------------------------------------

--
-- Table structure for table `businesses`
--

CREATE TABLE `businesses` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `owner_name` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `plan_type` enum('basic','standard','premium') DEFAULT 'basic',
  `package_id` int(11) DEFAULT NULL,
  `active_modules` text DEFAULT 'POS',
  `status` enum('active','suspended') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `plan_id` int(11) DEFAULT 1,
  `tax_percent` decimal(5,2) DEFAULT 0.00,
  `service_charge` decimal(5,2) DEFAULT 0.00,
  `kh_exchange_rate` int(11) DEFAULT 4100,
  `address` text DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `currency_symbol` varchar(10) DEFAULT '$',
  `telegram_link` varchar(255) DEFAULT NULL,
  `facebook_link` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `businesses`
--

INSERT INTO `businesses` (`id`, `name`, `owner_name`, `phone`, `email`, `logo`, `plan_type`, `package_id`, `active_modules`, `status`, `created_at`, `plan_id`, `tax_percent`, `service_charge`, `kh_exchange_rate`, `address`, `website`, `currency_symbol`, `telegram_link`, `facebook_link`) VALUES
(1, 'System Default', 'Admin', NULL, NULL, NULL, 'standard', NULL, 'POS', 'active', '2026-03-03 12:51:40', 2, 0.00, 0.00, 4100, NULL, NULL, '$', NULL, NULL),
(2, 'It sruk srae', 'Pong Chiva', '0977296971', 'senlin@gmail.com', NULL, 'standard', NULL, 'POS', 'active', '2026-03-04 02:50:07', 3, 0.00, 0.00, 4100, NULL, NULL, '$', NULL, NULL),
(5, 'Mart Khmer', 'Pong Chiva', '0977296971', 'pongchiva@gmail.com', 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775054633/coffee-pos/img-1775054631053-330027316.png', 'standard', 3, 'POS', 'active', '2026-03-06 12:09:45', 1, 0.00, 0.00, 4100, NULL, NULL, '$', NULL, NULL),
(6, 'SunSet Coffee', 'khengHak', '09775788', 'khenghak@gmail.com', 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1773749092/coffee-pos/img-1773749090392-981874366.png', 'standard', NULL, 'POS', 'active', '2026-03-17 12:04:09', 3, 0.00, 0.00, 4000, 'GV6J+Q54\r\nSt 9', NULL, '$', NULL, NULL),
(7, 'blue kafe', 'Phearun', '0977296971', 'Phearun@gmail.com', NULL, 'standard', NULL, 'POS', 'active', '2026-03-25 03:31:30', 1, 0.00, 0.00, 4100, NULL, NULL, '$', NULL, NULL),
(9, 'Black kafe', 'pheakdey', '0977296971', 'pheakdey@gmail.com', NULL, 'standard', NULL, 'POS', 'active', '2026-03-25 03:43:43', 1, 0.00, 0.00, 4100, NULL, NULL, '$', NULL, NULL),
(11, 'Pink kafe', 'longda', '0977296971', 'longda@gmail.com', NULL, 'standard', NULL, 'POS', 'active', '2026-03-25 03:48:10', 1, 0.00, 0.00, 4100, NULL, NULL, '$', NULL, NULL),
(12, 'Pharmacy & Medical៖', 'KruPet', '099988777', 'testsystem@gmail.com', NULL, 'standard', 4, 'POS', 'active', '2026-03-28 15:57:42', 1, 0.00, 0.00, 4000, 'GV6J+Q54\r\nSt 9', NULL, '$', NULL, NULL),
(13, 'Coffee & Cafe', 'ស្រេង ម៉េងស្រ៊ុន', '09776565', 'srengmengsrun@gmail.com', NULL, 'standard', 1, 'POS,Ordering,Inventory', 'active', '2026-03-28 16:49:31', 2, 0.00, 0.00, 4100, NULL, NULL, '$', NULL, NULL),
(14, 'Restaurant & Dining', 'Fong Restaurant', '0999998888', 'tong@gmail.com', NULL, '', 2, 'POS,ORDERING,INVENTORY', 'active', '2026-03-31 14:44:57', 3, 0.00, 0.00, 4100, NULL, NULL, '$', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `business_categories`
--

CREATE TABLE `business_categories` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `is_active` tinyint(4) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `business_categories`
--

INSERT INTO `business_categories` (`id`, `business_id`, `category_id`, `is_active`) VALUES
(1, 5, 2, 0),
(2, 5, 15, 0),
(7, 5, 18, 0),
(20, 6, 2, 1),
(21, 6, 15, 1),
(22, 6, 18, 1),
(23, 11, 2, 1),
(24, 11, 15, 1),
(25, 11, 18, 1),
(26, 9, 2, 1),
(27, 9, 15, 1),
(28, 9, 18, 1),
(29, 7, 2, 1),
(30, 7, 15, 1),
(31, 7, 18, 1),
(32, 2, 2, 1),
(33, 2, 15, 1),
(34, 2, 18, 1),
(35, 13, 2, 1),
(36, 13, 15, 0),
(37, 13, 18, 0),
(38, 12, 2, 0),
(39, 12, 15, 0),
(40, 12, 18, 0),
(41, 14, 2, 0),
(42, 14, 15, 0),
(43, 14, 18, 0),
(72, 12, 24, 1),
(77, 12, 31, 1),
(78, 12, 32, 1),
(79, 12, 33, 1),
(80, 12, 34, 1),
(81, 12, 35, 1),
(85, 14, 24, 0),
(86, 14, 31, 0),
(87, 14, 32, 0),
(88, 14, 33, 0),
(89, 14, 34, 0),
(90, 14, 35, 0),
(91, 14, 36, 1),
(92, 14, 37, 1),
(93, 14, 38, 1),
(94, 14, 39, 1),
(95, 14, 40, 1),
(96, 14, 41, 1),
(97, 14, 42, 1),
(101, 5, 24, 0),
(102, 5, 31, 0),
(103, 5, 32, 0),
(104, 5, 33, 0),
(105, 5, 34, 0),
(106, 5, 35, 0),
(107, 5, 36, 0),
(108, 5, 37, 0),
(109, 5, 38, 0),
(110, 5, 39, 0),
(111, 5, 40, 0),
(112, 5, 41, 0),
(113, 5, 42, 0),
(114, 5, 43, 1),
(115, 5, 44, 1),
(116, 5, 45, 1),
(117, 5, 46, 1),
(118, 5, 47, 1),
(119, 5, 48, 1),
(120, 5, 49, 1),
(121, 5, 50, 1),
(122, 5, 51, 1),
(123, 5, 52, 1),
(127, 13, 24, 0),
(128, 13, 31, 0),
(129, 13, 32, 0),
(130, 13, 33, 0),
(131, 13, 34, 0),
(132, 13, 35, 0),
(133, 13, 36, 0),
(134, 13, 37, 0),
(135, 13, 38, 0),
(136, 13, 39, 0),
(137, 13, 40, 0),
(138, 13, 41, 0),
(139, 13, 42, 0),
(140, 13, 43, 0),
(141, 13, 44, 0),
(142, 13, 45, 0),
(143, 13, 46, 0),
(144, 13, 47, 0),
(145, 13, 48, 0),
(146, 13, 49, 0),
(147, 13, 50, 0),
(148, 13, 51, 0),
(149, 13, 52, 0),
(150, 13, 53, 1),
(151, 13, 54, 1),
(152, 13, 55, 1),
(153, 13, 56, 1),
(154, 13, 57, 1),
(155, 13, 58, 1),
(156, 13, 59, 1),
(157, 13, 60, 1),
(158, 13, 61, 1),
(159, 13, 62, 1);

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `default_moods` text DEFAULT NULL,
  `default_sizes` text DEFAULT NULL,
  `default_addons` text DEFAULT NULL,
  `industry_code` varchar(255) DEFAULT 'coffee_cafe'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `business_id`, `name`, `image`, `created_at`, `default_moods`, `default_sizes`, `default_addons`, `industry_code`) VALUES
(2, 1, 'Coffee', 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1774963386/coffee-pos/img-1774963384742-162086675.avif', '2026-03-04 16:12:18', '[\"hot\",\"iced\",\"frappe\"]', '[{\"label\":\"Small (S)\",\"value\":\"S\"},{\"label\":\"Medium (M)\",\"value\":\"M\"},{\"label\":\"Large (L)\",\"value\":\"L\"}]', '[{\"label\":\"Cream\",\"value\":\"Cream\"}]', 'coffee_cafe'),
(3, 2, 'Coffee', NULL, '2026-03-04 16:19:03', '[\"hot\",\"iced\",\"frappe\"]', '[{\"label\":\"Small (S)\",\"value\":\"S\"},{\"label\":\"Medium (M)\",\"value\":\"M\"},{\"label\":\"Large (L)\",\"value\":\"L\"}]', '[{\"label\":\"Cream\",\"value\":\"Cream\"}]', 'coffee_cafe'),
(4, 2, 'Juice', NULL, '2026-03-04 16:19:03', NULL, NULL, NULL, 'coffee_cafe'),
(5, 2, 'Milk', NULL, '2026-03-04 16:19:03', NULL, NULL, NULL, 'coffee_cafe'),
(6, 2, 'Snack', NULL, '2026-03-04 16:19:03', NULL, NULL, NULL, 'coffee_cafe'),
(7, 2, 'Rice', NULL, '2026-03-04 16:19:03', NULL, NULL, NULL, 'coffee_cafe'),
(8, 2, 'Dessert', NULL, '2026-03-04 16:19:03', NULL, NULL, NULL, 'coffee_cafe'),
(15, 1, 'Example-Demo-Coffee', 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1774963691/coffee-pos/img-1774963688405-488280105.jpg', '2026-03-17 09:49:02', '[\"hot\",\"iced\",\"frappe\"]', '[{\"label\":\"Small (S)\",\"value\":\"S\"},{\"label\":\"Medium (M)\",\"value\":\"M\"},{\"label\":\"Large (L)\",\"value\":\"L\"}]', '[{\"label\":\"Extra Shot\",\"value\":\"Extra Shot\"},{\"label\":\"Milk Foam\",\"value\":\"Milk Foam\"},{\"label\":\"Honey\",\"value\":\"Honey\"}]', 'coffee_cafe'),
(16, 6, 'Coffee', NULL, '2026-03-17 12:09:56', '[\"hot\",\"iced\",\"frappe\"]', '[{\"label\":\"Small (S)\",\"value\":\"S\"},{\"label\":\"Medium (M)\",\"value\":\"M\"},{\"label\":\"Large (L)\",\"value\":\"L\"}]', '[{\"label\":\"Extra Shot\",\"value\":\"Extra Shot\"},{\"label\":\"Milk Foam\",\"value\":\"Milk Foam\"},{\"label\":\"Honey\",\"value\":\"Honey\"}]', 'coffee_cafe'),
(17, 11, 'coffee', NULL, '2026-03-25 03:53:14', '[\"hot\",\"iced\",\"frappe\"]', '[{\"label\":\"Small (S)\",\"value\":\"S\"},{\"label\":\"Medium (M)\",\"value\":\"M\"},{\"label\":\"Large (L)\",\"value\":\"L\"}]', '[{\"label\":\"Extra Shot\",\"value\":\"Extra Shot\"},{\"label\":\"Milk Foam\",\"value\":\"Milk Foam\"},{\"label\":\"Honey\",\"value\":\"Honey\"}]', 'coffee_cafe'),
(18, 1, 'Drink', 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1774963490/coffee-pos/img-1774963487171-713940886.jpg', '2026-03-31 13:24:50', NULL, NULL, NULL, 'coffee_cafe'),
(19, 5, 'Juice', NULL, '2026-04-01 16:21:36', NULL, NULL, NULL, 'coffee_cafe'),
(20, 5, 'Milk', NULL, '2026-04-01 16:21:36', NULL, NULL, NULL, 'coffee_cafe'),
(21, 5, 'Snack', NULL, '2026-04-01 16:21:36', NULL, NULL, NULL, 'coffee_cafe'),
(22, 5, 'Rice', NULL, '2026-04-01 16:21:36', NULL, NULL, NULL, 'coffee_cafe'),
(23, 5, 'Dessert', NULL, '2026-04-01 16:21:36', NULL, NULL, NULL, 'coffee_cafe'),
(24, 1, 'General Medicine / ថ្នាំទូទៅ', 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775064344/coffee-pos/img-1775064341496-112733637.jpg', '2026-04-01 17:24:47', 'Morning, Afternoon, Evening, Night, Before Meal, After Meal', 'Box, Strip, Pill', 'Keep in cool place, Avoid alcohol, Shake well\r\n', 'pharmacy'),
(31, 1, 'ថ្នាំផ្សះ (Antibiotics)', 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775093901/coffee-pos/img-1775093899741-852292804.jpg', '2026-04-02 01:38:22', 'លេបឱ្យអស់តាមវេជ្ជបញ្ជា (Finish course), រៀងរាល់ ៨ ម៉ោង (Every 8 hours), លេបមុនបាយ (Before Meal)', 'ប្រអប់ (Box), បន្ទះ (Strip), ដប (Bottle)', 'អាចមានប្រតិកម្មថ្នាំ (May cause allergy), កុំប្រើជាមួយគ្រឿងស្រវឹង (No alcohol)', 'pharmacy'),
(32, 1, 'Vitamins & Supplements / វីតាមីន និងអាហារបំប៉ន', NULL, '2026-04-02 01:55:54', 'Morning, After Meal, Take with water', 'Bottle, Jar, Pouch', 'Not for treatment, Store at room temp', 'pharmacy'),
(33, 1, 'Skincare & Personal Care / ថែរក្សាស្បែក និងរាងកាយ', NULL, '2026-04-02 01:55:54', 'After Wash, Morning/Evening, External use', 'Tube, Bottle, Sachet', 'Avoid eyes, Stop if irritation', 'pharmacy'),
(34, 1, 'Medical Equipment / ឧបករណ៍វេជ្ជសាស្ត្រ', NULL, '2026-04-02 01:55:54', 'Single use, Emergency, Sterile', 'Piece, Set, Pack', 'Professional only, Discard after use', 'pharmacy'),
(35, 1, 'Baby & Mom Care / ផលិតផលសម្រាប់ម្តាយ និងទារក', NULL, '2026-04-02 01:58:27', 'Daily use, Gentle, Morning/Night', 'Bottle, Pack, Piece', 'For sensitive skin, Keep away from heat', 'mart'),
(36, 1, 'Seafood / គ្រឿងសមុទ្រ', NULL, '2026-04-02 04:11:27', NULL, '[{\"label\":\"Small\",\"value\":\"small\",\"price\":0},{\"label\":\"Large\",\"value\":\"large\",\"price\":5},{\"label\":\"1kg\",\"value\":\"1kg\",\"price\":15}]', NULL, 'restaurant'),
(37, 1, 'Soup / សម្ល', NULL, '2026-04-02 04:11:27', NULL, '[{\"label\":\"Small Bowl\",\"value\":\"small\",\"price\":0},{\"label\":\"Large Bowl\",\"value\":\"large\",\"price\":3}]', NULL, 'restaurant'),
(38, 1, 'Stir-Fry / ម្ហូបឆា', NULL, '2026-04-02 04:11:27', NULL, '[{\"label\":\"Normal\",\"value\":\"normal\",\"price\":0},{\"label\":\"Large\",\"value\":\"large\",\"price\":2}]', NULL, 'restaurant'),
(39, 1, 'Roasted & Deep-fried / ម្ហូបបំពង & អាំង', NULL, '2026-04-02 04:11:28', NULL, '[{\"label\":\"Half\",\"value\":\"half\",\"price\":0},{\"label\":\"Full\",\"value\":\"full\",\"price\":8}]', NULL, 'restaurant'),
(40, 1, 'Salads & Spicy Mixed / ញាំ & បុក', NULL, '2026-04-02 04:11:28', '[{\"label\":\"Non-Spicy\",\"value\":\"no_spicy\"},{\"label\":\"Mild\",\"value\":\"mild\"},{\"label\":\"Spicy\",\"value\":\"spicy\"},{\"label\":\"Extra Spicy\",\"value\":\"extra_spicy\"}]', '[{\"label\":\"Plate\",\"value\":\"plate\",\"price\":0}]', NULL, 'restaurant'),
(41, 1, 'Dessert / បង្អែម', NULL, '2026-04-02 04:11:28', NULL, '[{\"label\":\"Small\",\"value\":\"small\",\"price\":0},{\"label\":\"Large\",\"value\":\"large\",\"price\":1}]', NULL, 'restaurant'),
(42, 1, 'Drinks / ភេសជ្ជៈ', NULL, '2026-04-02 04:11:28', '[{\"label\":\"Normal Ice\",\"value\":\"normal_ice\"},{\"label\":\"Less Ice\",\"value\":\"less_ice\"},{\"label\":\"No Ice\",\"value\":\"no_ice\"}]', '[{\"label\":\"Normal\",\"value\":\"normal\",\"price\":0},{\"label\":\"Large\",\"value\":\"large\",\"price\":0.5}]', NULL, 'restaurant'),
(43, 1, 'Grocery', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:07:27', NULL, '[{\"label\":\"1kg\",\"value\":\"1kg\"},{\"label\":\"5kg\",\"value\":\"5kg\"},{\"label\":\"Bulk\",\"value\":\"Bulk\"}]', NULL, 'mart'),
(44, 1, 'Beverages', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:07:27', '[{\"label\":\"Chilled\",\"value\":\"Chilled\"},{\"label\":\"Regular\",\"value\":\"Regular\"}]', '[{\"label\":\"Can (330ml)\",\"value\":\"Can\"},{\"label\":\"Bottle (500ml)\",\"value\":\"Bottle\"},{\"label\":\"Large (1.5L)\",\"value\":\"Large\"}]', NULL, 'mart'),
(45, 1, 'Snacks & Biscuits', 'https://images.unsplash.com/photo-1599490659213-e2b9527bb087?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:07:27', NULL, '[{\"label\":\"Standard\",\"value\":\"Standard\"},{\"label\":\"Sharing Pack\",\"value\":\"Sharing\"}]', NULL, 'mart'),
(46, 1, 'Canned Goods', 'https://images.unsplash.com/photo-1563202970-13f649ba7c8f?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:07:27', NULL, '[{\"label\":\"Small Can\",\"value\":\"Small\"},{\"label\":\"Multipack\",\"value\":\"Multi\"}]', NULL, 'mart'),
(47, 1, 'Instant Noodles', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:07:27', NULL, '[{\"label\":\"Single Pack\",\"value\":\"Single\"},{\"label\":\"Bowl/Cup\",\"value\":\"Cup\"},{\"label\":\"Pack of 5\",\"value\":\"Pack5\"}]', NULL, 'mart'),
(48, 1, 'Dairy & Eggs', 'https://images.unsplash.com/photo-1550583724-1255d1426478?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:07:27', NULL, '[{\"label\":\"Single\",\"value\":\"Single\"},{\"label\":\"Dozen\",\"value\":\"Dozen\"},{\"label\":\"Pack\",\"value\":\"Pack\"}]', NULL, 'mart'),
(49, 1, 'Frozen Foods', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:07:27', NULL, '[{\"label\":\"Small\",\"value\":\"Small\"},{\"label\":\"Medium\",\"value\":\"Medium\"},{\"label\":\"Large\",\"value\":\"Large\"}]', NULL, 'mart'),
(50, 1, 'Household Supplies', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:07:27', NULL, '[{\"label\":\"Standard\",\"value\":\"Standard\"},{\"label\":\"Value Pack\",\"value\":\"Value\"}]', NULL, 'mart'),
(51, 1, 'Personal Care', 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:07:27', NULL, '[{\"label\":\"Travel Size\",\"value\":\"Travel\"},{\"label\":\"Standard\",\"value\":\"Standard\"},{\"label\":\"Family Pack\",\"value\":\"Family\"}]', NULL, 'mart'),
(52, 1, 'Bakery', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:07:27', NULL, '[{\"label\":\"Slice\",\"value\":\"Slice\"},{\"label\":\"Whole\",\"value\":\"Whole\"},{\"label\":\"Half\",\"value\":\"Half\"}]', NULL, 'mart'),
(53, 1, 'Hot Coffee', 'https://images.unsplash.com/photo-1541167760496-162955ed2a96?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:19:19', '[{\"label\":\"Regular\",\"value\":\"Regular\"}]', '[{\"label\":\"S\",\"value\":\"S\"},{\"label\":\"M\",\"value\":\"M\"}]', '[{\"label\":\"Sugar\",\"value\":\"Sugar\"},{\"label\":\"Honey\",\"value\":\"Honey\"}]', 'coffee_cafe'),
(54, 1, 'Iced Coffee', 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:19:19', '[{\"label\":\"No Sugar\",\"value\":\"No Sugar\"},{\"label\":\"50% Sugar\",\"value\":\"50% Sugar\"},{\"label\":\"100% Sugar\",\"value\":\"100% Sugar\"}]', '[{\"label\":\"M\",\"value\":\"M\"},{\"label\":\"L\",\"value\":\"L\"}]', '[{\"label\":\"Extra Shot\",\"value\":\"Extra Shot\"},{\"label\":\"Caramel\",\"value\":\"Caramel\"}]', 'coffee_cafe'),
(55, 1, 'Frappe & Blended', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:19:19', NULL, '[{\"label\":\"M\",\"value\":\"M\"},{\"label\":\"L\",\"value\":\"L\"}]', '[{\"label\":\"Whipped Cream\",\"value\":\"Whipped Cream\"},{\"label\":\"Chocolate Chip\",\"value\":\"Chocolate Chip\"}]', 'coffee_cafe'),
(56, 1, 'Organic Tea', 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:19:19', '[{\"label\":\"Hot\",\"value\":\"Hot\"},{\"label\":\"Iced\",\"value\":\"Iced\"}]', '[{\"label\":\"Pot\",\"value\":\"Pot\"},{\"label\":\"Cup\",\"value\":\"Cup\"}]', NULL, 'coffee_cafe'),
(57, 1, 'Fruit Soda & Refreshers', 'https://images.unsplash.com/photo-1513558161293-cdaf7659a18b?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:19:19', NULL, '[{\"label\":\"Regular\",\"value\":\"Regular\"},{\"label\":\"Large\",\"value\":\"Large\"}]', '[{\"label\":\"Fresh Fruit\",\"value\":\"Fresh Fruit\"}]', 'coffee_cafe'),
(58, 1, 'Milk-Based Drinks', 'https://images.unsplash.com/photo-1553909489-eb96057ff746?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:19:19', '[{\"label\":\"Hot\",\"value\":\"Hot\"},{\"label\":\"Iced\",\"value\":\"Iced\"},{\"label\":\"Blended\",\"value\":\"Blended\"}]', '[{\"label\":\"S\",\"value\":\"S\"},{\"label\":\"M\",\"value\":\"M\"},{\"label\":\"L\",\"value\":\"L\"}]', '[{\"label\":\"Milk Foam\",\"value\":\"Milk Foam\"}]', 'coffee_cafe'),
(59, 1, 'Pastries & Bread', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:19:19', '[{\"label\":\"Warm up\",\"value\":\"Warm up\"},{\"label\":\"Regular\",\"value\":\"Regular\"}]', NULL, '[{\"label\":\"Butter\",\"value\":\"Butter\"},{\"label\":\"Jam\",\"value\":\"Jam\"}]', 'coffee_cafe'),
(60, 1, 'Signature Specials', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:19:19', NULL, '[{\"label\":\"Regular\",\"value\":\"Regular\"}]', NULL, 'coffee_cafe'),
(61, 1, 'Cakes & Desserts', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:19:19', NULL, '[{\"label\":\"Slice\",\"value\":\"Slice\"},{\"label\":\"Whole\",\"value\":\"Whole\"}]', NULL, 'coffee_cafe'),
(62, 1, 'Healthy Juices', 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=300&q=80', '2026-04-02 14:19:19', NULL, '[{\"label\":\"Regular\",\"value\":\"Regular\"}]', NULL, 'coffee_cafe');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee`
--

CREATE TABLE `employee` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `gender` tinyint(1) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT NULL,
  `tel` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `status` enum('active','resigned','suspended') DEFAULT 'active',
  `create_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expense`
--

CREATE TABLE `expense` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `expense_type_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT 'Cash',
  `description` text DEFAULT NULL,
  `expense_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expense_type`
--

CREATE TABLE `expense_type` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `favorites`
--

CREATE TABLE `favorites` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `favorites`
--

INSERT INTO `favorites` (`id`, `user_id`, `product_id`, `created_at`) VALUES
(1, 7, 46, '2026-03-18 09:28:01');

-- --------------------------------------------------------

--
-- Table structure for table `modular_packages`
--

CREATE TABLE `modular_packages` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `ui_layout` varchar(50) DEFAULT 'coffee',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `industry_code` varchar(255) DEFAULT 'coffee_cafe'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `modular_packages`
--

INSERT INTO `modular_packages` (`id`, `name`, `code`, `description`, `icon`, `ui_layout`, `status`, `created_at`, `industry_code`) VALUES
(1, 'Coffee & Cafe', 'coffee_cafe', 'Standard setup for coffee shops and cafes', 'CoffeeOutlined', 'coffee', 'active', '2026-04-01 02:31:12', 'coffee_cafe'),
(2, 'Restaurant & Dining', 'restaurant', 'Full dining experience with table management', NULL, 'coffee', 'active', '2026-04-01 02:31:12', 'restaurant'),
(3, 'Grocery & Mart', 'mart', 'Fast retail and inventory focused', NULL, 'retail', 'active', '2026-04-01 02:31:12', 'retail'),
(4, 'Pharmacy & Medical', '', NULL, NULL, 'pharmacy', 'active', '2026-04-01 16:44:29', 'pharmacy');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `shift_id` int(11) DEFAULT NULL,
  `customer_name` varchar(100) DEFAULT NULL,
  `table_no` varchar(20) DEFAULT NULL,
  `sub_total` decimal(10,2) NOT NULL,
  `tax` decimal(10,2) DEFAULT 0.00,
  `discount` decimal(10,2) DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(100) DEFAULT 'cash',
  `order_type` varchar(100) DEFAULT 'dine_in',
  `status` varchar(100) DEFAULT 'ordered',
  `kitchen_status` varchar(20) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `business_id`, `branch_id`, `user_id`, `shift_id`, `customer_name`, `table_no`, `sub_total`, `tax`, `discount`, `total_amount`, `payment_method`, `order_type`, `status`, `kitchen_status`, `created_at`) VALUES
(1, 5, 6, 6, NULL, '', '', 5.00, 0.00, 0.00, 5.00, '', 'dine_in', 'completed', 'pending', '2026-03-06 16:18:28'),
(2, 5, 6, 6, NULL, '', '', 5.00, 0.00, 0.00, 5.00, '', 'dine_in', 'completed', 'pending', '2026-03-06 16:24:27'),
(3, 5, 6, 6, NULL, '', '', 5.00, 0.00, 0.00, 5.00, '', 'dine_in', 'completed', 'pending', '2026-03-06 16:29:21'),
(4, 5, 6, 6, NULL, '', '', 2.50, 0.00, 0.00, 2.50, '', 'dine_in', 'completed', 'pending', '2026-03-06 17:24:21'),
(5, 1, 1, 1, NULL, '', '', 5.00, 0.00, 0.00, 5.00, 'Wing', 'dine_in', 'completed', 'pending', '2026-03-17 09:46:45'),
(6, 1, 1, 1, NULL, '', '', 2.50, 0.00, 0.00, 2.50, 'ABA', 'dine_in', 'completed', 'pending', '2026-03-17 09:49:30'),
(7, 1, 1, 1, NULL, '', '', 1.50, 0.00, 0.00, 1.42, 'Cash', 'dine_in', 'completed', 'pending', '2026-03-17 09:50:51'),
(8, 1, 1, 1, NULL, '', '', 1.50, 0.00, 0.00, 1.42, 'ABA', 'dine_in', 'completed', 'pending', '2026-03-17 09:56:48'),
(9, 6, 7, 7, NULL, '', '', 1.50, 0.00, 0.00, 1.50, 'ABA', 'dine_in', 'completed', 'pending', '2026-03-17 12:12:39'),
(10, 6, 7, 7, NULL, '', '', 1.50, 0.00, 0.00, 1.50, 'ABA', 'dine_in', 'completed', 'pending', '2026-03-17 12:13:29'),
(11, 6, 7, 7, NULL, '', '', 5.70, 0.00, 0.00, 5.70, 'ABA', 'dine_in', 'completed', 'pending', '2026-03-17 12:39:30'),
(12, 6, 7, 7, NULL, '', '', 3.50, 0.00, 0.00, 3.50, 'ABA', 'dine_in', 'completed', 'pending', '2026-03-17 12:52:28'),
(13, 6, 7, 7, NULL, '', '', 3.50, 0.00, 0.00, 3.50, 'ABA', 'dine_in', 'completed', 'pending', '2026-03-17 13:04:20'),
(14, 6, 7, 7, NULL, '', '', 1.00, 0.00, 0.00, 1.00, 'ABA', 'dine_in', 'completed', 'pending', '2026-03-17 13:05:21'),
(15, 6, 7, 7, NULL, '', '', 1.00, 0.00, 0.00, 1.00, 'ABA', 'dine_in', 'completed', 'pending', '2026-03-17 13:33:34'),
(16, 6, 7, 8, NULL, '', '', 1.00, 0.00, 0.00, 1.00, 'ABA', 'dine_in', 'completed', 'pending', '2026-03-17 13:55:04'),
(17, 6, 7, 8, NULL, '', '', 1.00, 0.00, 0.00, 1.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-03-17 13:58:19'),
(18, 6, 7, 7, NULL, '', '', 1.00, 0.00, 0.00, 1.00, 'ABA', 'dine_in', 'completed', 'pending', '2026-03-18 01:23:49'),
(19, 6, 7, 8, NULL, '', '', 1.00, 0.00, 0.00, 1.00, 'ABA', 'dine_in', 'completed', 'pending', '2026-03-18 02:04:17'),
(20, 6, 7, 8, NULL, '', '', 1.00, 0.00, 0.00, 1.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-03-18 02:07:44'),
(21, 6, 7, 7, NULL, '', '', 1.50, 0.00, 0.00, 1.50, 'Cash', 'dine_in', 'completed', 'pending', '2026-03-18 02:23:33'),
(22, 6, 7, 7, NULL, 'Guest', '1', 1.50, 0.00, 0.00, 1.50, 'Cash', 'dine_in', 'completed', 'pending', '2026-03-18 08:23:37'),
(23, 6, 7, 7, NULL, 'Guest', '1', 1.25, 0.00, 0.00, 1.25, 'Cash', 'dine_in', 'completed', 'pending', '2026-03-18 08:24:07'),
(24, 6, 7, 7, NULL, 'Guest', '1', 2.50, 0.00, 0.00, 2.50, 'Cash', 'dine_in', 'completed', 'pending', '2026-03-18 09:27:17'),
(25, 1, 1, 1, NULL, '', '', 1.50, 0.00, 0.00, 1.41, 'ABA', 'dine_in', 'completed', 'pending', '2026-03-24 12:23:08'),
(26, 1, 1, 1, NULL, '', '', 1.50, 0.00, 0.00, 1.41, 'ABA', 'dine_in', 'completed', 'pending', '2026-03-24 12:24:27'),
(27, 1, 1, 1, NULL, '', '', 1.50, 0.00, 0.00, 1.41, 'ABA', 'dine_in', 'completed', 'pending', '2026-03-24 12:39:47'),
(28, 1, 1, 1, NULL, '', '', 0.01, 0.00, 0.00, 0.01, 'ABA', 'dine_in', 'completed', 'pending', '2026-03-24 12:41:33'),
(29, 1, 1, 1, NULL, '', '', 1.50, 0.00, 0.00, 1.41, 'ABA', 'dine_in', 'completed', 'pending', '2026-03-24 12:44:46'),
(30, 1, 1, 1, NULL, '', '', 0.01, 0.00, 0.00, 0.01, 'ABA', 'dine_in', 'completed', 'pending', '2026-03-24 12:44:56'),
(31, 1, 1, 1, NULL, '', '', 0.01, 0.00, 0.00, 0.01, 'Wing', 'dine_in', 'completed', 'pending', '2026-03-24 12:45:38'),
(32, 5, 6, 6, NULL, '', '', 3.00, 0.00, 0.00, 3.00, 'Wing', 'dine_in', 'completed', 'pending', '2026-03-24 14:47:21'),
(33, 5, 6, 6, NULL, '', '', 3.00, 0.00, 0.00, 3.00, 'Wing', 'dine_in', 'completed', 'pending', '2026-03-24 15:31:13'),
(34, 5, 6, 6, NULL, '', '', 6.00, 0.00, 0.00, 6.00, 'Wing', 'dine_in', 'completed', 'pending', '2026-03-25 01:17:35'),
(35, 5, 6, 6, NULL, '', '', 3.00, 0.00, 0.00, 3.00, 'ABA', 'dine_in', 'completed', 'pending', '2026-03-25 01:18:35'),
(36, 14, 14, 17, NULL, '', '', 1.00, 0.00, 0.00, 1.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-03-31 15:13:27'),
(37, 14, 14, 17, NULL, '', '', 1.00, 0.00, 0.00, 1.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-03-31 15:16:41'),
(38, 14, 14, 17, NULL, '', '', 2.00, 0.00, 0.00, 2.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-03-31 15:17:13'),
(39, 14, 14, 17, NULL, '', '', 10.00, 0.00, 0.00, 10.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-03-31 15:18:18'),
(40, 14, 14, 18, NULL, '', '', 10.00, 0.00, 0.00, 10.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-03-31 15:36:02'),
(41, 14, 14, 18, NULL, '', '', 10.00, 0.00, 0.00, 10.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-03-31 15:38:25'),
(42, 5, 6, 6, NULL, '', '', 3.00, 0.00, 0.00, 3.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-01 08:40:29'),
(43, 5, 6, 6, NULL, '', '', 3.00, 0.00, 0.00, 3.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-01 08:40:40'),
(44, 5, 6, 6, NULL, '', '', 3.00, 0.00, 0.00, 3.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-01 08:40:54'),
(45, 5, 6, 6, NULL, '', '', 3.00, 0.00, 0.00, 3.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-01 08:41:17'),
(46, 5, 6, 6, NULL, '', '', 6.00, 0.00, 0.00, 6.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-01 08:41:58'),
(47, 5, 6, 6, NULL, '', '', 5.50, 0.00, 0.00, 5.50, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-01 08:42:39'),
(48, 5, 6, 6, NULL, '', '', 2.50, 0.00, 0.00, 2.50, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-01 08:43:01'),
(49, 5, 6, 6, NULL, '', '', 3.00, 0.00, 0.00, 3.00, 'Wing', 'dine_in', 'completed', 'pending', '2026-04-01 08:43:19'),
(50, 5, 6, 6, NULL, '', '', 2.50, 0.00, 0.00, 2.50, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-01 08:43:27'),
(51, 5, 6, 6, NULL, '', '', 2.50, 0.00, 0.00, 2.50, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-01 08:43:39'),
(52, 5, 6, 6, NULL, '', '', 3.00, 0.00, 0.00, 3.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-01 08:44:54'),
(53, 5, 6, 6, NULL, '', '', 3.00, 0.00, 0.00, 3.00, 'Cash', 'dine_in', 'completed', 'served', '2026-04-01 08:49:57'),
(54, 5, 6, 9, 9, '', '', 3.00, 0.00, 0.00, 3.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-01 09:36:16'),
(55, 5, 6, 9, 9, '', '', 3.00, 0.00, 0.00, 3.00, 'Wing', 'dine_in', 'completed', 'pending', '2026-04-01 09:37:17'),
(56, 5, 6, 9, 9, '', '', 2.50, 0.00, 0.00, 2.50, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-01 09:40:47'),
(57, 12, 12, 15, 11, '', '', 1.50, 0.00, 0.00, 1.50, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-02 01:24:16'),
(58, 12, 12, 15, 11, '', '', 10.00, 0.00, 0.00, 10.00, 'Wing', 'dine_in', 'completed', 'pending', '2026-04-02 02:49:15'),
(59, 12, 12, 15, 11, '', '', 6.00, 0.00, 0.00, 6.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-02 02:49:32'),
(60, 12, 12, 15, 11, '', '', 13.00, 0.00, 0.00, 13.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-02 02:52:47'),
(61, 12, 12, 15, 11, '', '', 25.00, 0.00, 0.00, 25.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-02 02:56:03'),
(62, 12, 12, 15, 11, '', '', 34.50, 0.00, 0.00, 34.50, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-02 02:59:12'),
(63, 12, 12, 15, 11, '', '', 23.50, 0.00, 0.00, 23.50, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-02 03:00:30'),
(64, 12, 12, 15, 11, '', '', 4.00, 0.00, 0.00, 4.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-02 03:01:21'),
(65, 12, 12, 15, 11, '', '', 6.50, 0.00, 0.00, 6.50, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-02 03:02:38'),
(66, 12, 12, 15, 11, '', '', 31.00, 0.00, 0.00, 31.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-02 03:03:27'),
(67, 12, 12, 15, 11, '', '', 7.00, 0.00, 0.00, 7.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-02 03:04:53'),
(68, 12, 12, 15, 11, '', '', 5.50, 0.00, 0.00, 5.50, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-02 03:12:04'),
(69, 14, 14, 17, 14, '', '', 20.50, 0.00, 0.00, 20.50, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-02 07:35:54'),
(70, 14, 14, 17, 14, '', '', 2.50, 0.00, 0.00, 2.50, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-02 07:43:07'),
(71, 12, 12, 15, 11, '', '', 39.50, 0.00, 0.00, 39.50, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-02 08:14:06'),
(72, 14, 14, 17, 14, '', '1', 50.00, 0.00, 0.00, 50.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-02 08:30:05'),
(73, 14, 14, 17, 14, '', '1', 19.00, 0.00, 0.00, 19.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-02 09:58:06'),
(74, 14, 14, 17, 14, '', '4', 18.00, 0.00, 0.00, 18.00, 'Wing', 'dine_in', 'completed', 'pending', '2026-04-02 09:58:23'),
(75, 13, 13, 16, 16, '', '1', 7.00, 0.00, 0.00, 7.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-03 14:20:24'),
(76, 12, 12, 15, 11, '', '', 73.00, 0.00, 0.00, 73.00, 'Cash', 'dine_in', 'completed', 'pending', '2026-04-03 14:20:49'),
(77, 13, 13, 16, 16, '', '1', 10.00, 0.00, 0.00, 10.00, 'Wing', 'dine_in', 'completed', 'pending', '2026-04-03 14:21:45');

-- --------------------------------------------------------

--
-- Table structure for table `order_details`
--

CREATE TABLE `order_details` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `note` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_details`
--

INSERT INTO `order_details` (`id`, `order_id`, `product_id`, `qty`, `price`, `note`) VALUES
(65, 57, 130, 1, 1.50, ''),
(66, 58, 134, 1, 4.00, ''),
(67, 58, 133, 1, 3.50, ''),
(68, 58, 132, 1, 2.50, ''),
(69, 59, 133, 1, 3.50, ''),
(70, 59, 132, 1, 2.50, ''),
(71, 60, 134, 1, 4.00, ''),
(72, 60, 133, 1, 3.50, ''),
(73, 60, 132, 1, 2.50, ''),
(74, 60, 131, 1, 1.50, ''),
(75, 60, 130, 1, 1.50, ''),
(76, 61, 134, 1, 4.00, ''),
(77, 61, 133, 1, 3.50, ''),
(78, 61, 132, 1, 2.50, ''),
(79, 61, 136, 1, 15.00, ''),
(80, 62, 134, 1, 4.00, ''),
(81, 62, 130, 1, 1.50, ''),
(82, 62, 131, 1, 1.50, ''),
(83, 62, 137, 1, 18.50, ''),
(84, 62, 141, 1, 9.00, ''),
(85, 63, 133, 1, 3.50, ''),
(86, 63, 139, 1, 14.50, ''),
(87, 63, 140, 1, 5.50, ''),
(88, 64, 134, 1, 4.00, ''),
(89, 65, 134, 1, 4.00, ''),
(90, 65, 132, 1, 2.50, ''),
(91, 66, 135, 1, 12.00, ''),
(92, 66, 136, 1, 15.00, ''),
(93, 66, 134, 1, 4.00, ''),
(94, 67, 134, 1, 4.00, ''),
(95, 67, 131, 2, 1.50, ''),
(96, 68, 140, 1, 5.50, ''),
(97, 69, 148, 1, 18.00, ''),
(98, 69, 149, 1, 2.50, ''),
(99, 70, 149, 1, 2.50, 'spicy, M'),
(100, 71, 144, 1, 3.50, ''),
(101, 71, 135, 1, 12.00, ''),
(102, 71, 136, 1, 15.00, ''),
(103, 71, 133, 1, 3.50, ''),
(104, 71, 134, 1, 4.00, ''),
(105, 71, 131, 1, 1.50, ''),
(106, 72, 146, 1, 8.00, ''),
(107, 72, 145, 1, 12.50, ''),
(108, 72, 147, 1, 6.50, ''),
(109, 72, 148, 1, 18.00, ''),
(110, 72, 149, 2, 2.50, 'mild, M'),
(111, 73, 145, 1, 12.50, ''),
(112, 73, 147, 1, 6.50, ''),
(113, 74, 148, 1, 18.00, ''),
(114, 75, 160, 1, 3.50, ''),
(115, 75, 163, 1, 0.75, ''),
(116, 75, 159, 1, 2.75, 'iced, Large, 100% Sugar'),
(117, 76, 144, 1, 3.50, ''),
(118, 76, 143, 1, 19.50, ''),
(119, 76, 135, 1, 12.00, ''),
(120, 76, 133, 1, 3.50, ''),
(121, 76, 140, 1, 5.50, ''),
(122, 76, 141, 1, 9.00, ''),
(123, 76, 142, 1, 20.00, ''),
(124, 77, 162, 1, 6.50, ''),
(125, 77, 160, 1, 3.50, '');

-- --------------------------------------------------------

--
-- Table structure for table `package_permissions`
--

CREATE TABLE `package_permissions` (
  `package_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `package_permissions`
--

INSERT INTO `package_permissions` (`package_id`, `permission_id`) VALUES
(1, 2),
(1, 4),
(1, 5),
(2, 2),
(2, 4),
(2, 5),
(3, 1),
(3, 2),
(3, 4),
(3, 7),
(3, 8),
(3, 9),
(4, 1),
(4, 2),
(4, 4),
(4, 6),
(4, 9),
(4, 10),
(4, 23);

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `tran_id` varchar(100) NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('pending','paid','failed','cancelled') DEFAULT 'pending',
  `duration_days` int(11) DEFAULT 30,
  `payway_ref` varchar(200) DEFAULT NULL,
  `error_msg` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `business_id`, `plan_id`, `tran_id`, `amount`, `status`, `duration_days`, `payway_ref`, `error_msg`, `created_at`, `updated_at`) VALUES
(1, 2, 3, 'POS-1772636727817-DV5PW', 99.00, 'paid', 30, 'SIMULATED', NULL, '2026-03-04 15:05:27', '2026-03-04 15:05:40'),
(2, 6, 2, 'POS-1773749975683-I9440', 29.00, 'pending', 30, NULL, NULL, '2026-03-17 12:19:35', '2026-03-17 12:19:35'),
(3, 6, 2, 'POS-1773750002999-ALBVV', 29.00, 'paid', 30, 'SIMULATED', NULL, '2026-03-17 12:20:03', '2026-03-17 12:20:09'),
(4, 6, 3, 'POS-1773803994815-J0SNU', 99.00, 'paid', 30, 'SIMULATED', NULL, '2026-03-18 03:19:54', '2026-03-18 03:19:56');

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `route_key` varchar(100) NOT NULL,
  `min_plan_id` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `name`, `route_key`, `min_plan_id`) VALUES
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
(26, 'System Modules', '/system-modules', 1);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `barcode` varchar(50) DEFAULT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `sizes` text DEFAULT NULL,
  `addons` text DEFAULT NULL,
  `moods` text DEFAULT NULL,
  `status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `discount` double DEFAULT 0,
  `product_type` enum('ready','recipe') DEFAULT 'ready',
  `expiry_date` date DEFAULT NULL,
  `strength` varchar(255) DEFAULT NULL,
  `generic_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `business_id`, `category_id`, `barcode`, `brand`, `name`, `description`, `image`, `sizes`, `addons`, `moods`, `status`, `created_at`, `discount`, `product_type`, `expiry_date`, `strength`, `generic_name`) VALUES
(105, 5, 19, NULL, NULL, 'Fresh Orange Juice', NULL, 'orange_juice.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(106, 5, 19, NULL, NULL, 'Apple Juice Delight', NULL, 'apple_juice.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(107, 5, 19, NULL, NULL, 'Watermelon Splash', NULL, 'watermelon_juice.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(108, 5, 19, NULL, NULL, 'Pineapple Glow', NULL, 'pineapple_juice.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(109, 5, 19, NULL, NULL, 'Tropical Mixed Juice', NULL, 'tropical_juice.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(110, 5, 20, NULL, NULL, 'Pure Fresh Milk', NULL, 'pure_milk.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(111, 5, 20, NULL, NULL, 'Soy Milk Classic', NULL, 'soy_milk.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(112, 5, 20, NULL, NULL, 'Almond Milk Silky', NULL, 'almond_milk.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(113, 5, 20, NULL, NULL, 'Strawberry Milk Dream', NULL, 'strawberry_milk.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(114, 5, 20, NULL, NULL, 'Rich Chocolate Milk', NULL, 'chocolate_milk.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(115, 5, 21, NULL, NULL, 'Chocolate Cookies', NULL, 'cookies.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(116, 5, 21, NULL, NULL, 'Potato Chips', NULL, 'potato_chips.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(117, 5, 21, NULL, NULL, 'Butter Popcorn', NULL, 'snack_cat.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(118, 5, 21, NULL, NULL, 'Spicy Nachos', NULL, 'snack_cat.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(119, 5, 21, NULL, NULL, 'Fudge Brownie', NULL, 'snack_cat.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(120, 5, 22, NULL, NULL, 'Shrimp Fried Rice', NULL, 'rice_cat.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(121, 5, 22, NULL, NULL, 'Golden Steam Rice', NULL, 'rice_cat.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(122, 5, 22, NULL, NULL, 'Garlic Rice', NULL, 'rice_cat.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(123, 5, 22, NULL, NULL, 'Pineapple Rice', NULL, 'rice_cat.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(124, 5, 22, NULL, NULL, 'Holy Basil Rice', NULL, 'rice_cat.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(125, 5, 23, NULL, NULL, 'New York Cheesecake', NULL, 'dessert_cat.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(126, 5, 23, NULL, NULL, 'Tiramisu Cup', NULL, 'dessert_cat.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(127, 5, 23, NULL, NULL, 'Mango Sticky Rice', NULL, 'dessert_cat.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(128, 5, 23, NULL, NULL, 'Premium Ice Cream', NULL, 'dessert_cat.png', NULL, NULL, NULL, 1, '2026-04-01 16:21:36', 0, 'ready', NULL, NULL, NULL),
(129, 5, 23, NULL, NULL, 'Delicate Fruit Tart', NULL, 'dessert_cat.png', '[]', '[]', '[]', 1, '2026-04-01 16:21:36', 0, 'ready', '0000-00-00', '', ''),
(130, 12, 24, '36758328', NULL, 'Panadol Extra (Red)', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775065215/coffee-pos/img-1775065213288-418279735.jpg', '[]', '[]', '[]', 1, '2026-04-01 17:37:47', 0, 'ready', '2027-05-06', '500mg', 'Paracetamol + Caffeine'),
(131, 12, 24, NULL, NULL, 'Paracetamol 500mg (ថ្នាំបញ្ចុះកម្តៅ)', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775065155/coffee-pos/img-1775065153931-722962596.jpg', '[]', '[]', '[]', 1, '2026-04-01 17:39:16', 0, 'ready', '2027-05-06', '500mg', 'Paracetamol'),
(132, 12, 24, '885000000001', NULL, 'Panadol 500mg', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775097400/coffee-pos/img-1775097399454-182489370.jpg', '[]', '[]', '[]', 1, '2026-04-02 01:30:05', 0, 'ready', '2029-08-10', '500mg', 'Paracetamol'),
(133, 12, 24, '885000000002', NULL, 'Ibuprofen 200mg', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775097376/coffee-pos/img-1775097375568-695665257.jpg', '[]', '[]', '[]', 1, '2026-04-02 01:30:05', 0, 'ready', '2027-09-03', '200mg', 'Ibuprofen'),
(134, 12, 24, '885000000003', NULL, 'Aspirin 100mg', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775097292/coffee-pos/img-1775097291367-334673881.jpg', '[]', '[]', '[]', 1, '2026-04-02 01:30:05', 0, 'ready', '2029-08-01', '100mg', 'Acetylsalicylic acid'),
(135, 12, 31, '885000000004', NULL, 'Amoxicillin 500mg', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775097241/coffee-pos/img-1775097240604-763748277.jpg', '[]', '[]', '[]', 1, '2026-04-02 01:30:05', 0, 'ready', '2027-08-25', '500mg', 'Amoxicillin'),
(136, 12, 31, '885000000005', NULL, 'Azithromycin 250mg', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775097195/coffee-pos/img-1775097194319-412055002.jpg', '[]', '[]', '[]', 1, '2026-04-02 01:30:05', 0, 'ready', '2027-08-12', '250mg', 'Azithromycin'),
(137, 12, 32, '885000000006', NULL, 'Vitamin C 1000mg', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775097131/coffee-pos/img-1775097130396-302730207.jpg', '[]', '[]', '[]', 1, '2026-04-02 01:30:05', 0, 'ready', '2027-08-12', '1000mg', 'Ascorbic Acid'),
(138, 12, 32, '885000000007', NULL, 'Fish Oil 1000mg', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775097060/coffee-pos/img-1775097059374-776766964.jpg', '[]', '[]', '[]', 1, '2026-04-02 01:30:05', 0, 'ready', '2027-09-24', '1000mg', 'Omega-3'),
(139, 12, 33, '885000000008', NULL, 'Cetaphil Cleanser', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775097005/coffee-pos/img-1775097004560-512522754.jpg', '[]', '[]', '[]', 1, '2026-04-02 01:30:05', 0, 'ready', '2028-05-05', '500ml', 'Cleanser'),
(140, 12, 33, '885000000009', NULL, 'Hand Sanitizer', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775096960/coffee-pos/img-1775096958773-843415964.jpg', '[]', '[]', '[]', 1, '2026-04-02 01:30:05', 0, 'ready', '2027-08-06', '500ml', 'Alcohol Gel'),
(141, 12, 34, '885000000010', NULL, 'Digital Thermometer', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775096904/coffee-pos/img-1775096902886-173129863.jpg', '[]', '[]', '[]', 1, '2026-04-02 01:30:05', 0, 'ready', '2029-05-18', 'Digital', 'Thermometer'),
(142, 12, 34, '885000000011', NULL, 'Band-Aid (Pack 20)', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775096826/coffee-pos/img-1775096825318-110457244.jpg', '[]', '[]', '\"Single use\"', 1, '2026-04-02 01:30:05', 0, 'ready', '2027-04-30', '20s', 'Plaster'),
(143, 12, 35, '885000000012', NULL, 'Pampers Pants XL', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775096752/coffee-pos/img-1775096751087-737326912.jpg', '[]', '[]', '[]', 1, '2026-04-02 01:30:05', 0, 'ready', '2026-12-03', 'XL 48s', 'Diaper'),
(144, 12, 35, '885000000013', NULL, 'Johnson Baby Powder', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775096638/coffee-pos/img-1775096637579-143641538.jpg', '[]', '[]', '\"Daily use\"', 1, '2026-04-02 01:30:05', 0, 'ready', '2027-05-06', '200g', 'Talc'),
(145, 14, 37, '13900379', NULL, 'មឹកអាំងអំបិលម្ទេស (Grilled Squid)', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775103837/coffee-pos/img-1775103835715-825616075.jpg', '[]', '[]', '[]', 1, '2026-04-02 04:23:57', 0, 'ready', '0000-00-00', '', ''),
(146, 14, 37, '30501999', NULL, 'សម្លម្ជូរគ្រឿងសាច់គោ (Beef Sour Soup)', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775104026/coffee-pos/img-1775104024278-547477054.jpg', '[]', '[]', '[]', 1, '2026-04-02 04:27:07', 0, 'ready', '0000-00-00', '', ''),
(147, 14, 38, '71424701', NULL, 'ឆាក្តៅសាច់មាន់ (Spicy Chicken Stir-Fry)', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775114022/coffee-pos/img-1775114020774-975787980.jpg', '[]', '[]', '[]', 1, '2026-04-02 07:13:42', 0, 'ready', '0000-00-00', '', ''),
(148, 14, 39, '95444478', NULL, 'ត្រីដុត نمបាញ់កុង (Grilled Fish set)', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775114227/coffee-pos/img-1775114224971-75031650.jpg', '[]', '[]', '[]', 1, '2026-04-02 07:17:07', 0, 'ready', '0000-00-00', '', ''),
(149, 14, 40, '99216246', NULL, 'បុកល្ហុង&ក្តាមប្រៃ', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775114523/coffee-pos/img-1775114521173-540374812.jpg', '[]', '[]', '[\"no_spicy\",\"mild\",\"spicy\",\"extra_spicy\"]', 1, '2026-04-02 07:22:03', 0, 'ready', '0000-00-00', '', ''),
(150, 1, 53, '10002001', NULL, 'Classic Hot Latte', NULL, 'https://images.unsplash.com/photo-1570968915860-54d5c401ff31?auto=format&fit=crop&w=300&q=80', '[{\"label\":\"Regular\",\"value\":\"R\",\"price\":2.5},{\"label\":\"Large\",\"value\":\"L\",\"price\":3.2}]', NULL, '[{\"label\":\"Hot\",\"value\":\"hot\"}]', 1, '2026-04-02 14:24:38', 0, 'ready', NULL, NULL, NULL),
(151, 1, 54, '10002002', NULL, 'Iced Americano', NULL, 'https://images.unsplash.com/photo-1551046710-388b93902345?auto=format&fit=crop&w=300&q=80', '[{\"label\":\"Regular\",\"value\":\"R\",\"price\":2.25},{\"label\":\"Large\",\"value\":\"L\",\"price\":2.75}]', NULL, '[{\"label\":\"Iced\",\"value\":\"iced\"}]', 1, '2026-04-02 14:24:38', 0, 'ready', NULL, NULL, NULL),
(152, 1, 61, '10002003', NULL, 'Blueberry Cheesecake', NULL, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=300&q=80', NULL, NULL, NULL, 1, '2026-04-02 14:24:38', 0, 'ready', NULL, NULL, NULL),
(153, 1, 56, '10002004', NULL, 'Matcha Latte', NULL, 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=300&q=80', NULL, NULL, '[{\"label\":\"Hot\",\"value\":\"hot\"},{\"label\":\"Iced\",\"value\":\"iced\"}]', 1, '2026-04-02 14:24:38', 0, 'ready', NULL, NULL, NULL),
(154, 1, 43, '20001001', NULL, 'Angkor Jasmine Rice 5kg', NULL, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=300&q=80', NULL, NULL, NULL, 1, '2026-04-02 14:24:38', 0, 'ready', NULL, NULL, NULL),
(155, 1, 44, '20001002', NULL, 'Coca Cola Classic Can', NULL, 'https://images.unsplash.com/photo-1581622558663-b2933044434c?auto=format&fit=crop&w=300&q=80', NULL, NULL, NULL, 1, '2026-04-02 14:24:38', 0, 'ready', NULL, NULL, NULL),
(156, 1, 45, '20001003', NULL, 'Pringles Sour Cream 110g', NULL, 'https://images.unsplash.com/photo-1582234053213-92c53300491e?auto=format&fit=crop&w=300&q=80', NULL, NULL, NULL, 1, '2026-04-02 14:24:38', 0, 'ready', NULL, NULL, NULL),
(157, 1, 47, '20001004', NULL, 'Mama Instant Noodles (Pork)', NULL, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=300&q=80', NULL, NULL, NULL, 1, '2026-04-02 14:24:38', 0, 'ready', NULL, NULL, NULL),
(158, 13, 53, '10002001', NULL, 'Classic Hot Latte', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775140190/coffee-pos/img-1775140187544-727953441.jpg', '[{\"label\":\"Regular\",\"value\":\"R\",\"price\":2.5},{\"label\":\"Large\",\"value\":\"L\",\"price\":3.2}]', '[]', '[\"hot\"]', 1, '2026-04-02 14:27:03', 0, 'ready', '0000-00-00', '', ''),
(159, 13, 54, '10002002', NULL, 'Iced Americano', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775140154/coffee-pos/img-1775140151022-718591937.jpg', '[{\"label\":\"Regular\",\"value\":\"R\",\"price\":2.25},{\"label\":\"Large\",\"value\":\"L\",\"price\":2.75}]', '[]', '[\"iced\"]', 1, '2026-04-02 14:27:03', 0, 'ready', '0000-00-00', '', ''),
(160, 13, 61, '10002003', NULL, 'Blueberry Cheesecake', NULL, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=300&q=80', NULL, NULL, NULL, 1, '2026-04-02 14:27:03', 0, 'ready', NULL, NULL, NULL),
(161, 13, 56, '10002004', NULL, 'Matcha Latte', NULL, 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=300&q=80', NULL, NULL, '[{\"label\":\"Hot\",\"value\":\"hot\"},{\"label\":\"Iced\",\"value\":\"iced\"}]', 1, '2026-04-02 14:27:03', 0, 'ready', NULL, NULL, NULL),
(162, 13, 43, '20001001', NULL, 'Angkor Jasmine Rice 5kg', NULL, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=300&q=80', NULL, NULL, NULL, 1, '2026-04-02 14:27:03', 0, 'ready', NULL, NULL, NULL),
(163, 13, 44, '20001002', NULL, 'Coca Cola Classic Can', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775140123/coffee-pos/img-1775140117975-14398752.jpg', '[]', '[]', '[]', 1, '2026-04-02 14:27:03', 0, 'ready', '0000-00-00', '', ''),
(164, 13, 45, '20001003', NULL, 'Pringles Sour Cream 110g', NULL, 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775140092/coffee-pos/img-1775140089623-650635810.jpg', '[]', '[]', '[]', 1, '2026-04-02 14:27:03', 0, 'ready', '0000-00-00', '', ''),
(165, 13, 47, '20001004', NULL, 'Mama Instant Noodles (Pork)', NULL, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=300&q=80', '[]', '[]', '[]', 1, '2026-04-02 14:27:03', 6, 'ready', '0000-00-00', '', '');

-- --------------------------------------------------------

--
-- Table structure for table `purchase`
--

CREATE TABLE `purchase` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `ref` varchar(50) DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `paid_amount` decimal(10,2) NOT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `purchase_date` datetime DEFAULT current_timestamp(),
  `status` varchar(20) DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase`
--

INSERT INTO `purchase` (`id`, `business_id`, `branch_id`, `supplier_id`, `ref`, `total_amount`, `paid_amount`, `note`, `created_at`, `created_by`, `purchase_date`, `status`) VALUES
(1, 5, 6, 1, 'PO-TEST-1772815887234', 50.00, 50.00, 'Test Purchase for Products and Ingredients', '2026-03-06 16:51:27', 1, '2026-03-06 23:54:41', 'Pending'),
(2, 5, 6, 1, 'PO-1772816352478', 135.00, 0.00, NULL, '2026-03-06 16:59:12', 6, '2026-03-06 23:59:12', 'Partial'),
(3, 5, 6, 1, 'PO-1772816464939', 75.00, 0.00, NULL, '2026-03-06 17:01:04', 6, '2026-03-07 00:01:04', 'Received'),
(4, 13, 13, 2, 'PO-1774719367709', 2.50, 0.00, NULL, '2026-03-28 17:36:07', 16, '2026-03-29 00:35:34', 'Received');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_product`
--

CREATE TABLE `purchase_product` (
  `id` int(11) NOT NULL,
  `purchase_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `raw_material_id` int(11) DEFAULT NULL,
  `qty` int(11) NOT NULL,
  `received_qty` decimal(10,2) DEFAULT 0.00,
  `cost` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_product`
--

INSERT INTO `purchase_product` (`id`, `purchase_id`, `product_id`, `raw_material_id`, `qty`, `received_qty`, `cost`) VALUES
(1, 1, NULL, NULL, 10, 0.00, 3.00),
(2, 1, NULL, NULL, 5, 0.00, 4.00),
(3, 2, NULL, NULL, 90, 20.00, 1.50),
(4, 3, NULL, NULL, 50, 50.00, 1.50),
(5, 4, NULL, 5, 1, 1.00, 2.50);

-- --------------------------------------------------------

--
-- Table structure for table `raw_material`
--

CREATE TABLE `raw_material` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `qty` decimal(10,2) DEFAULT 0.00,
  `min_stock` decimal(10,2) DEFAULT 0.00,
  `unit` varchar(20) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT 0.00,
  `image` varchar(255) DEFAULT NULL,
  `status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `raw_material`
--

INSERT INTO `raw_material` (`id`, `business_id`, `branch_id`, `name`, `code`, `qty`, `min_stock`, `unit`, `price`, `image`, `status`, `created_at`) VALUES
(3, 1, 1, 'Coffee Powder', NULL, 5.80, 2.00, 'kg', 12.00, NULL, 1, '2026-03-04 16:12:18'),
(4, 2, 3, 'Coffee Powder', NULL, 5.00, 2.00, 'kg', 12.00, NULL, 1, '2026-03-04 16:19:03'),
(5, 13, 13, 'ទឹកដោះគោ', '1222', 101.00, 10.00, 'kg', 0.00, NULL, 1, '2026-03-28 17:31:38'),
(6, 13, 13, 'Coffee Beans', 'RM001', 5000.00, 0.00, 'g', 0.05, NULL, 1, '2026-03-28 18:41:41'),
(7, 13, 13, 'Fresh Milk', 'RM002', 10000.00, 0.00, 'ml', 0.00, NULL, 1, '2026-03-28 18:41:41'),
(8, 13, 13, 'Syrup', 'RM003', 2000.00, 0.00, 'ml', 0.01, NULL, 1, '2026-03-28 18:41:41'),
(9, 13, 13, 'Coffee Beans', 'RM001', 5000.00, 0.00, 'g', 0.05, NULL, 1, '2026-03-28 18:42:22'),
(10, 13, 13, 'Fresh Milk', 'RM002', 10000.00, 0.00, 'ml', 0.00, NULL, 1, '2026-03-28 18:42:22'),
(11, 13, 13, 'Syrup', 'RM003', 2000.00, 0.00, 'ml', 0.01, NULL, 1, '2026-03-28 18:42:22');

-- --------------------------------------------------------

--
-- Table structure for table `recipe_detail`
--

CREATE TABLE `recipe_detail` (
  `id` int(11) NOT NULL,
  `business_id` int(11) DEFAULT NULL,
  `product_id` int(11) NOT NULL,
  `raw_material_id` int(11) NOT NULL,
  `qty` decimal(10,3) NOT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `business_id`, `name`, `code`) VALUES
(1, 1, 'Super Admin', 'super_admin'),
(2, 1, 'Owner', 'OWNER'),
(3, 1, 'Staff', 'STAFF'),
(4, 2, 'Owner', 'owner'),
(7, 5, 'Owner', 'owner'),
(8, 6, 'Owner', 'owner'),
(9, 6, 'Sale', 'SALE'),
(10, 5, 'Sale', 'SALE'),
(11, 7, 'Owner', 'owner'),
(12, 9, 'Owner', 'owner'),
(16, 11, 'Owner', 'owner'),
(17, 11, 'Manager', 'manager'),
(18, 11, 'Sale', 'sale'),
(19, 12, 'Owner', 'owner'),
(20, 12, 'Manager', 'manager'),
(21, 12, 'Sale', 'sale'),
(22, 13, 'Owner', 'owner'),
(23, 13, 'Manager', 'manager'),
(24, 13, 'Sale', 'sale'),
(25, 14, 'Owner', 'owner'),
(26, 14, 'Manager', 'manager'),
(27, 14, 'Cashie', 'sale');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `can_view` tinyint(1) DEFAULT 1,
  `can_create` tinyint(1) DEFAULT 0,
  `can_edit` tinyint(1) DEFAULT 0,
  `can_delete` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`role_id`, `permission_id`, `can_view`, `can_create`, `can_edit`, `can_delete`) VALUES
(1, 1, 1, 1, 1, 1),
(1, 2, 1, 1, 1, 1),
(1, 3, 1, 1, 1, 1),
(1, 4, 1, 1, 1, 1),
(1, 5, 1, 1, 1, 1),
(1, 6, 1, 1, 1, 1),
(1, 7, 1, 1, 1, 1),
(1, 8, 1, 1, 1, 1),
(1, 9, 1, 1, 1, 1),
(1, 10, 1, 1, 1, 1),
(1, 11, 1, 1, 1, 1),
(1, 12, 1, 1, 1, 1),
(1, 13, 1, 1, 1, 1),
(1, 14, 1, 1, 1, 1),
(1, 15, 1, 1, 1, 1),
(1, 16, 1, 1, 1, 1),
(1, 17, 1, 1, 1, 1),
(1, 18, 1, 1, 1, 1),
(1, 19, 1, 1, 1, 1),
(1, 20, 1, 1, 1, 1),
(1, 21, 1, 1, 1, 1),
(1, 22, 1, 1, 1, 1),
(1, 23, 1, 1, 1, 1),
(1, 25, 1, 1, 1, 1),
(1, 26, 1, 0, 0, 0),
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
(2, 18, 1, 1, 1, 1),
(2, 19, 1, 1, 1, 1),
(2, 20, 1, 1, 1, 1),
(2, 21, 1, 1, 1, 1),
(2, 22, 1, 1, 1, 1),
(2, 23, 1, 1, 1, 1),
(2, 25, 1, 0, 0, 0),
(2, 26, 1, 0, 0, 0),
(3, 2, 1, 1, 1, 1),
(3, 4, 1, 1, 1, 1),
(3, 5, 1, 1, 1, 1),
(3, 6, 1, 1, 1, 1),
(3, 20, 1, 1, 1, 1),
(3, 21, 1, 1, 1, 1),
(3, 22, 1, 1, 1, 1),
(3, 25, 1, 0, 0, 0),
(3, 26, 1, 0, 0, 0),
(4, 1, 1, 1, 1, 1),
(4, 2, 1, 1, 1, 1),
(4, 3, 1, 1, 1, 1),
(4, 4, 1, 1, 1, 1),
(4, 5, 1, 1, 1, 1),
(4, 6, 1, 1, 1, 1),
(4, 7, 1, 1, 1, 1),
(4, 8, 1, 1, 1, 1),
(4, 9, 1, 1, 1, 1),
(4, 10, 1, 1, 1, 1),
(4, 11, 1, 1, 1, 1),
(4, 12, 1, 1, 1, 1),
(4, 13, 1, 1, 1, 1),
(4, 14, 1, 1, 1, 1),
(4, 15, 1, 1, 1, 1),
(4, 16, 1, 1, 1, 1),
(4, 17, 1, 1, 1, 1),
(4, 18, 1, 1, 1, 1),
(4, 19, 1, 1, 1, 1),
(4, 20, 1, 1, 1, 1),
(4, 21, 1, 1, 1, 1),
(4, 22, 1, 1, 1, 1),
(4, 23, 1, 1, 1, 1),
(4, 24, 1, 0, 0, 0),
(7, 1, 1, 0, 0, 0),
(7, 2, 1, 0, 0, 0),
(7, 4, 1, 1, 1, 0),
(7, 6, 1, 1, 0, 0),
(7, 7, 1, 0, 0, 0),
(7, 8, 1, 0, 0, 0),
(7, 9, 1, 0, 0, 0),
(8, 1, 1, 1, 1, 1),
(8, 2, 1, 1, 1, 1),
(8, 3, 1, 1, 1, 1),
(8, 4, 1, 1, 1, 1),
(8, 5, 1, 1, 1, 1),
(8, 6, 1, 1, 1, 1),
(8, 7, 1, 1, 1, 1),
(8, 8, 1, 1, 1, 1),
(8, 9, 1, 1, 1, 1),
(8, 10, 1, 1, 1, 1),
(8, 11, 1, 1, 1, 1),
(8, 12, 1, 1, 1, 1),
(8, 13, 1, 1, 1, 1),
(8, 14, 1, 1, 1, 1),
(8, 15, 1, 1, 1, 1),
(8, 16, 1, 1, 1, 1),
(8, 17, 1, 1, 1, 1),
(8, 18, 1, 1, 1, 1),
(8, 19, 1, 1, 1, 1),
(8, 20, 1, 1, 1, 1),
(8, 21, 1, 1, 1, 1),
(8, 22, 1, 1, 1, 1),
(8, 23, 1, 1, 1, 1),
(8, 24, 1, 0, 0, 0),
(9, 2, 1, 1, 1, 1),
(9, 4, 1, 1, 1, 1),
(9, 5, 1, 1, 1, 1),
(9, 6, 1, 1, 1, 1),
(10, 2, 1, 1, 1, 1),
(10, 4, 1, 1, 1, 1),
(10, 5, 1, 1, 1, 1),
(10, 6, 1, 1, 1, 1),
(10, 12, 1, 1, 1, 1),
(11, 1, 1, 1, 1, 1),
(11, 2, 1, 1, 1, 1),
(11, 3, 1, 1, 1, 1),
(11, 4, 1, 1, 1, 1),
(11, 5, 1, 1, 1, 1),
(11, 6, 1, 1, 1, 1),
(11, 7, 1, 1, 1, 1),
(11, 8, 1, 1, 1, 1),
(11, 9, 1, 1, 1, 1),
(11, 10, 1, 1, 1, 1),
(11, 11, 1, 1, 1, 1),
(11, 12, 1, 1, 1, 1),
(11, 13, 1, 1, 1, 1),
(11, 14, 1, 1, 1, 1),
(11, 15, 1, 1, 1, 1),
(11, 16, 1, 1, 1, 1),
(11, 17, 1, 1, 1, 1),
(11, 19, 1, 1, 1, 1),
(11, 20, 1, 1, 1, 1),
(11, 21, 1, 1, 1, 1),
(11, 22, 1, 1, 1, 1),
(11, 23, 1, 1, 1, 1),
(11, 24, 1, 0, 0, 0),
(12, 1, 1, 1, 1, 1),
(12, 2, 1, 1, 1, 1),
(12, 3, 1, 1, 1, 1),
(12, 4, 1, 1, 1, 1),
(12, 5, 1, 1, 1, 1),
(12, 6, 1, 1, 1, 1),
(12, 7, 1, 1, 1, 1),
(12, 8, 1, 1, 1, 1),
(12, 9, 1, 1, 1, 1),
(12, 10, 1, 1, 1, 1),
(12, 11, 1, 1, 1, 1),
(12, 12, 1, 1, 1, 1),
(12, 13, 1, 1, 1, 1),
(12, 14, 1, 1, 1, 1),
(12, 15, 1, 1, 1, 1),
(12, 16, 1, 1, 1, 1),
(12, 17, 1, 1, 1, 1),
(12, 19, 1, 1, 1, 1),
(12, 20, 1, 1, 1, 1),
(12, 21, 1, 1, 1, 1),
(12, 22, 1, 1, 1, 1),
(12, 23, 1, 1, 1, 1),
(12, 24, 1, 0, 0, 0),
(16, 1, 1, 1, 1, 1),
(16, 2, 1, 1, 1, 1),
(16, 3, 1, 1, 1, 1),
(16, 4, 1, 1, 1, 1),
(16, 5, 1, 1, 1, 1),
(16, 6, 1, 1, 1, 1),
(16, 7, 1, 1, 1, 1),
(16, 8, 1, 1, 1, 1),
(16, 9, 1, 1, 1, 1),
(16, 10, 1, 1, 1, 1),
(16, 11, 1, 1, 1, 1),
(16, 12, 1, 1, 1, 1),
(16, 13, 1, 1, 1, 1),
(16, 14, 1, 1, 1, 1),
(16, 15, 1, 1, 1, 1),
(16, 16, 1, 1, 1, 1),
(16, 17, 1, 1, 1, 1),
(16, 19, 1, 1, 1, 1),
(16, 20, 1, 1, 1, 1),
(16, 21, 1, 1, 1, 1),
(16, 22, 1, 1, 1, 1),
(16, 23, 1, 1, 1, 1),
(16, 24, 1, 0, 0, 0),
(17, 2, 1, 1, 1, 1),
(17, 4, 1, 1, 1, 1),
(17, 5, 1, 1, 1, 1),
(17, 6, 1, 1, 1, 1),
(17, 7, 1, 1, 1, 1),
(17, 8, 1, 1, 1, 1),
(17, 12, 1, 1, 1, 1),
(17, 15, 1, 1, 1, 1),
(17, 16, 1, 1, 1, 1),
(17, 20, 1, 1, 1, 1),
(17, 22, 1, 1, 1, 1),
(18, 2, 1, 1, 1, 1),
(18, 4, 1, 1, 1, 1),
(18, 5, 1, 1, 1, 1),
(18, 6, 1, 1, 1, 1),
(18, 15, 1, 1, 1, 1),
(18, 22, 1, 1, 1, 1),
(19, 1, 1, 0, 0, 0),
(19, 2, 1, 0, 0, 0),
(19, 4, 1, 1, 1, 0),
(19, 6, 1, 1, 0, 0),
(19, 9, 1, 0, 0, 0),
(19, 10, 1, 0, 0, 0),
(19, 23, 1, 0, 0, 0),
(20, 2, 1, 0, 0, 0),
(20, 4, 1, 0, 0, 0),
(20, 5, 1, 0, 0, 0),
(20, 6, 1, 0, 0, 0),
(20, 7, 1, 0, 0, 0),
(20, 8, 1, 0, 0, 0),
(20, 12, 1, 0, 0, 0),
(20, 15, 1, 0, 0, 0),
(20, 16, 1, 0, 0, 0),
(20, 20, 1, 0, 0, 0),
(20, 22, 1, 0, 0, 0),
(21, 2, 1, 0, 0, 0),
(21, 4, 1, 0, 0, 0),
(21, 5, 1, 0, 0, 0),
(21, 6, 1, 0, 0, 0),
(21, 15, 1, 0, 0, 0),
(21, 22, 1, 0, 0, 0),
(22, 1, 1, 0, 0, 0),
(22, 2, 1, 0, 0, 0),
(22, 3, 1, 0, 0, 0),
(22, 4, 1, 1, 1, 0),
(22, 5, 1, 0, 0, 0),
(22, 6, 1, 1, 0, 0),
(22, 7, 1, 0, 0, 0),
(22, 8, 1, 0, 0, 0),
(22, 9, 1, 0, 0, 0),
(22, 10, 1, 0, 0, 0),
(22, 11, 1, 0, 0, 0),
(22, 12, 1, 0, 0, 0),
(22, 13, 1, 0, 0, 0),
(22, 14, 1, 0, 0, 0),
(22, 15, 1, 0, 0, 0),
(22, 16, 1, 0, 0, 0),
(22, 17, 1, 0, 0, 0),
(22, 19, 1, 0, 0, 0),
(22, 20, 1, 0, 0, 0),
(22, 21, 1, 0, 0, 0),
(22, 22, 1, 1, 0, 0),
(22, 23, 1, 0, 0, 0),
(22, 24, 1, 0, 0, 0),
(23, 2, 1, 0, 0, 0),
(23, 4, 1, 0, 0, 0),
(23, 5, 1, 0, 0, 0),
(23, 6, 1, 0, 0, 0),
(23, 7, 1, 0, 0, 0),
(23, 8, 1, 0, 0, 0),
(23, 12, 1, 0, 0, 0),
(23, 15, 1, 0, 0, 0),
(23, 16, 1, 0, 0, 0),
(23, 20, 1, 0, 0, 0),
(23, 22, 1, 0, 0, 0),
(24, 2, 1, 0, 0, 0),
(24, 4, 1, 0, 0, 0),
(24, 5, 1, 0, 0, 0),
(24, 6, 1, 0, 0, 0),
(24, 15, 1, 0, 0, 0),
(24, 22, 1, 0, 0, 0),
(25, 1, 1, 0, 0, 0),
(25, 2, 1, 0, 0, 0),
(25, 3, 1, 0, 0, 0),
(25, 4, 1, 1, 1, 0),
(25, 5, 1, 0, 0, 0),
(25, 6, 1, 1, 0, 0),
(25, 7, 1, 0, 0, 0),
(25, 8, 1, 0, 0, 0),
(25, 9, 1, 0, 0, 0),
(25, 10, 1, 0, 0, 0),
(25, 11, 1, 0, 0, 0),
(25, 12, 1, 0, 0, 0),
(25, 13, 1, 0, 0, 0),
(25, 14, 1, 0, 0, 0),
(25, 15, 1, 0, 0, 0),
(25, 16, 1, 0, 0, 0),
(25, 17, 1, 0, 0, 0),
(25, 18, 1, 0, 0, 0),
(25, 19, 1, 0, 0, 0),
(25, 20, 1, 0, 0, 0),
(25, 21, 1, 0, 0, 0),
(25, 22, 1, 1, 0, 0),
(25, 23, 1, 0, 0, 0),
(25, 24, 1, 0, 0, 0),
(25, 25, 1, 0, 0, 0),
(25, 26, 1, 0, 0, 0),
(26, 2, 1, 0, 0, 0),
(26, 4, 1, 0, 0, 0),
(26, 5, 1, 0, 0, 0),
(26, 6, 1, 0, 0, 0),
(26, 7, 1, 0, 0, 0),
(26, 8, 1, 0, 0, 0),
(26, 12, 1, 0, 0, 0),
(26, 15, 1, 0, 0, 0),
(26, 16, 1, 0, 0, 0),
(26, 20, 1, 0, 0, 0),
(26, 22, 1, 0, 0, 0),
(27, 2, 1, 0, 0, 0),
(27, 4, 1, 0, 0, 0),
(27, 5, 1, 0, 0, 0),
(27, 6, 1, 1, 0, 0),
(27, 15, 1, 0, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `shifts`
--

CREATE TABLE `shifts` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `opening_cash_usd` decimal(10,2) DEFAULT 0.00,
  `opening_cash_khr` decimal(10,2) DEFAULT 0.00,
  `actual_cash_usd` decimal(10,2) DEFAULT 0.00,
  `actual_cash_khr` decimal(10,2) DEFAULT 0.00,
  `expected_cash_usd` decimal(10,2) DEFAULT 0.00,
  `total_sales_usd` decimal(10,2) DEFAULT 0.00,
  `total_cash_usd` decimal(10,2) DEFAULT 0.00,
  `total_aba_usd` decimal(10,2) DEFAULT 0.00,
  `total_wing_usd` decimal(10,2) DEFAULT 0.00,
  `total_expense_usd` decimal(10,2) DEFAULT 0.00,
  `diff_usd` decimal(10,2) DEFAULT 0.00,
  `remark` text DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Closed',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `closed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shifts`
--

INSERT INTO `shifts` (`id`, `business_id`, `branch_id`, `user_id`, `opening_cash_usd`, `opening_cash_khr`, `actual_cash_usd`, `actual_cash_khr`, `expected_cash_usd`, `total_sales_usd`, `total_cash_usd`, `total_aba_usd`, `total_wing_usd`, `total_expense_usd`, `diff_usd`, `remark`, `status`, `created_at`, `closed_at`) VALUES
(1, 6, 7, 8, 50.00, 100000.00, 51.00, 100000.00, 76.00, 2.00, 0.00, 1.00, 0.00, 0.00, 0.00, NULL, 'Closed', '2026-03-17 14:18:21', NULL),
(2, 6, 7, 8, 0.00, 0.00, 0.00, 0.00, 1.00, 2.00, 0.00, 1.00, 0.00, 0.00, -1.00, NULL, 'Closed', '2026-03-17 14:19:05', NULL),
(3, 6, 7, 8, 50.00, 10000.00, 51.00, 10000.00, 53.50, 2.00, 1.00, 1.00, 0.00, 0.00, 0.00, NULL, 'Closed', '2026-03-18 02:03:48', '2026-03-18 02:08:05'),
(4, 6, 7, 8, 10.00, 0.00, 0.00, 0.00, 11.50, 2.50, 1.50, 1.00, 0.00, 0.00, -11.50, NULL, 'Closed', '2026-03-18 02:13:13', '2026-03-18 03:23:34'),
(5, 6, 7, 7, 50.00, 0.00, 51.50, 0.00, 51.50, 2.50, 1.50, 1.00, 0.00, 0.00, 0.00, NULL, 'Closed', '2026-03-18 02:23:02', '2026-03-18 02:24:11'),
(6, 6, 7, 7, 10.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 'Open', '2026-03-18 03:47:53', NULL),
(7, 1, 1, 1, 50.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 'Open', '2026-03-24 12:03:50', NULL),
(8, 5, 6, 6, 50.00, 0.00, 50.00, 0.00, 50.00, 15.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 'Closed', '2026-03-24 14:40:06', '2026-03-31 12:34:08'),
(9, 5, 6, 9, 0.00, 0.00, 5.50, 0.00, 5.50, 8.50, 5.50, 0.00, 3.00, 0.00, 0.00, NULL, 'Closed', '2026-03-25 03:00:22', '2026-04-01 09:43:59'),
(10, 11, 11, 14, 50.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 'Open', '2026-03-25 03:51:57', NULL),
(11, 12, 12, 15, 10.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 'Open', '2026-03-28 16:45:54', NULL),
(12, 5, 6, 6, 50.00, 0.00, 50.00, 0.00, 50.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 'Closed', '2026-03-31 12:34:15', '2026-03-31 14:40:13'),
(13, 5, 6, 6, 50.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 'Open', '2026-03-31 14:41:12', NULL),
(14, 14, 14, 17, 100.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 'Open', '2026-03-31 14:45:20', NULL),
(15, 14, 14, 18, 50.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 'Open', '2026-03-31 15:30:55', NULL),
(16, 13, 13, 16, 50.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, 'Open', '2026-04-02 14:20:34', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `stock_logs`
--

CREATE TABLE `stock_logs` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `item_type` enum('product','raw_material') NOT NULL,
  `item_id` int(11) NOT NULL,
  `old_qty` decimal(10,2) NOT NULL,
  `new_qty` decimal(10,2) NOT NULL,
  `qty_changed` decimal(10,2) NOT NULL,
  `type` enum('sale','purchase','receive','adjustment','waste','return') NOT NULL,
  `ref_id` varchar(50) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_logs`
--

INSERT INTO `stock_logs` (`id`, `business_id`, `branch_id`, `item_type`, `item_id`, `old_qty`, `new_qty`, `qty_changed`, `type`, `ref_id`, `reason`, `created_at`, `created_by`) VALUES
(1, 1, 1, 'raw_material', 3, 0.00, 0.00, 1.00, 'purchase', NULL, 'Test Purchase 1kg', '2026-03-04 16:12:39', NULL),
(2, 1, 1, 'raw_material', 3, 1.00, 0.80, -0.20, 'sale', NULL, 'POS Sale 10 Lattes', '2026-03-04 16:12:39', NULL),
(3, 5, 6, 'product', 5, 90.00, 95.00, 5.00, 'adjustment', NULL, 'order', '2026-03-06 15:36:12', 6),
(4, 5, 6, 'product', 5, 95.00, 94.00, -1.00, 'sale', 'INV-1', 'POS Sale', '2026-03-06 16:18:28', 6),
(5, 5, 6, 'product', 5, 94.00, 93.00, -1.00, 'sale', 'INV-2', 'POS Sale', '2026-03-06 16:24:27', 6),
(6, 5, 6, 'product', 5, 93.00, 92.00, -1.00, 'sale', 'INV-3', 'POS Sale', '2026-03-06 16:29:21', 6),
(7, 5, 6, 'product', 5, 92.00, 182.00, 90.00, 'purchase', 'PO-1772816352478', 'Supplier Purchase', '2026-03-06 16:59:12', 6),
(8, 5, 6, 'product', 5, 182.00, 232.00, 50.00, 'purchase', 'PO-1772816464939', 'Supplier Purchase', '2026-03-06 17:01:04', 6),
(9, 5, 6, 'product', 5, 232.00, 282.00, 50.00, 'receive', 'PO-1772816464939', 'Supplier Goods Received', '2026-03-06 17:23:08', 6),
(10, 5, 6, 'product', 5, 282.00, 302.00, 20.00, 'receive', 'PO-1772816352478', 'Supplier Goods Received', '2026-03-06 17:23:18', 6),
(11, 5, 6, 'product', 12, 100.00, 99.00, -1.00, 'sale', 'INV-4', 'POS Sale', '2026-03-06 17:24:21', 6),
(12, 13, 13, 'raw_material', 5, 100.00, 100.00, 1.00, 'purchase', 'PO-1774719367709', 'Supplier Purchase', '2026-03-28 17:36:07', 16);

-- --------------------------------------------------------

--
-- Table structure for table `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `plan_type` enum('basic','standard','premium') NOT NULL,
  `price` decimal(10,2) DEFAULT 0.00,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('active','expired','cancelled') DEFAULT 'active',
  `tran_id` varchar(100) DEFAULT NULL,
  `payment_status` enum('pending','paid','failed') DEFAULT 'paid',
  `plan_id` int(11) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subscriptions`
--

INSERT INTO `subscriptions` (`id`, `business_id`, `plan_type`, `price`, `start_date`, `end_date`, `status`, `tran_id`, `payment_status`, `plan_id`, `created_at`) VALUES
(1, 1, 'standard', 29.00, '2026-03-03', '2027-03-03', 'active', NULL, 'paid', 1, '2026-03-04 14:12:33'),
(2, 2, 'standard', 0.00, '2026-03-04', '2026-04-03', 'expired', NULL, 'paid', 1, '2026-03-04 14:12:33'),
(3, 2, 'standard', 0.00, '2026-03-04', '2026-04-03', 'expired', NULL, 'paid', 2, '2026-03-04 14:12:33'),
(4, 2, 'standard', 0.00, '2026-03-04', '2026-04-03', 'expired', NULL, 'paid', 1, '2026-03-04 14:12:33'),
(5, 2, 'standard', 0.00, '2026-03-04', '2026-04-03', 'expired', NULL, 'paid', 2, '2026-03-04 14:34:55'),
(6, 2, 'standard', 0.00, '2026-03-04', '2026-04-03', 'active', 'POS-1772636727817-DV5PW', 'paid', 3, '2026-03-04 15:05:40'),
(7, 5, 'standard', 0.00, '2026-03-06', '2026-04-05', 'active', NULL, 'paid', 1, '2026-03-06 12:09:45'),
(8, 6, 'standard', 0.00, '2026-03-17', '2026-04-16', 'expired', NULL, 'paid', 1, '2026-03-17 12:04:09'),
(9, 6, 'standard', 0.00, '2026-03-17', '2026-04-16', 'expired', 'POS-1773750002999-ALBVV', 'paid', 2, '2026-03-17 12:20:09'),
(10, 6, 'standard', 0.00, '2026-03-18', '2026-04-17', 'active', 'POS-1773803994815-J0SNU', 'paid', 3, '2026-03-18 03:19:56'),
(11, 7, 'standard', 0.00, '2026-03-25', '2026-04-24', 'active', NULL, 'paid', 1, '2026-03-25 03:31:30'),
(12, 9, 'standard', 0.00, '2026-03-25', '2026-04-24', 'active', NULL, 'paid', 1, '2026-03-25 03:43:43'),
(13, 11, 'standard', 0.00, '2026-03-25', '2026-04-24', 'active', NULL, 'paid', 1, '2026-03-25 03:48:10'),
(14, 12, 'standard', 0.00, '2026-03-28', '2026-04-27', 'active', NULL, 'paid', 1, '2026-03-28 15:57:42'),
(15, 13, 'standard', 0.00, '2026-03-28', '2026-04-27', 'expired', NULL, 'paid', 2, '2026-03-28 16:49:31'),
(16, 13, 'standard', 0.00, '2026-03-28', '2026-04-27', 'expired', NULL, 'paid', 2, '2026-03-28 16:53:54'),
(17, 13, 'standard', 0.00, '2026-03-28', '2026-04-27', 'expired', NULL, 'paid', 2, '2026-03-28 16:54:35'),
(18, 13, 'standard', 0.00, '2026-03-28', '2026-04-27', 'expired', NULL, 'paid', 2, '2026-03-28 16:56:33'),
(19, 13, 'standard', 0.00, '2026-03-28', '2026-04-27', 'expired', NULL, 'paid', 2, '2026-03-28 17:12:18'),
(20, 13, 'standard', 0.00, '2026-03-28', '2026-04-27', 'expired', NULL, 'paid', 2, '2026-03-28 17:47:35'),
(21, 13, 'standard', 0.00, '2026-03-28', '2026-04-27', 'expired', NULL, 'paid', 2, '2026-03-28 17:47:39'),
(22, 13, 'standard', 0.00, '2026-03-28', '2026-04-27', 'expired', NULL, 'paid', 2, '2026-03-28 17:48:10'),
(23, 13, 'standard', 0.00, '2026-03-28', '2026-04-27', 'expired', NULL, 'paid', 2, '2026-03-28 17:49:01'),
(24, 13, 'standard', 0.00, '2026-03-28', '2026-04-27', 'expired', NULL, 'paid', 2, '2026-03-28 17:49:27'),
(25, 13, 'standard', 0.00, '2026-03-28', '2026-04-27', 'expired', NULL, 'paid', 2, '2026-03-28 18:05:05'),
(26, 13, 'standard', 0.00, '2026-03-28', '2026-04-27', 'active', NULL, 'paid', 2, '2026-03-28 18:06:48'),
(27, 14, 'basic', 0.00, '2026-03-31', '2026-04-30', 'active', NULL, 'paid', 1, '2026-03-31 14:44:57');

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--

CREATE TABLE `subscription_plans` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `max_branches` int(11) DEFAULT 1,
  `max_staff` int(11) DEFAULT 2,
  `max_products` int(11) DEFAULT 50,
  `price` decimal(10,2) DEFAULT 0.00,
  `billing_cycle` enum('monthly','lifetime') DEFAULT 'monthly',
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subscription_plans`
--

INSERT INTO `subscription_plans` (`id`, `name`, `max_branches`, `max_staff`, `max_products`, `price`, `billing_cycle`, `is_active`, `created_at`) VALUES
(1, 'Free Plan', 1, 2, 20, 0.00, 'monthly', 1, '2026-03-03 15:03:30'),
(2, 'Pro Plan', 5, 10, 50, 30.00, 'monthly', 1, '2026-03-03 15:03:30'),
(3, 'Enterprise', 999, 999, 9999, 800.00, 'lifetime', 1, '2026-03-03 15:03:30');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `tel` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `business_id`, `code`, `name`, `tel`, `email`, `address`, `website`, `note`, `created_at`) VALUES
(1, 5, NULL, 'Coffee Supply Co.', '+855 12 345 678', NULL, 'Phnom Penh, Cambodia', NULL, NULL, '2026-03-06 16:51:27'),
(2, 13, '1222', 'Hea Hak', '09808708', 'heahak305@gmail.com', 'kh', NULL, NULL, '2026-03-28 17:16:05');

-- --------------------------------------------------------

--
-- Table structure for table `system_modules`
--

CREATE TABLE `system_modules` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_modules`
--

INSERT INTO `system_modules` (`id`, `name`, `code`, `description`, `status`, `created_at`) VALUES
(1, 'Core POS System', 'POS', NULL, 'active', '2026-04-01 03:49:49'),
(2, 'Web QR Ordering', 'ORDERING', NULL, 'active', '2026-04-01 03:49:49'),
(3, 'Advanced Inventory', 'INVENTORY', NULL, 'active', '2026-04-01 03:49:49');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `sett_key` varchar(100) NOT NULL,
  `sett_value` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `sett_key`, `sett_value`, `description`, `updated_at`) VALUES
(1, 'payway_merchant_id', NULL, NULL, '2026-03-08 13:39:54'),
(2, 'payway_api_key', NULL, NULL, '2026-03-08 13:39:54'),
(3, 'payway_receiver_name', NULL, NULL, '2026-03-08 13:39:54'),
(4, 'payway_khqr_image', NULL, NULL, '2026-03-08 13:39:54'),
(1101, 'landing_page', '{\"heroTitle\":\"Innovating your Global Solutions.\",\"heroSubtext\":\"High-performance POS management tailored for large-scale operations. Strategic control, unified intelligence, limitless scaling.\",\"primaryCTA\":\"EXPLORE SOLUTIONS\",\"secondaryCTA\":\"WATCH DEMO\",\"promoMart\":\"SROKSRE-MART-20\",\"promoRx\":\"SROKSRE-RX-15\",\"promoResto\":\"SROKSRE-RESTO-12\",\"telegram\":\"@pongchiva\",\"phone\":\"+855 081 257 XXX\"}', NULL, '2026-04-03 13:21:04');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `role_id` int(11) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `tel` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `is_super_admin` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `business_id`, `branch_id`, `role_id`, `name`, `email`, `password`, `image`, `status`, `tel`, `address`, `is_super_admin`, `created_at`) VALUES
(1, 1, 1, 1, 'Super Admin', 'admin@gmail.com', '$2b$10$e2nn6KeWqlmuJNbNnwJhs.ML/DvoMrBjU6quM3DIdCgyYNy0L2rnK', 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1774958973/coffee-pos/img-1774958969047-740284381.jpg', 'active', NULL, NULL, 1, '2026-03-03 12:53:14'),
(2, 1, 2, 1, 'Pong Chiva', 'pongchiva257@gmail.com', '$2b$10$bt6ON4skTCpmkq7YTh0nlOnY7fhD3SClMNViERKPlV2weQvnfaSMO', 'upload_image-1772547527529-495920070', 'active', '0999888777', 'pp', 1, '2026-03-03 14:15:55'),
(3, 2, 3, 4, 'Pong Chiva', 'senlin@gmail.com', '$2b$10$IAw7s86EAFdi7JdZwbyAQ.KGyBbW7adZggF2LP5VdZrPmEOmUTAWy', NULL, 'active', NULL, NULL, 0, '2026-03-04 02:50:07'),
(6, 5, 6, 7, 'Mart Khmer007', 'pongchiva@gmail.com', '$2b$10$Jr.Wj9SUBXVq6DYoyGsYEOp2MW06lQGQZ4CsIiHwKpJ2jXabPLyYG', 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1775054587/coffee-pos/img-1775054584894-273142213.png', 'active', NULL, NULL, 0, '2026-03-06 12:09:45'),
(7, 6, 7, 8, 'khengHak', 'khenghak@gmail.com', '$2b$10$wF.GysatE6AxeOpt/7XuiOucOZ6rrGFSeE8as1aBCKdtR8/ad.gDa', 'https://res.cloudinary.com/dq2iul0rv/image/upload/v1773804126/coffee-pos/img-1773804122964-953183604.jpg', 'active', NULL, NULL, 1, '2026-03-17 12:04:09'),
(8, 6, 7, 9, 'kimsreang', 'kimsreang@gmail.com', '$2b$10$xsbdj5T4BFXhoEcxcGqO7.gAuje30JLoeuoJ.JQOBFK9kco4kkLIi', NULL, 'active', '09987876', 'GV6J+Q54', 0, '2026-03-17 12:06:13'),
(9, 5, 6, 10, 'SALE', 'SALE257@gmail.com', '$2b$10$CnRC.Xlohb2lfwLSfh60geCV70BSRDO1vVvaJSV9R1Cn.PCLgBck.', NULL, 'active', '0977296971', 'pp', 0, '2026-03-24 14:57:01'),
(10, 7, 8, 11, 'Phearun', 'Phearun@gmail.com', '$2b$10$T3nYaVE9tRqmhASsDtVeceCPS0zjU5EgtyLCkuPiKqe.1Xr8k.3Da', NULL, 'active', NULL, NULL, 1, '2026-03-25 03:31:30'),
(11, 9, 9, 12, 'pheakdey', 'pheakdey@gmail.com', '$2b$10$WGdb7Jijwvf5e2sgZxQyoe/wZuDHsrWdpnSDVmHv6VtOyHf8QNqi2', NULL, 'active', NULL, NULL, 1, '2026-03-25 03:43:43'),
(13, 11, 11, 16, 'longda', 'longda@gmail.com', '$2b$10$L4QP1lLXXOypaOK25pVFG.7K2cBbUdznOEBB/TBUVPA38dF6Jttiu', NULL, 'active', NULL, NULL, 1, '2026-03-25 03:48:10'),
(14, 11, 11, 18, 'Kafong', 'kagong@gmail.com', '$2b$10$ulC8ceSqvo583TeXLizsnuHrRaJT8BGWeI1wg8uArN5gS.aP9f4gy', NULL, 'active', '089876576', 'tbungkhmum', 0, '2026-03-25 03:50:55'),
(15, 12, 12, 19, 'KruPet', 'testsystem@gmail.com', '$2b$10$MNZIBUt8C5pKFZgnvbKF7OJfmnos/IwbmcxOCCGmBX071cwy4FtLS', NULL, 'active', NULL, NULL, 1, '2026-03-28 15:57:42'),
(16, 13, 13, 22, 'ស្រេង ម៉េងស្រ៊ុន', 'srengmengsrun@gmail.com', '$2b$10$o9xTikkmWrT7qslWfGDMoeM62d9yYYCD/K1ZTw4iF2sJjSuIfzwKe', NULL, 'active', NULL, NULL, 1, '2026-03-28 16:49:31'),
(17, 14, 14, 25, 'Fong Restaurant', 'tong@gmail.com', '$2b$10$e6BeS/4k1Kzkv79tzm/BZutD4qG7UoqTKlGrqLp79jeNnvWgi0rYu', NULL, 'active', NULL, NULL, 1, '2026-03-31 14:44:57'),
(18, 14, 14, 27, 'Cashier Nak', 'naknak@gmail.com', '$2b$10$g3Pf.Dh46jZ3aDHXIugjZeChvgwsroupqIxpIe3bQv.vBQ5lBu22i', NULL, 'active', '0987897', 'pp', 0, '2026-03-31 15:30:12');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `business_id` (`business_id`);

--
-- Indexes for table `branch_products`
--
ALTER TABLE `branch_products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `branch_id` (`branch_id`,`product_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `branch_tables`
--
ALTER TABLE `branch_tables`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `businesses`
--
ALTER TABLE `businesses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `business_categories`
--
ALTER TABLE `business_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `business_id` (`business_id`,`category_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `business_id` (`business_id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `business_id` (`business_id`);

--
-- Indexes for table `employee`
--
ALTER TABLE `employee`
  ADD PRIMARY KEY (`id`),
  ADD KEY `business_id` (`business_id`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `expense`
--
ALTER TABLE `expense`
  ADD PRIMARY KEY (`id`),
  ADD KEY `business_id` (`business_id`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `expense_type_id` (`expense_type_id`);

--
-- Indexes for table `expense_type`
--
ALTER TABLE `expense_type`
  ADD PRIMARY KEY (`id`),
  ADD KEY `business_id` (`business_id`);

--
-- Indexes for table `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_product` (`user_id`,`product_id`);

--
-- Indexes for table `modular_packages`
--
ALTER TABLE `modular_packages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `business_id` (`business_id`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `order_details`
--
ALTER TABLE `order_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `package_permissions`
--
ALTER TABLE `package_permissions`
  ADD PRIMARY KEY (`package_id`,`permission_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tran_id` (`tran_id`),
  ADD KEY `business_id` (`business_id`),
  ADD KEY `plan_id` (`plan_id`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `business_id` (`business_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `purchase`
--
ALTER TABLE `purchase`
  ADD PRIMARY KEY (`id`),
  ADD KEY `business_id` (`business_id`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `purchase_product`
--
ALTER TABLE `purchase_product`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchase_id` (`purchase_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `raw_material_id` (`raw_material_id`);

--
-- Indexes for table `raw_material`
--
ALTER TABLE `raw_material`
  ADD PRIMARY KEY (`id`),
  ADD KEY `business_id` (`business_id`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `recipe_detail`
--
ALTER TABLE `recipe_detail`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `raw_material_id` (`raw_material_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `business_id` (`business_id`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- Indexes for table `shifts`
--
ALTER TABLE `shifts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `stock_logs`
--
ALTER TABLE `stock_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_item_logs` (`business_id`,`item_type`,`item_id`);

--
-- Indexes for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `business_id` (`business_id`);

--
-- Indexes for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `business_id` (`business_id`);

--
-- Indexes for table `system_modules`
--
ALTER TABLE `system_modules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sett_key` (`sett_key`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `business_id` (`business_id`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `role_id` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `branches`
--
ALTER TABLE `branches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `branch_products`
--
ALTER TABLE `branch_products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=169;

--
-- AUTO_INCREMENT for table `branch_tables`
--
ALTER TABLE `branch_tables`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `businesses`
--
ALTER TABLE `businesses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `business_categories`
--
ALTER TABLE `business_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=160;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee`
--
ALTER TABLE `employee`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expense`
--
ALTER TABLE `expense`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expense_type`
--
ALTER TABLE `expense_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `modular_packages`
--
ALTER TABLE `modular_packages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=78;

--
-- AUTO_INCREMENT for table `order_details`
--
ALTER TABLE `order_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=126;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=166;

--
-- AUTO_INCREMENT for table `purchase`
--
ALTER TABLE `purchase`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `purchase_product`
--
ALTER TABLE `purchase_product`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `raw_material`
--
ALTER TABLE `raw_material`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `recipe_detail`
--
ALTER TABLE `recipe_detail`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `shifts`
--
ALTER TABLE `shifts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `stock_logs`
--
ALTER TABLE `stock_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `subscriptions`
--
ALTER TABLE `subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `system_modules`
--
ALTER TABLE `system_modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1110;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `branches`
--
ALTER TABLE `branches`
  ADD CONSTRAINT `branches_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `branch_products`
--
ALTER TABLE `branch_products`
  ADD CONSTRAINT `branch_products_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `branch_products_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employee`
--
ALTER TABLE `employee`
  ADD CONSTRAINT `employee_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `employee_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `expense`
--
ALTER TABLE `expense`
  ADD CONSTRAINT `expense_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `expense_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `expense_ibfk_3` FOREIGN KEY (`expense_type_id`) REFERENCES `expense_type` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `expense_type`
--
ALTER TABLE `expense_type`
  ADD CONSTRAINT `expense_type_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_details`
--
ALTER TABLE `order_details`
  ADD CONSTRAINT `order_details_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_details_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `package_permissions`
--
ALTER TABLE `package_permissions`
  ADD CONSTRAINT `package_permissions_ibfk_1` FOREIGN KEY (`package_id`) REFERENCES `modular_packages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `package_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`);

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `purchase`
--
ALTER TABLE `purchase`
  ADD CONSTRAINT `purchase_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_ibfk_3` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `purchase_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `purchase_product`
--
ALTER TABLE `purchase_product`
  ADD CONSTRAINT `purchase_product_ibfk_1` FOREIGN KEY (`purchase_id`) REFERENCES `purchase` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_product_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `purchase_product_ibfk_3` FOREIGN KEY (`raw_material_id`) REFERENCES `raw_material` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `raw_material`
--
ALTER TABLE `raw_material`
  ADD CONSTRAINT `raw_material_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `raw_material_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `recipe_detail`
--
ALTER TABLE `recipe_detail`
  ADD CONSTRAINT `recipe_detail_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `recipe_detail_ibfk_2` FOREIGN KEY (`raw_material_id`) REFERENCES `raw_material` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `roles`
--
ALTER TABLE `roles`
  ADD CONSTRAINT `roles_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stock_logs`
--
ALTER TABLE `stock_logs`
  ADD CONSTRAINT `stock_logs_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD CONSTRAINT `suppliers_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `users_ibfk_3` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
