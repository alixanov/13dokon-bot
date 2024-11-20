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
     { command: '/myorders', description: 'Мои заказы' },
     { command: '/recommend', description: 'Рекомендации товаров' },
     { command: '/help', description: 'Помощь' },
]);
// Хранение сообщений пользователей для поддержки и категорий
const userMessages = {};
const waitingForSupportMessage = {};  // Для поддержки
const waitingForCategoryMessage = {}; // Для категорий
// Универсальная функция для отправки приветственного сообщения
async function sendWelcomeMessage(chatId, userName) {
     const startMessage = `
*Добро пожаловать в магазин звука, ${userName}!* 

Здесь каждый найдёт свою ноту.

🎧 Приятных покупок!
    `;

     try {
          // Проверяем наличие изображения и отправляем его с текстом
          if (dokonlogo) {
               await bot.sendPhoto(chatId, dokonlogo, {
                    caption: startMessage,
                    parse_mode: 'Markdown'
               });
          } else {
               // Если изображение отсутствует, отправляем только текст
               await bot.sendMessage(chatId, startMessage, { parse_mode: 'Markdown' });
          }
     } catch (err) {
          console.error('Ошибка при отправке фото:', err);
          // В случае ошибки отправляем только текстё
          await bot.sendMessage(chatId, startMessage, { parse_mode: 'Markdown' });
     }
}

// Обрабатываем команду /start
bot.onText(/\/start/, (msg) => {
     const userName = msg.from.first_name ? msg.from.first_name.replace(/[_*[\]()]/g, '\\$&') : 'друг';
     sendWelcomeMessage(msg.chat.id, userName); // Вызываем универсальную функцию
});

// Обрабатываем команду /help для отображения списка команд
bot.on('message', (msg) => {
     const chatId = msg.chat.id;

     // Проверяем, если команда /help
     if (msg.text === '/help') {
          const helpMessage = `
📚 *Навигация по боту*:

1️⃣ /start — *Начни сначала*. Получи приветственное сообщение и начни исследование нашего ассортимента!

2️⃣ 🎵 /products — *Просмотри все товары*. Нажми эту команду, чтобы увидеть список доступных инструментов.

3️⃣ 🗂 /category — *Найди по категориям*. Используй эту команду, чтобы найти товары по категориям. Например: Гитара.

4️⃣ 🛒 /myorders — *Мои заказы*. Просмотри список твоих покупок и добавь отзывы на приобретённые товары.

5️⃣ 🔥 /recommend — *Рекомендации товаров*. Получи персонализированные рекомендации по продуктам на основе твоих покупок и предпочтений.

6️⃣ 🤝 /support — *Связь с поддержкой*. Если у тебя возникли вопросы или проблемы, отправь нам сообщение, и мы поможем.

🔄 *Пример использования*: Просто выбери нужную команду из списка или напиши её в чат!
        `;
          bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
     }
});
// Хранение состояния категории пользователя
const userCategoryState = {};
// Обрабатываем команду /products для отображения городов
bot.onText(/\/products/, async (msg) => {
     try {
          // Получаем все товары с сервера
          const response = await axios.get('http://localhost:8080/api/getall');
          const products = response.data;

          // Если товары есть, начинаем с городов
          if (products.length > 0) {
               // Извлекаем уникальные города (location)
               const locations = [...new Set(products.map(p => p.location))];

               // Формируем кнопки для городов
               const locationButtons = locations.map(location => {
                    return [{ text: location, callback_data: `location_${location}` }];
               });

               // Отправляем сообщение с кнопками городов
               bot.sendMessage(msg.chat.id, "Выберите город:", {
                    reply_markup: {
                         inline_keyboard: locationButtons
                    }
               });
          } else {
               bot.sendMessage(msg.chat.id, "К сожалению, товаров нет.");
          }
     } catch (error) {
          bot.sendMessage(msg.chat.id, "Ошибка при получении списка товаров. Проверьте, что API работает.");
     }
});
// Обрабатываем нажатие на город
bot.on('callback_query', async (query) => {
     const chatId = query.message.chat.id;
     const data = query.data;

     if (data.startsWith('location_')) {
          // Извлекаем выбранный город
          const selectedLocation = data.split('_')[1];

          try {
               // Получаем все товары с сервера
               const response = await axios.get('http://localhost:8080/api/getall');
               const products = response.data;

               // Фильтруем товары по выбранному городу
               const filteredProducts = products.filter(product => product.location === selectedLocation);

               // Извлекаем уникальные категории в выбранном городе
               const categories = [...new Set(filteredProducts.map(p => p.turi))];

               // Формируем кнопки для категорий
               const categoryButtons = categories.map(category => {
                    return [{ text: category, callback_data: `category_${selectedLocation}_${category}` }];
               });

               // Отправляем сообщение с кнопками категорий
               bot.sendMessage(chatId, `Вы выбрали город "${selectedLocation}". Теперь выберите категорию:`, {
                    reply_markup: {
                         inline_keyboard: categoryButtons
                    }
               });
          } catch (error) {
               bot.sendMessage(chatId, "Ошибка при получении списка категорий. Попробуйте позже.");
          }
     }
});


