const TelegramBot = require("node-telegram-bot-api");
const Instrument = require("./module/crud-schema"); // Подключаем твою модель
const Order = require('./module/order'); // Импортируем модель заказа
const Review = require('./module/review-schema'); // Импортируем модель для отзывов
const axios = require('axios');
// Создаем экземпляр бота с токеном
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
// ID чата поддержки
const supportChatId = 6183727519;  // Твой chat ID
const dokonlogo = "./assets/photo_2024-10-14_20-10-29.jpg"

// Устанавливаем команды для кнопок меню
bot.setMyCommands([
     { command: '/start', description: 'Начать работу' },
     { command: '/products', description: 'Каталог товаров' },
     { command: '/category', description: 'Поиск по категориям' },
     { command: '/support', description: 'Поддержка' },
     { command: "/myorders", description: "Мои заказы" },
     { command: '/recommend', description: 'Рекомендации товаров' }, // Новая команда
     { command: '/help', description: 'Помощь' }, // Новая команда


]);
// Хранение сообщений пользователей для поддержки и категорий
const userMessages = {};
const waitingForSupportMessage = {};  // Для поддержки
const waitingForCategoryMessage = {}; // Для категорий
// Обрабатываем команду /start
bot.onText(/\/start/, (msg) => {
     const startMessage = `
🎵 *Добро пожаловать в магазин звука, ${msg.from.first_name || 'друг'}!* 

Здесь каждый найдёт свою ноту.

🎧 Приятных покупок!
    `;

     const imageUrl = dokonlogo

     // Отправляем приветственную картинку с сообщением
     bot.sendPhoto(msg.chat.id, imageUrl, {
          caption: startMessage, // Текст приветствия
          parse_mode: 'Markdown'
     });
});


// Устанавливаем команды для кнопок меню
bot.setMyCommands([
     { command: '/start', description: 'Начать работу' },
     { command: '/products', description: 'Каталог товаров' },
     { command: '/category', description: 'Поиск по категориям' },
     { command: '/support', description: 'Поддержка' },
     { command: "/myorders", description: "Мои заказы" }, // Команда для просмотра заказов
     { command: '/recommend', description: 'Рекомендации товаров' }, // Новая команда
]);

// Обрабатываем команду /help для отображения списка команд
bot.onText(/\/help/, (msg) => {
     const helpMessage = `
📚 *Навигация по боту*:

1️⃣ /start — *Начни сначала*. Получи приветственное сообщение и начни исследование нашего ассортимента!

2️⃣ 🎵 /products — *Просмотри все товары*. Нажми эту команду, чтобы увидеть список доступных инструментов.

3️⃣ 🗂 /category — *Найди по категориям*. Используй эту команду, чтобы найти товары по категориям.
Например:Гитара.

4️⃣ 🛒 /myorders — *Мои заказы*. Просмотри список твоих покупок и добавь отзывы на приобретённые товары.

5️⃣ 🔥 /recommend — *Рекомендации товаров*. Получи персонализированные рекомендации по продуктам на основе твоих покупок и предпочтений.

6️⃣ 🤝 /support — *Связь с поддержкой*. Если у тебя возникли вопросы или проблемы, отправь нам сообщение, и мы поможем.

🔄 *Пример использования*: Просто выбери нужную команду из списка или напиши её в чат!
    `;
     bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: 'Markdown' });
});

// Хранение состояния категории пользователя
const userCategoryState = {};

// Обрабатываем команду /products для отображения категорий
bot.onText(/\/products/, async (msg) => {
     try {
          // Получаем все товары с сервера
          const response = await axios.get('http://localhost:8080/api/getall');
          const products = response.data;

          // Если товары есть, начинаем с категорий
          if (products.length > 0) {
               // Извлекаем уникальные категории (turi)
               const categories = [...new Set(products.map(p => p.turi))];

               // Формируем кнопки для категорий
               const categoryButtons = categories.map(category => {
                    return [{ text: category, callback_data: `category_${category}` }];
               });

               // Отправляем сообщение с кнопками категорий
               bot.sendMessage(msg.chat.id, "Выберите категорию:", {
                    reply_markup: {
                         inline_keyboard: categoryButtons
                    }
               });
          } else {
               bot.sendMessage(msg.chat.id, "К сожалению, товаров нет.");
          }
     } catch (error) {
          bot.sendMessage(msg.chat.id, "Ошибка при получении списка товаров. Проверьте, что API работает.");
     }
});

