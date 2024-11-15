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
