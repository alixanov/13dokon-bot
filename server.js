const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
require("dotenv").config();
const itemRoutes = require("./router/router"); // Подключение маршрутов для товаров


const PORT = process.env.PORT || 3005;

// Подключаем бота (если бот использует события WebSocket или подобное)
require("./bot");

// Подключаем базу данных
connectDB().catch(err => {
     console.error("Ошибка подключения к базе данных:", err.message);
     process.exit(1); // Завершаем работу сервера, если база данных не подключена
});

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));

// Маршруты
app.use("/api", itemRoutes);


// Маршрут проверки состояния сервера (health check)
app.get("/health", (req, res) => {
     res.status(200).json({ message: "Сервер работает корректно" });
});

// Запуск сервера
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