// Обрабатываем нажатие на категорию
bot.on('callback_query', async (query) => {
     const chatId = query.message.chat.id;
     const data = query.data;

     if (data.startsWith('category_')) {
          // Извлекаем выбранную категорию
          const selectedCategory = data.split('_')[1];

          try {
               // Получаем все товары
               const response = await axios.get('http://localhost:8080/api/getall');
               const products = response.data;

               // Фильтруем товары по выбранной категории
               const filteredProducts = products.filter(product => product.turi === selectedCategory);

               if (filteredProducts.length > 0) {
                    // Отображаем товары, относящиеся к выбранной категории
                    filteredProducts.forEach((product) => {
                         const caption = `
💼 *${product.nomi}*

📖 *Описание*: ${product.malumoti}
💸 *Цена*: ${product.narxi} руб.
✅ В наличии: *${product.soni} шт.*
                    `;
                         bot.sendPhoto(chatId, product.rasm, {
                              caption: caption,
                              parse_mode: 'Markdown',
                              reply_markup: {
                                   inline_keyboard: [
                                        [{ text: '🛒 Купить сейчас', callback_data: `buy_${product._id}` }],
                                        [{ text: '📖 Подробнее', callback_data: `details_${product._id}` }]
                                   ]
                              }
                         });
                    });
               } else {
                    bot.sendMessage(chatId, `В категории "${selectedCategory}" нет товаров.`);
               }
          } catch (error) {
               bot.sendMessage(chatId, "Ошибка при получении товаров. Попробуйте позже.");
          }
     }
});