// Обрабатываем нажатие на категорию
bot.on('callback_query', async (query) => {
     const chatId = query.message.chat.id;
     const data = query.data;

     if (data.startsWith('category_')) {
          // Извлекаем выбранные город и категорию
          const parts = data.split('_');
          const selectedLocation = parts[1];
          const selectedCategory = parts[2];

          try {
               // Получаем все товары с сервера
               const response = await axios.get('http://localhost:8080/api/getall');
               const products = response.data;

               // Фильтруем товары по выбранному городу и категории
               const filteredProducts = products.filter(product => product.location === selectedLocation && product.turi === selectedCategory);

               if (filteredProducts.length > 0) {
                    // Отображаем товары, относящиеся к выбранному городу и категории
                    filteredProducts.forEach((product) => {
                         const caption = `
💼 *${product.nomi}*
💰 *Цена*: ${product.narxi} LTC
📦 *В наличии*: ${product.soni} шт.
📍 *Город*: ${product.location}
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
                    bot.sendMessage(chatId, `В категории "${selectedCategory}" в городе "${selectedLocation}" нет товаров.`);
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
💰 *Цена*: ${product.narxi} LTC.
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

               if (!product) {
                    bot.sendMessage(chatId, "Ошибка: товар не найден.");
                    return;
               }

               // Проверяем наличие товара
               if (product.soni <= 0) {
                    bot.sendMessage(chatId, "К сожалению, недостаточно товара на складе.");
                    return;
               }

               const confirmationMessage = `
🛒 *Ваш заказ подтвержден!*
Вы выбрали *${product.nomi}* за *${product.narxi} LTC.*

Выберите способ оплаты:
            `;

               // Уменьшаем количество товара на складе
               product.soni -= 1;
               await product.save();

               // Сохраняем заказ в базе данных
               const newOrder = new Order({
                    userId: chatId,
                    productId: product._id,
                    productName: product.nomi,
                    quantity: 1,
                    price: product.narxi,
                    status: "Ожидает оплаты",
               });
               await newOrder.save();

               // Отправляем сообщение пользователю с выбором способа оплаты
               bot.sendMessage(chatId, confirmationMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                         inline_keyboard: [
                              [{ text: '🪙 Оплатить через LITECOIN', callback_data: `pay_btc_${productId}_${product.narxi}` }],
                              [{ text: '💎 Оплатить через TON', callback_data: `pay_ton_${productId}_${product.narxi}` }]
                         ]
                    }
               });
          } catch (error) {
               console.error(`Ошибка при оформлении покупки: ${error}`);
               bot.sendMessage(chatId, "Ошибка при оформлении покупки. Попробуйте снова.");
          }
     }
});

// Обработка выбора метода оплаты
bot.on('callback_query', async (query) => {
     const chatId = query.message.chat.id;
     const data = query.data;

     if (data.startsWith('pay_btc_') || data.startsWith('pay_ton_')) {
          const parts = data.split('_');
          const productId = parts[2];
          const paymentMethod = data.startsWith('pay_btc_') ? 'LTC' : 'TON'; // Определяем метод оплаты

          try {
               // Ищем последний заказ пользователя для указанного продукта
               const order = await Order.findOne({ userId: chatId, productId }).sort({ createdAt: -1 });

               if (order) {
                    // Сохраняем метод оплаты
                    order.paymentMethod = paymentMethod;
                    await order.save();

                    const walletAddress = paymentMethod === 'LTC'
                         ? "ltc1qjf2yj96ymmsglsnq2jj2sxrfj84dl7ast6rcuu"
                         : "UQBaJ2hUD7xS7U2upyTscIIlgOpAwjgNItazKnjil4vohYPY";

                    bot.sendMessage(chatId, `
💼 *Оплата через ${paymentMethod === 'LTC' ? 'Litecoin' : 'TON'}*
━━━━━━━━━━━━━━━
📥 **Адрес:** \`${walletAddress}\`

📝 _После оплаты отправьте фото квитанции для подтверждения._
━━━━━━━━━━━━━━━
✨ _Проверьте адрес перед отправкой._
                `, { parse_mode: 'Markdown' });

                    // Сохраняем пользователя в состояние ожидания чека
                    waitingForPaymentConfirmation[chatId] = true;
               } else {
                    bot.sendMessage(chatId, "Ошибка: заказ не найден. Пожалуйста, попробуйте снова.");
               }
          } catch (error) {
               console.error("Ошибка при обработке метода оплаты:", error);
               bot.sendMessage(chatId, "Ошибка при обработке платежа. Попробуйте снова.");
          }
     }
});





// Флаг для ожидания чека
const waitingForPaymentConfirmation = {};

// Обрабатываем загрузку чека после оплаты
bot.on('message', async (msg) => {
     const chatId = msg.chat.id;

     if (waitingForPaymentConfirmation[chatId]) {
          if (msg.photo) {
               const fileId = msg.photo[msg.photo.length - 1].file_id;

               try {
                    // Ищем последний заказ пользователя
                    const order = await Order.findOne({ userId: chatId }).sort({ createdAt: -1 }).populate('productId');

                    if (order && order.productId) {
                         const product = order.productId;

                         const caption = `
📜 *Детали транзакции:*
👤 *Покупатель*: @${msg.from.username || 'без имени'} (ID: ${chatId})
🎵 *Товар*: ${product.nomi}
📖 *Описание*: ${product.malumoti || 'Нет описания'}
📦 *Количество*: ${order.quantity}
                    `;

                         // Отправляем чек и детали администратору
                         bot.sendPhoto(supportChatId, fileId, {
                              caption: caption,
                              parse_mode: 'Markdown',
                              reply_markup: {
                                   inline_keyboard: [
                                        [{ text: '✅ Подтвердить платёж', callback_data: `confirm_${chatId}` }],
                                        [{ text: '❌ Отклонить платёж', callback_data: `decline_${chatId}` }]
                                   ]
                              }
                         });

                         // Уведомляем пользователя
                         bot.sendMessage(chatId, "Спасибо за чек! Мы проверим ваш платёж и свяжемся с вами.");
                    } else {
                         bot.sendMessage(chatId, "Ошибка: заказ не найден. Пожалуйста, свяжитесь с поддержкой.");
                    }
               } catch (error) {
                    console.error("Ошибка при обработке чека:", error);
                    bot.sendMessage(chatId, "Ошибка при обработке чека. Пожалуйста, попробуйте снова.");
               }

               // Сбрасываем ожидание чека
               waitingForPaymentConfirmation[chatId] = false;
          } else {
               bot.sendMessage(chatId, "Пожалуйста, отправьте фото чека.");
          }
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

// Хранение состояния для отправки пункта выдачи
const waitingForPickupInfo = {};

// Обрабатываем нажатие на кнопку подтверждения или отклонения платежа
bot.on('callback_query', async (query) => {
     const data = query.data;
     const adminChatId = query.message.chat.id;

     if (data.startsWith('confirm_')) {
          const userId = data.split('_')[1];
          const orderNumber = generateOrderNumber();

          // Уведомляем пользователя о подтверждении платежа
          bot.sendMessage(userId, `
✅ Ваш платёж подтверждён.
📦 Номер вашего заказа: *${orderNumber}*.

📍 Ожидайте информацию о пункте выдачи вашего заказа. Мы свяжемся с вами в ближайшее время. Спасибо за ваш выбор!`, { parse_mode: 'Markdown' });

          // Уведомляем администратора о подтверждении
          bot.sendMessage(adminChatId, `Платёж для пользователя ${userId} подтверждён. Номер заказа: ${orderNumber}\n\n📩 Введите информацию о пункте выдачи, чтобы отправить её пользователю.`);

          // Сохраняем состояние, чтобы ожидать пункт выдачи
          waitingForPickupInfo[adminChatId] = { userId, orderNumber };

     } else if (data.startsWith('decline_')) {
          const userId = data.split('_')[1];

          // Уведомляем пользователя об отклонении платежа
          bot.sendMessage(userId, "❌ Ваш платёж не подтверждён. Пожалуйста, проверьте данные и попробуйте снова.");

          // Уведомляем администратора об отклонении
          bot.sendMessage(adminChatId, `Платёж для пользователя ${userId} отклонён.`);
     }
});

// Обрабатываем текстовые сообщения администратора для пункта выдачи
bot.on('message', async (msg) => {
     const adminChatId = msg.chat.id;

     // Проверяем, ожидается ли от администратора информация о пункте выдачи
     if (waitingForPickupInfo[adminChatId]) {
          const { userId, orderNumber } = waitingForPickupInfo[adminChatId];
          const pickupInfo = msg.text; // Текст пункта выдачи

          // Отправляем информацию пользователю
          bot.sendMessage(userId, `🎉 *Ваш заказ готов к получению!*\n\n📦 Номер заказа: *${orderNumber}*\n\n${pickupInfo}`, { parse_mode: 'Markdown' })
               .then(() => {
                    // Уведомляем администратора об успешной отправке
                    bot.sendMessage(adminChatId, `✅ Информация о пункте выдачи отправлена пользователю ${userId}.`);
                    delete waitingForPickupInfo[adminChatId]; // Сбрасываем состояние
               })
               .catch((error) => {
                    console.error(`Ошибка при отправке информации о пункте выдачи пользователю ${userId}:`, error);
                    bot.sendMessage(adminChatId, `❌ Ошибка при отправке информации пользователю ${userId}. Проверьте ID.`);
               });
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
bot.on('message', async (msg) => {
     const chatId = msg.chat.id;

     // Проверяем, если команда /recommend
     if (msg.text === '/recommend') {
          // Вызов функции рекомендаций для пользователя
          const recommendations = await recommendProducts(chatId);

          if (recommendations) {
               // Отправляем пользователю рекомендации
               recommendations.forEach(product => {
                    const caption = `🎉 *Рекомендуем вам:* ${product.nomi}\n💸 Цена: ${product.narxi} LTC.`;
                    bot.sendPhoto(chatId, product.rasm, { caption: caption, parse_mode: 'Markdown' });
               });
          } else {
               bot.sendMessage(chatId, "Извините, нет подходящих рекомендаций на данный момент.");
          }
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
