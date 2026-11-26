
CREATE DATABASE IF NOT EXISTS bloodconnect;

USE bloodconnect;

-- Donors Table
CREATE TABLE IF NOT EXISTS donors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bloodGroup VARCHAR(3) NOT NULL,
    location VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending'
);

-- Blood Requests Table
CREATE TABLE IF NOT EXISTS blood_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requesterName VARCHAR(100) NOT NULL,
    bloodGroup VARCHAR(3) NOT NULL,
    location VARCHAR(150) NOT NULL,
    units INT NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'Pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