// Хранение ID пользователей, которые отправили сообщения в техподдержку
const userMessageInfo = {};
// Обрабатываем команду /support для отправки сообщения в техподдержку
bot.onText(/\/support/, (msg) => {
     const chatId = msg.chat.id;
     bot.sendMessage(chatId, "Пожалуйста, отправьте ваше сообщение, и мы передадим его в техподдержку.");
     waitingForSupportMessage[chatId] = true;
});
// Обрабатываем все текстовые сообщения для техподдержки
bot.on('message', (msg) => {
     const chatId = msg.chat.id;
     const messageText = msg.text;

     if (waitingForSupportMessage[chatId] && messageText && !messageText.startsWith('/')) {
          userMessages[chatId] = messageText;
          userMessageInfo[chatId] = {
               username: msg.from.username || 'без имени',
               messageId: msg.message_id
          };

          bot.sendMessage(supportChatId, `Пользователь @${userMessageInfo[chatId].username} (${chatId}) оставил сообщение:\n"${messageText}"\n\nОтветьте командой: /reply ${chatId} [Ваш ответ]`);
          bot.sendMessage(chatId, "Ваше сообщение отправлено в поддержку. Мы свяжемся с вами в ближайшее время.");
          waitingForSupportMessage[chatId] = false;
     }
});
// Обрабатываем команду /reply для ответа пользователю
bot.onText(/\/reply (\d+) (.+)/, (msg, match) => {
     const chatId = match[1];
     const replyText = match[2];
     bot.sendMessage(chatId, `Техподдержка: ${replyText}`);
     bot.sendMessage(supportChatId, `Ваш ответ отправлен пользователю @${userMessageInfo[chatId]?.username || 'неизвестный'} (${chatId}).`);
});
// Проверка категории
bot.on('message', (msg) => {
     const chatId = msg.chat.id;
     const messageText = msg.text;

     if (waitingForCategoryMessage[chatId] && messageText && !messageText.startsWith('/')) {
          const category = messageText.toLowerCase();

          axios.get('http://localhost:8080/api/getall')
               .then(response => {
                    const products = response.data.filter(p => p.turi.toLowerCase() === category);

                    if (products.length > 0) {
                         products.forEach((product) => {
                              bot.sendPhoto(msg.chat.id, product.rasm, {
                                   caption: `🎵 *${product.nomi}* \n\n📖 ${product.malumoti}\n💰 Цена: ${product.narxi} руб.\n📦 В наличии: ${product.soni} шт.\n🔍 Категория: ${product.turi}`,
                                   parse_mode: 'Markdown',
                                   reply_markup: {
                                        inline_keyboard: [
                                             [{ text: 'Купить', callback_data: `buy_${product._id}` }],
                                             [{ text: 'Подробнее', callback_data: `details_${product._id}` }]
                                        ]
                                   }
                              });
                         });
                    } else {
                         bot.sendMessage(chatId, `К сожалению, нет товаров в категории "${category}".`);
                    }
               })
               .catch(error => {
                    bot.sendMessage(chatId, "Ошибка при поиске товаров.");
               });

          waitingForCategoryMessage[chatId] = false;
     }
});
// Обрабатываем команду /category для активации поиска по категории
bot.onText(/\/category/, (msg) => {
     const chatId = msg.chat.id;
     bot.sendMessage(chatId, "Пожалуйста, введите название категории для поиска.");
     waitingForCategoryMessage[chatId] = true;
});
// Флаг для ожидания чека
const waitingForPaymentConfirmation = {};
// Обрабатываем загрузку чека после оплаты
bot.on('message', (msg) => {
     const chatId = msg.chat.id;

     if (waitingForPaymentConfirmation[chatId]) {
          if (msg.photo) {
               bot.sendMessage(chatId, "Спасибо за чек! Мы проверим ваш платеж и свяжемся с вами.");
               const fileId = msg.photo[msg.photo.length - 1].file_id;
               bot.sendPhoto(supportChatId, fileId, {
                    caption: `Получен чек от пользователя @${msg.from.username || 'без имени'} (${chatId}). Проверьте оплату.`,
                    reply_markup: {
                         inline_keyboard: [
                              [{ text: '✅ Ваш платёж подтверждён', callback_data: `confirm_${chatId}` }],
                              [{ text: '❌ Ваш платёж не подтверждён', callback_data: `decline_${chatId}` }]
                         ]
                    }
               });
               waitingForPaymentConfirmation[chatId] = false;
          } else {
               bot.sendMessage(chatId, "Пожалуйста, отправьте фото чека.");
          }
     }
});
/// Обрабатываем нажатие на кнопку "Подробнее" и отображение отзывов
bot.on('callback_query', async (query) => {
     const chatId = query.message.chat.id;
     const data = query.data;

     if (data.startsWith('details_')) {
          const productId = data.split('_')[1];

          try {
               // Запрос на получение данных о продукте
               const product = await Instrument.findById(productId);
               const reviews = await Review.find({ productId: productId });

               if (product) {
                    // Формируем информацию о продукте
                    let productDetails = `
🎵 *${product.nomi}*

📖 *Описание*: ${product.malumoti}
💰 *Цена*: ${product.narxi} руб.
📦 *В наличии*: ${product.soni} шт.
🔍 *Категория*: ${product.turi}

Отзывы о товаре:
                `;

                    // Добавляем отзывы, если они есть
                    if (reviews.length > 0) {
                         reviews.forEach((review, index) => {
                              productDetails += `\n${index + 1}. ${review.reviewText} - Оставлено: ${review.reviewDate.toLocaleDateString()}`;
                         });
                    } else {
                         productDetails += "\nОтзывов пока нет.";
                    }

                    // Отправляем информацию о продукте вместе с отзывами
                    bot.sendMessage(chatId, productDetails, { parse_mode: 'Markdown' });
               } else {
                    bot.sendMessage(chatId, "Ошибка: информация о товаре не найдена.");
               }
          } catch (error) {
               bot.sendMessage(chatId, "Ошибка при получении информации о товаре. Попробуйте позже.");
          }
     }
});
// Функция для уменьшения количества товара
async function decreaseProductQuantity(productId, amount) {
     try {
          // Находим товар по ID
          const product = await Instrument.findById(productId);

          if (product && product.soni >= amount) {
               // Вычитаем нужное количество
               product.soni -= amount;

               // Сохраняем изменения
               await product.save();
               console.log(`Количество товара "${product.nomi}" успешно уменьшено на ${amount}. Осталось: ${product.soni}`);

               return true; // Успешное обновление
          } else if (product && product.soni < amount) {
               console.log("Недостаточно товара на складе.");
               return false; // Недостаточно товара
          } else {
               console.log("Товар не найден.");
               return false; // Товар не найден
          }
     } catch (error) {
          console.error("Ошибка при обновлении количества товара:", error);
          return false; // Ошибка
     }
}
// Обрабатываем нажатие на кнопку "Купить"
bot.on('callback_query', async (query) => {
     const chatId = query.message.chat.id;
     const data = query.data;

     if (data.startsWith('buy_')) {
          const productId = data.split('_')[1];

          try {
               // Находим товар по ID
               const product = await Instrument.findById(productId);

               if (product) {
                    const confirmationMessage = `
🛒 *Ваш заказ подтвержден!*
Вы выбрали *${product.nomi}* за *${product.narxi} руб.*
Выберите способ оплаты:
                    `;

                    // Проверяем наличие товара и уменьшаем количество
                    const success = await decreaseProductQuantity(productId, 1);

                    if (success) {
                         // Сохраняем заказ в базе данных
                         const newOrder = new Order({
                              userId: chatId,
                              productId: product._id,
                              productName: product.nomi,
                              quantity: 1,
                              price: product.narxi
                         });

                         await newOrder.save();

                         // Отправляем сообщение пользователю с выбором оплаты
                         bot.sendMessage(chatId, confirmationMessage, {
                              parse_mode: 'Markdown',
                              reply_markup: {
                                   inline_keyboard: [
                                        [{ text: '💳 Оплатить картой', callback_data: `pay_card_${productId}_${product.narxi}` }],
                                        [{ text: '💸 Оплатить через TON', callback_data: `pay_ton_${productId}_${product.narxi}` }],
                                        [{ text: '💵 Оплатить через Webmoney', callback_data: `pay_webmoney_${productId}_${product.narxi}` }]
                                   ]
                              }
                         });
                    } else {
                         bot.sendMessage(chatId, "К сожалению, недостаточно товара на складе.");
                    }
               } else {
                    bot.sendMessage(chatId, "Ошибка: товар не найден.");
               }
          } catch (error) {
               bot.sendMessage(chatId, "Ошибка при оформлении покупки. Попробуйте снова.");
          }
     }
});
// Обработка выбора метода оплаты
bot.on('callback_query', (query) => {
     const chatId = query.message.chat.id;
     const data = query.data;

     if (data.startsWith('pay_card_')) {
          // Оплата картой
          const parts = data.split('_');
          const amount = parts[3];

          bot.sendMessage(chatId, `
💳 Вы выбрали оплату картой.
Сумма к оплате: *${amount} руб.*
Пожалуйста, переведите сумму на следующие реквизиты:

🏦 *Владелец*: SHUKURULLO ALIXONOV
🏦 *МФО*: 00873
💳 *Номер карты*: 5189 6900 6672 1176
📅 *Срок действия*: 09/25

После оплаты, отправьте фото чека.
        `, { parse_mode: 'Markdown' });

          waitingForPaymentConfirmation[chatId] = true;

     } else if (data.startsWith('pay_ton_')) {
          // Оплата через TON
          const parts = data.split('_');
          const productId = parts[2];

          Instrument.findById(productId)
               .then(product => {
                    if (product) {
                         const tonAmount = product.ton;

                         bot.sendMessage(chatId, `
💸 Вы выбрали оплату через TON.
Сумма к оплате: *${tonAmount} TON*
Пожалуйста, переведите сумму на следующие реквизиты:

🪙 TON Wallet: UQBaJ2hUD7xS7U2upyTscIIlgOpAwjgNItazKnjil4vohYP
После оплаты, отправьте фото чека.
                         `, { parse_mode: 'Markdown' });

                         waitingForPaymentConfirmation[chatId] = true;
                    } else {
                         bot.sendMessage(chatId, "Ошибка: товар не найден.");
                    }
               })
               .catch(error => {
                    bot.sendMessage(chatId, "Ошибка при обработке оплаты. Попробуйте снова.");
               });
     } else if (data.startsWith('pay_webmoney_')) {
          // Оплата через Webmoney
          const parts = data.split('_');
          const amount = parts[3];

          bot.sendMessage(chatId, `
💸 Вы выбрали оплату через Webmoney.
Сумма к оплате: *${amount} руб.*
Пожалуйста, переведите сумму на следующие реквизиты:

💰 *Webmoney*: Z990037980848

После оплаты, отправьте фото чека.
        `, { parse_mode: 'Markdown' });

          waitingForPaymentConfirmation[chatId] = true;
     }
});

