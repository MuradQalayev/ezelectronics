-- SQLite
DROP TABLE products

DELETE FROM users
WHERE role = "Manager"

CREATE TABLE products (
    model VARCHAR(255) PRIMARY KEY,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Smartphone', 'Laptop', 'Appliance')),
    quantity INT NOT NULL CHECK (quantity >= 0),
    details TEXT,
    sellingPrice REAL NOT NULL CHECK (sellingPrice > 0),
    arrivalDate DATE NOT NULL
);

CREATE TABLE reviews (
    model VARCHAR(255) NOT NULL,
    score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    username VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    PRIMARY KEY (username, model),
    FOREIGN KEY (model) REFERENCES products(model) ON DELETE CASCADE
);

CREATE TABLE carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer TEXT NOT NULL,
    paid BOOLEAN NOT NULL,
    paymentDate DATE,
    FOREIGN KEY (customer) REFERENCES users(username) ON DELETE CASCADE
);

CREATE TABLE cartsProducts (
    id INTEGER NOT NULL,
    model VARCHAR(255) NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 1),
    category VARCHAR(50) NOT NULL CHECK (category IN ('Smartphone', 'Laptop', 'Appliance')),
    sellingPrice REAL NOT NULL CHECK (sellingPrice > 0),
    PRIMARY KEY (id, model)
);


INSERT INTO products (model, category, quantity, details, sellingPrice, arrivalDate) VALUES 
('model2', 'Appliance', 40, 'Energy efficient', 299.99, '2024-05-21'),
('model3', 'Smartphone', 50, 'Latest model', 799.49, '2024-05-21'),
('model4', 'Laptop', 10, 'Lightweight', 599.95, '2024-05-21'),
('model5', 'Appliance', 25, 'Compact design', 150.75, '2024-05-21'),
('model6', 'Smartphone', 60, 'Fast charging', 699.99, '2024-05-21'),
('model7', 'Laptop', 20, '2-in-1 Convertible', 899.89, '2024-05-21'),
('model8', 'Appliance', 35, 'Smart home compatible', 199.99, '2024-05-21'),
('model9', 'Smartphone', 45, 'High resolution camera', 749.50, '2024-05-21'),
('model10', 'Laptop', 25, 'Gaming laptop', 1299.00, '2024-05-21'),
('model11', 'Appliance', 30, 'Self-cleaning', 349.99, '2024-05-21'),
('model12', 'Smartphone', 55, '5G enabled', 899.99, '2024-05-21'),
('model13', 'Laptop', 18, 'Business model', 1099.95, '2024-05-21'),
('model14', 'Appliance', 20, 'High capacity', 499.99, '2024-05-21'),
('model15', 'Smartphone', 40, 'Foldable screen', 1299.49, '2024-05-21'),
('model16', 'Laptop', 22, 'Touch screen', 749.89, '2024-05-21'),
('model17', 'Appliance', 38, 'Voice controlled', 299.95, '2024-05-21'),
('model18', 'Smartphone', 65, 'Dual SIM', 549.49, '2024-05-21'),
('model19', 'Laptop', 14, 'Extended battery life', 899.49, '2024-05-21'),
('model20', 'Appliance', 50, 'Eco-friendly', 399.99, '2024-05-21');