// Хранение успешных покупок пользователей
const userOrders = {};
// Функция для генерации случайного номера заказа
function generateOrderNumber() {
     const prefix = 'ORD';
     const randomNum = Math.floor(100000 + Math.random() * 900000);
     return `${prefix}-${randomNum}`;
}
// Обрабатываем нажатие на кнопку подтверждения или отклонения платежа
bot.on('callback_query', async (query) => {
     const data = query.data;
     const adminChatId = query.message.chat.id;

     if (data.startsWith('confirm_')) {
          const userId = data.split('_')[1];
          const orderNumber = generateOrderNumber();

          bot.sendMessage(userId, `✅ Ваш платёж подтверждён. Номер вашего заказа: *${orderNumber}*`, { parse_mode: 'Markdown' });
          bot.sendMessage(adminChatId, `Платёж для пользователя ${userId} подтверждён. Номер заказа: ${orderNumber}`);

          const purchasedProduct = {
               orderNumber,
               productId: data.split('_')[1],
               productName: "Название продукта",
               date: new Date().toLocaleDateString()
          };

          if (!userOrders[userId]) {
               userOrders[userId] = [];
          }
          userOrders[userId].push(purchasedProduct);

          const pickupMessage = `
🎉 *Ваш заказ готов к получению!*
📦 *Номер заказа*: ${orderNumber}
🏠 *Место получения*: ул. Примерная, д. 123, Доставка Пункт #4
🕒 *Часы работы*: Пн-Пт с 10:00 до 19:00

Пожалуйста, покажите этот номер заказа при получении. Спасибо за покупку!
        `;
          bot.sendMessage(userId, pickupMessage, { parse_mode: 'Markdown' });

     } else if (data.startsWith('decline_')) {
          const userId = data.split('_')[1];
          bot.sendMessage(userId, "❌ Ваш платёж не подтверждён. Пожалуйста, проверьте данные и попробуйте снова.");
          bot.sendMessage(adminChatId, `Платёж для пользователя ${userId} отклонён.`);
     }
});
// Обработчик команды /myorders для отображения списка покупок с кнопкой "Добавить отзыв"
bot.onText(/\/myorders/, async (msg) => {
     const chatId = msg.chat.id;
     try {
          // Ищем заказы пользователя по его ID (chatId)
          const orders = await Order.find({ userId: chatId }).populate('productId');
          // Проверяем, есть ли заказы
          if (orders.length > 0) {
               let buttons = [];
               // Перебираем каждый заказ и создаём кнопки
               orders.forEach((order, index) => {
                    if (order.productId) {
                         // Кнопка с порядковым номером, названием продукта и кнопка для добавления отзыва справа
                         buttons.push([
                              { text: `${index + 1}. ${order.productId.nomi}`, callback_data: `details_${order.productId._id}` },  // Порядковый номер и название продукта
                              { text: `Отзыв📝`, callback_data: `add_review_${order.productId._id}` }    // Кнопка для отзыва
                         ]);
                    }
               });
               // Отправляем сообщение с кнопками для каждого продукта
               bot.sendMessage(chatId, "Ваши покупки:", {
                    reply_markup: {
                         inline_keyboard: buttons
                    }
               });
          } else {
               bot.sendMessage(chatId, "У вас пока нет покупок.");
          }
     } catch (error) {
          console.error("Ошибка при получении списка покупок:", error);
          bot.sendMessage(chatId, "Ошибка при получении списка покупок. Попробуйте снова.");
     }
});
// Хранение состояния для ожидания отзыва
const waitingForReview = {};
// Обработка нажатия на кнопку "Посмотреть отзывы"
bot.on('callback_query', async (query) => {
     const data = query.data;

     if (data.startsWith('view_reviews_')) {
          const productId = data.split('_')[2];
          const chatId = query.message.chat.id;

          // Получаем отзывы для продукта
          try {
               const reviews = await Review.find({ productId: productId });

               if (reviews.length > 0) {
                    let reviewList = reviews.map((review, index) => `${index + 1}. ${review.reviewText} — ${review.reviewDate.toLocaleDateString()}`).join('\n');

                    bot.sendMessage(chatId, `Отзывы:\n\n${reviewList}`, { parse_mode: 'Markdown' });
               } else {
                    bot.sendMessage(chatId, "Отзывов пока нет.");
               }
          } catch (error) {
               bot.sendMessage(chatId, "Ошибка при получении отзывов. Попробуйте снова.");
          }
     }
});
// Обработка нажатия на кнопку "Добавить отзыв"
bot.on('callback_query', (query) => {
     const data = query.data;

     if (data.startsWith('add_review_')) {
          const productId = data.split('_')[2];
          const chatId = query.message.chat.id;

          // Предлагаем пользователю написать отзыв
          bot.sendMessage(chatId, `Напишите ваш отзыв о продукте ${productId}.`);

          // Сохраняем состояние ожидания отзыва для этого пользователя
          waitingForReview[chatId] = productId;
     }
});
// Обработка текста отзыва
bot.on('message', async (msg) => {
     const chatId = msg.chat.id;

     // Проверяем, находится ли пользователь в состоянии ожидания отзыва
     if (waitingForReview[chatId]) {
          const productId = waitingForReview[chatId];
          const reviewText = msg.text; // Получаем текст отзыва

          try {
               // Проверяем, купил ли пользователь этот продукт
               const purchasedProduct = await Order.findOne({ userId: chatId, productId });

               if (purchasedProduct) {
                    // Создаем и сохраняем новый отзыв
                    const newReview = new Review({
                         userId: chatId,
                         productId: productId,
                         reviewText: reviewText,
                         reviewDate: new Date() // Дата отзыва
                    });

                    await newReview.save();

                    bot.sendMessage(chatId, "Спасибо за ваш отзыв!");
               } else {
                    bot.sendMessage(chatId, "Вы не можете оставить отзыв на этот продукт, так как не покупали его.");
               }
          } catch (error) {
               bot.sendMessage(chatId, "Ошибка при сохранении отзыва. Попробуйте снова.");
          }

          // Очищаем состояние ожидания отзыва
          delete waitingForReview[chatId];
     }
});
// Обработчик команды /review для добавления отзыва
bot.onText(/\/review (\w+) (.+)/, async (msg, match) => {
     const chatId = msg.chat.id;
     const productId = match[1]; // ID продукта
     const reviewText = match[2]; // Текст отзыва

     try {
          // Проверяем, купил ли пользователь этот продукт
          const purchasedProduct = await Order.findOne({ userId: chatId, productId });

          if (purchasedProduct) {
               // Создаем и сохраняем новый отзыв
               const newReview = new Review({
                    userId: chatId, // ID пользователя
                    productId: productId, // ID продукта
                    reviewText: reviewText // Текст отзыва
               });

               await newReview.save(); // Сохраняем отзыв в базе данных

               bot.sendMessage(chatId, "Спасибо за ваш отзыв! Мы ценим ваше мнение.");
          } else {
               bot.sendMessage(chatId, "Вы не можете оставить отзыв на этот продукт, так как не покупали его.");
          }
     } catch (error) {
          bot.sendMessage(chatId, "Ошибка при сохранении отзыва. Попробуйте снова.");
     }
});

// Функция для рекомендации товаров
async function recommendProducts(userId) {
     try {
          const response = await axios.get('http://localhost:8080/api/getall');
          const products = response.data;

          // Логика для фильтрации товаров (например, те же категории, что и предыдущие покупки)
          const recommendedProducts = products.filter(p => p.turi === 'Терменвокс' || p.narxi < 500); // пример фильтрации

          if (recommendedProducts.length > 0) {
               return recommendedProducts;
          } else {
               return null;
          }
     } catch (error) {
          console.error("Ошибка рекомендаций:", error);
          return null;
     }
}

// Команда для получения рекомендаций
bot.onText(/\/recommend/, async (msg) => {
     const chatId = msg.chat.id;

     // Вызов функции рекомендаций для пользователя
     const recommendations = await recommendProducts(chatId);

     if (recommendations) {
          // Отправляем пользователю рекомендации
          recommendations.forEach(product => {
               const caption = `🎉 *Рекомендуем вам:* ${product.nomi}\n💸 Цена: ${product.narxi} руб.`;
               bot.sendPhoto(chatId, product.rasm, { caption: caption, parse_mode: 'Markdown' });
          });
     } else {
          bot.sendMessage(chatId, "Извините, нет подходящих рекомендаций на данный момент.");
     }
});


// Пример функции для сохранения отзыва в базе данных
function addReviewToDatabase(productId, userId, review) {
     console.log(`Новый отзыв: продукт ${productId}, от пользователя ${userId}: ${review}`);
}
// Обновление статуса заказа (пример функции)
function updateOrderStatus(userId, status, orderNumber) {
     console.log(`Статус заказа для пользователя ${userId} обновлён на: ${status}, Номер заказа: ${orderNumber || 'нет номера'}`);
}
function updateOrderStatus(userId, status) {
     console.log(`Статус заказа для пользователя ${userId} обновлён на: ${status}`);
}
