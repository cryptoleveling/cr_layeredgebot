import { Wallet } from "ethers";
import axios from "axios";
import fs from "fs/promises";
import { HttpsProxyAgent } from "https-proxy-agent";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { randomBytes } from "crypto";
import TelegramBot from "node-telegram-bot-api";
import { TOKEN, REF_CODE } from "./config.js";
import dotenv from "dotenv";

dotenv.config();

const bot = new TelegramBot(TOKEN, { polling: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OWNER_SIGNATURE = process.env.OWNER_SIGNATURE;
const BOT_NAME = process.env.BOT_NAME;
const WELCOME_LOGO = process.env.WELCOME_LOGO;

function checkOwnership() {
  const currentSignature = process.env.OWNER_SIGNATURE;
  const currentBotName = process.env.BOT_NAME;
  const currentLogo = process.env.WELCOME_LOGO;

  if (
    !currentSignature || !currentBotName || !currentLogo ||
    currentSignature !== OWNER_SIGNATURE ||
    currentBotName !== BOT_NAME ||
    currentLogo !== WELCOME_LOGO
  ) {
    console.log(chalk.red("⚠️ اخطار: کد تغییر غیرمجاز تشخیص داده شده! این بات متعلق به Uniqe است."));
    if (allowedChatId) {
      bot.sendMessage(allowedChatId, "⚠️ این بات تغییر غیرمجاز پیدا کرده و متوقف می‌شود. مالک: Uniqe");
    }
    process.exit(1);
  }
}

checkOwnership();

const messages = {
  en: {
    welcome: WELCOME_LOGO + "\nPlease choose a language or an action:",
    next: "What would you like to do next?",
    unknown: "Unknown command. Please choose an option:",
    goodbye: "Goodbye!",
    privateKeyPrompt: "Please enter your private key (e.g., f2b3... or 0xf2b3...):",
    privateKeyEmpty: "❌ Private key cannot be empty!",
    privateKeyInvalid: "❌ Invalid private key format (must be 64 hex characters)!",
    privateKeySuccess: "✅ Private key added successfully!",
    privateKeyFail: "❌ Failed to add private key: ",
    noWallets: "❌ No wallets found. Please add some wallets first.",
    noProxies: "❌ No proxies found. Please load proxies first.",
    notEnoughProxies: "⚠️ Number of proxies ({{proxies}}) is less than wallets ({{wallets}}). Please load more proxies.",
    startBot: "🔄 Starting Flexible LayerEdge Bot...",
    processing: "Processing {{count}} account{{plural}}",
    accountDivider: "➖➖➖➖➖",
    accountInfo: "Processing Account {{current}}/{{total}}\nWallet: {{wallet}}...",
    tryingProxy: "Trying proxy {{current}}/{{total}}: {{proxy}}",
    registerStart: "[{{time}}] Starting registerWallet...",
    registerDone: "[{{time}}] registerWallet took {{duration}}ms",
    registerSuccess: "✅ Wallet registered",
    registerFail: "⚠️ Wallet registration failed, trying next proxy...",
    checkInStart: "[{{time}}] Starting dailyCheckIn...",
    checkInDone: "[{{time}}] dailyCheckIn took {{duration}}ms",
    checkInSuccess: "✅ Daily check-in completed",
    checkInAlready: "⚠️ Daily check-in already completed. Next check-in: {{nextTime}}",
    connectStart: "[{{time}}] Starting connectNode...",
    connectDone: "[{{time}}] connectNode took {{duration}}ms",
    connectSuccess: "✅ Node connected",
    pointsStart: "[{{time}}] Starting checkPoints...",
    pointsDone: "[{{time}}] checkPoints took {{duration}}ms",
    pointsSuccess: "✅ Points retrieved",
    pointsInfo: "Points for {{address}}: {{points}}",
    accountSuccess: "✅ Account {{current}} processing completed with proxy {{proxy}}",
    proxyFail: "❌ Proxy {{proxy}} failed: {{error}}",
    allProxiesFail: "⚠️ All three proxies failed for wallet {{wallet}}..., skipping to next wallet.",
    skipAccount: "⚠️ Skipping Account {{current}} due to proxy failures.",
    done: "✅ Processed {{count}} account{{plural}} (some may have been skipped)",
    runAgain: "Run again in 24 hours!",
    clearingProxies: "🔄 Clearing old proxies and fetching fresh ones...",
    needProxies: "Need at least {{min}} active proxies for {{wallets}} wallets...",
    testingBatch: "Testing batch of {{count}} proxies (from {{start}} to {{end}})...",
    foundProxies: "✅ Found {{count}} active proxies in this batch. Total: {{total}}",
    needMoreProxies: "Still need {{count}} more proxies, fetching next batch...",
    noMoreProxies: "⚠️ No more proxies available from ProxyScrape.",
    proxiesNotEnough: "⚠️ Only found {{count}} active proxies, less than required ({{min}}).",
    proxiesEnough: "✅ Found enough proxies: {{count}}",
    proxiesSaved: "✅ Saved {{count}} active proxies to proxies.txt",
    fetchFail: "❌ Failed to fetch proxies from ProxyScrape.",
    newWallet: "🔄 Creating a new wallet...",
    walletCreated: "✅ New wallet created - Address: {{address}}",
    walletAdded: "✅ Wallet added to wallets.json",
    startOnly: "Please start the bot with /start first!",
    langPrompt: "Please select your language:",
    info: "Wallet Info:\nTotal Wallets: {{total}}\n\n{{details}}",
    noWalletsInfo: "No wallets available to show info."
  },
  fa: {
    welcome: WELCOME_LOGO + "\nبه ربات Crypto Leveling خوش آمدید! لطفاً زبان یا عملی را انتخاب کنید:",
    next: "چه کاری می‌خواهید انجام دهید؟",
    unknown: "دستور ناشناخته. لطفاً یک گزینه انتخاب کنید:",
    goodbye: "خداحافظ!",
    privateKeyPrompt: "لطفاً کلید خصوصی خود را وارد کنید (مثلاً f2b3... یا 0xf2b3...):",
    privateKeyEmpty: "❌ کلید خصوصی نمی‌تواند خالی باشد!",
    privateKeyInvalid: "❌ فرمت کلید خصوصی نامعتبر است (باید ۶۴ کاراکتر هگز باشد)!",
    privateKeySuccess: "✅ کلید خصوصی با موفقیت اضافه شد!",
    privateKeyFail: "❌ اضافه کردن کلید خصوصی ناموفق بود: ",
    noWallets: "❌ هیچ کیف‌پولی یافت نشد. لطفاً ابتدا کیف‌پول اضافه کنید。",
    noProxies: "❌ هیچ پروکسی‌ای یافت نشد. لطفاً ابتدا پروکسی‌ها را بارگذاری کنید。",
    notEnoughProxies: "⚠️ تعداد پروکسی‌ها ({{proxies}}) کمتر از کیف‌پول‌ها ({{wallets}}) است. لطفاً پروکسی بیشتری بارگذاری کنید。",
    startBot: "🔄 ربات Flexible LayerEdge در حال شروع...",
    processing: "در حال پردازش {{count}} حساب{{plural}}",
    accountDivider: "➖➖➖➖➖",
    accountInfo: "پردازش حساب {{current}}/{{total}}\nکیف‌پول: {{wallet}}...",
    tryingProxy: "تلاش با پروکسی {{current}}/{{total}}: {{proxy}}",
    registerStart: "[{{time}}] شروع registerWallet...",
    registerDone: "[{{time}}] registerWallet در {{duration}} میلی‌ثانیه انجام شد",
    registerSuccess: "✅ کیف‌پول ثبت شد",
    registerFail: "⚠️ ثبت کیف‌پول ناموفق بود، تلاش با پروکسی بعدی...",
    checkInStart: "[{{time}}] شروع dailyCheckIn...",
    checkInDone: "[{{time}}] dailyCheckIn در {{duration}} میلی‌ثانیه انجام شد",
    checkInSuccess: "✅ چک‌این روزانه انجام شد",
    checkInAlready: "⚠️ چک‌این روزانه قبلاً انجام شده. چک‌این بعدی: {{nextTime}}",
    connectStart: "[{{time}}] شروع connectNode...",
    connectDone: "[{{time}}] connectNode در {{duration}} میلی‌ثانیه انجام شد",
    connectSuccess: "✅ نود متصل شد",
    pointsStart: "[{{time}}] شروع checkPoints...",
    pointsDone: "[{{time}}] checkPoints در {{duration}} میلی‌ثانیه انجام شد",
    pointsSuccess: "✅ امتیازات دریافت شد",
    pointsInfo: "امتیازات برای {{address}}: {{points}}",
    accountSuccess: "✅ پردازش حساب {{current}} با پروکسی {{proxy}} تکمیل شد",
    proxyFail: "❌ پروکسی {{proxy}} ناموفق بود: {{error}}",
    allProxiesFail: "⚠️ هر سه پروکسی برای کیف‌پول {{wallet}} ناموفق بود، رفتن به کیف‌پول بعدی...",
    skipAccount: "⚠️ رد کردن حساب {{current}} به دلیل خطای پروکسی.",
    done: "✅ {{count}} حساب{{plural}} پردازش شد (بعضی ممکن است رد شده باشند)",
    runAgain: "دوباره بعد از ۲۴ ساعت اجرا کنید!",
    clearingProxies: "🔄 پاک کردن پروکسی‌های قدیمی و گرفتن پروکسی‌های جدید...",
    needProxies: "نیاز به حداقل {{min}} پروکسی فعال برای {{wallets}} کیف‌پول...",
    testingBatch: "تست دسته {{count}} پروکسی (از {{start}} تا {{end}})...",
    foundProxies: "✅ یافتن {{count}} پروکسی فعال در این دسته. مجموع: {{total}}",
    needMoreProxies: "هنوز به {{count}} پروکسی دیگر نیاز است، گرفتن دسته بعدی...",
    noMoreProxies: "⚠️ پروکسی بیشتری از ProxyScrape در دسترس نیست.",
    proxiesNotEnough: "⚠️ فقط {{count}} پروکسی فعال یافت شد، کمتر از حد نیاز ({{min}}).",
    proxiesEnough: "✅ پروکسی کافی یافت شد: {{count}}",
    proxiesSaved: "✅ {{count}} پروکسی فعال در proxies.txt ذخیره شد",
    fetchFail: "❌ گرفتن پروکسی از ProxyScrape ناموفق بود.",
    newWallet: "🔄 ساخت کیف‌پول جدید...",
    walletCreated: "✅ کیف‌پول جدید ساخته شد - آدرس: {{address}}",
    walletAdded: "✅ کیف‌پول به wallets.json اضافه شد",
    startOnly: "لطفاً ابتدا ربات را با /start شروع کنید!",
    langPrompt: "لطفاً زبان خود را انتخاب کنید:",
    info: "اطلاعات کیف‌پول‌ها:\nتعداد کل کیف‌پول‌ها: {{total}}\n\n{{details}}",
    noWalletsInfo: "هیچ کیف‌پولی برای نمایش اطلاعات وجود ندارد."
  }
};

const delay = (seconds) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

const getNextCheckInTime = (cooldownMessage) => {
  const cooldownMatch = cooldownMessage?.match(/after\s+([^!]+)!/);
  if (cooldownMatch) return cooldownMatch[1].trim();
  const nextTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return nextTime.toLocaleString();
};

async function testProxy(proxy) {
  try {
    const agent = new HttpsProxyAgent(`http://${proxy}`);
    const response = await axios.get("https://www.google.com", {
      httpsAgent: agent,
      timeout: 5000,
    });
    return { proxy, isActive: response.status === 200 };
  } catch (error) {
    return { proxy, isActive: false };
  }
}

class RequestHandler {
  static async makeRequest(config, retries = 2, backoffMs = 2000) {
    for (let i = 0; i < retries; i++) {
      try {
        return await axios(config);
      } catch (error) {
        if (i === retries - 1) return null;
        await delay(backoffMs / 1000 * Math.pow(1.5, i));
      }
    }
    return null;
  }
}

class LayerEdgeBot {
  constructor(proxy, privateKey, refCode = REF_CODE) {
    this.refCode = refCode;
    this.proxy = proxy;
    this.headers = {
      Accept: "application/json, text/plain, */*",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Origin: "https://layeredge.io",
      Referer: "https://layeredge.io/",
    };
    this.axiosConfig = {
      httpsAgent: new HttpsProxyAgent(proxy),
      timeout: 10000,
      headers: this.headers,
      validateStatus: (status) => status < 500,
    };
    this.wallet = new Wallet(privateKey);
  }

  async makeRequest(method, url, config = {}) {
    const finalConfig = {
      method,
      url,
      ...this.axiosConfig,
      ...config,
      headers: { ...this.headers, ...(config.headers || {}) },
    };
    return await RequestHandler.makeRequest(finalConfig);
  }

  async registerWallet() {
    const response = await this.makeRequest(
      "post",
      `https://referralapi.layeredge.io/api/referral/register-wallet/${this.refCode}`,
      { data: { walletAddress: this.wallet.address } }
    );
    return response && response.data;
  }

  async dailyCheckIn() {
    const timestamp = Date.now();
    const message = `I am claiming my daily node point for ${this.wallet.address} at ${timestamp}`;
    const sign = await this.wallet.signMessage(message);
    const response = await this.makeRequest(
      "post",
      "https://referralapi.layeredge.io/api/light-node/claim-node-points",
      {
        data: { sign, timestamp, walletAddress: this.wallet.address },
        headers: { "Content-Type": "application/json" },
      }
    );
    if (response && response.data) {
      if (response.data.statusCode === 405 && response.data.message) {
        const nextTime = getNextCheckInTime(response.data.message);
        return { alreadyDone: true, nextTime };
      }
      return { alreadyDone: false };
    }
    return null;
  }

  async connectNode() {
    const timestamp = Date.now();
    const message = `Node activation request for ${this.wallet.address} at ${timestamp}`;
    const sign = await this.wallet.signMessage(message);
    const response = await this.makeRequest(
      "post",
      `https://referralapi.layeredge.io/api/light-node/node-action/${this.wallet.address}/start`,
      {
        data: { sign, timestamp },
        headers: { "Content-Type": "application/json" },
      }
    );
    return response && response.data?.message === "node action executed successfully";
  }

  async checkPoints() {
    const response = await this.makeRequest(
      "get",
      `https://referralapi.layeredge.io/api/referral/wallet-details/${this.wallet.address}`
    );
    return response && response.data ? response.data.data?.nodePoints || 0 : null;
  }
}

async function readWallets() {
  try {
    const walletPath = path.join(__dirname, "wallets.json");
    const data = await fs.readFile(walletPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function readProxies() {
  try {
    const proxyPath = path.join(__dirname, "proxies.txt");
    const data = await fs.readFile(proxyPath, "utf-8");
    return data.split("\n").map((line) => line.trim()).filter((line) => line);
  } catch (error) {
    return [];
  }
}

async function saveWalletInfo(walletData) {
  const walletInfoPath = path.join(__dirname, "walletInfo.json");
  await fs.writeFile(walletInfoPath, JSON.stringify(walletData, null, 2), "utf8");
}

async function readWalletInfo() {
  try {
    const walletInfoPath = path.join(__dirname, "walletInfo.json");
    const data = await fs.readFile(walletInfoPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

const formatMessage = (template, values) => {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] || "");
};

const languageMenu = {
  reply_markup: {
    keyboard: [["English"], ["فارسی"]],
    resize_keyboard: true,
    one_time_keyboard: true
  }
};

const getMainMenu = (lang) => ({
  reply_markup: {
    keyboard: [
      [lang === "en" ? "Run LayerEdge Bot" : "اجرای ربات LayerEdge"],
      [lang === "en" ? "Add Private Key" : "اضافه کردن کلید خصوصی"],
      [lang === "en" ? "Load Proxies" : "بارگذاری پروکسی‌ها"],
      [lang === "en" ? "Create New Wallet" : "ساخت کیف‌پول جدید"],
      [lang === "en" ? "Show Info" : "نمایش اطلاعات"],
      [lang === "en" ? "Change Language" : "تغییر زبان"],
      [lang === "en" ? "Exit" : "خروج"]
    ],
    resize_keyboard: true,
    one_time_keyboard: true
  }
});

const userLanguages = new Map();
let awaitingPrivateKey = false;
let allowedChatId = null;

const sendMessage = async (chatId, key, values = {}) => {
  const lang = userLanguages.get(chatId) || "en";
  const message = formatMessage(messages[lang][key], values);
  console.log(`Sending message to ${chatId}: ${message}`);
  try {
    await bot.sendMessage(chatId, message);
    console.log(`Message sent successfully to ${chatId}`);
  } catch (error) {
    console.error(`Failed to send message to ${chatId}: ${error.message}`);
  }
};

async function addPrivateKey(chatId, privateKey) {
  if (!privateKey.trim()) {
    await sendMessage(chatId, "privateKeyEmpty");
    return;
  }
  const cleanKey = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;
  if (cleanKey.length !== 64 || !/^[0-9a-fA-F]+$/.test(cleanKey)) {
    await sendMessage(chatId, "privateKeyInvalid");
    return;
  }
  const formattedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;

  try {
    const walletPath = path.join(__dirname, "wallets.json");
    let wallets = await readWallets();
    wallets.push({ privateKey: formattedKey });
    await fs.writeFile(walletPath, JSON.stringify(wallets, null, 2), "utf8");
    await sendMessage(chatId, "privateKeySuccess");
  } catch (error) {
    await sendMessage(chatId, "privateKeyFail", { error: error.message });
  }
}

async function loadProxiesFromProxyScrape(chatId) {
  const wallets = await readWallets();
  if (wallets.length === 0) {
    await sendMessage(chatId, "noWallets");
    return;
  }

  const minProxies = Math.max(3, wallets.length * 3);
  const batchSize = 50;
  let activeProxies = [];
  let fetchedProxies = [];
  let startIndex = 0;

  console.log(`Starting proxy load for chatId: ${chatId}, need ${minProxies} proxies`);
  await sendMessage(chatId, "clearingProxies");
  await sendMessage(chatId, "needProxies", { min: minProxies, wallets: wallets.length });

  while (activeProxies.length < minProxies) {
    const response = await axios.get(
      `https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all`
    );

    if (!response.data) {
      await sendMessage(chatId, "fetchFail");
      console.log("Failed to fetch proxies from ProxyScrape");
      return;
    }

    const allProxies = response.data.split("\n").filter(line => line.trim());
    fetchedProxies = allProxies.slice(startIndex, startIndex + batchSize);

    if (fetchedProxies.length === 0) {
      await sendMessage(chatId, "noMoreProxies");
      console.log("No more proxies available");
      break;
    }

    console.log(`Testing batch: ${startIndex} to ${startIndex + batchSize}`);
    await sendMessage(chatId, "testingBatch", { count: fetchedProxies.length, start: startIndex, end: startIndex + batchSize });
    const testResults = await Promise.all(fetchedProxies.map(proxy => testProxy(proxy)));
    const newActiveProxies = testResults
      .filter(result => result.isActive)
      .map(result => `http://${result.proxy}`);

    activeProxies = [...activeProxies, ...newActiveProxies];
    console.log(`Found ${newActiveProxies.length} active proxies, total: ${activeProxies.length}`);
    await sendMessage(chatId, "foundProxies", { count: newActiveProxies.length, total: activeProxies.length });

    startIndex += batchSize;

    if (activeProxies.length < minProxies) {
      await sendMessage(chatId, "needMoreProxies", { count: minProxies - activeProxies.length });
      await delay(1);
    }
  }

  if (activeProxies.length < minProxies) {
    await sendMessage(chatId, "proxiesNotEnough", { count: activeProxies.length, min: minProxies });
  } else {
    activeProxies = activeProxies.slice(0, minProxies);
    await sendMessage(chatId, "proxiesEnough", { count: activeProxies.length });
  }

  const proxyPath = path.join(__dirname, "proxies.txt");
  await fs.writeFile(proxyPath, activeProxies.join("\n"), "utf8");
  await sendMessage(chatId, "proxiesSaved", { count: activeProxies.length });
  console.log(`Saved ${activeProxies.length} proxies to proxies.txt`);
}

async function runLayerEdge(chatId) {
  await sendMessage(chatId, "startBot");

  const wallets = await readWallets();
  const proxies = await readProxies();

  if (wallets.length === 0) {
    await sendMessage(chatId, "noWallets");
    return;
  }
  if (proxies.length === 0) {
    await sendMessage(chatId, "noProxies");
    return;
  }
  if (proxies.length < wallets.length) {
    await sendMessage(chatId, "notEnoughProxies", { proxies: proxies.length, wallets: wallets.length });
    return;
  }

  const accountCount = wallets.length;
  await sendMessage(chatId, "processing", { count: accountCount, plural: accountCount > 1 ? "s" : "" });

  const proxyGroups = [];
  for (let i = 0; i < proxies.length; i += 3) {
    if (i + 2 < proxies.length) {
      proxyGroups.push([proxies[i], proxies[i + 1], proxies[i + 2]]);
    } else if (i + 1 < proxies.length) {
      proxyGroups.push([proxies[i], proxies[i + 1]]);
    } else {
      proxyGroups.push([proxies[i]]);
    }
  }

  let walletInfo = [];

  for (let i = 0; i < accountCount; i++) {
    await sendMessage(chatId, "accountDivider");
    await sendMessage(chatId, "accountInfo", { current: i + 1, total: accountCount, wallet: wallets[i].privateKey.slice(0, 10) });

    const currentProxies = proxyGroups[i] || [];
    let success = false;

    for (let j = 0; j < Math.min(3, currentProxies.length); j++) {
      await sendMessage(chatId, "tryingProxy", { current: j + 1, total: currentProxies.length, proxy: currentProxies[j] });
      const bot = new LayerEdgeBot(currentProxies[j], wallets[i].privateKey, REF_CODE);

      try {
        const startTime = Date.now();
        await sendMessage(chatId, "registerStart", { time: startTime });
        const registered = await bot.registerWallet();
        await sendMessage(chatId, "registerDone", { time: Date.now(), duration: Date.now() - startTime });
        if (registered) {
          await sendMessage(chatId, "registerSuccess");
          success = true;
        } else {
          await sendMessage(chatId, "registerFail");
          continue;
        }

        await delay(2);
        const checkInStart = Date.now();
        await sendMessage(chatId, "checkInStart", { time: checkInStart });
        const checkInResult = await bot.dailyCheckIn();
        await sendMessage(chatId, "checkInDone", { time: Date.now(), duration: Date.now() - checkInStart });
        if (checkInResult) {
          if (checkInResult.alreadyDone) {
            await sendMessage(chatId, "checkInAlready", { nextTime: checkInResult.nextTime });
          } else {
            await sendMessage(chatId, "checkInSuccess");
          }
        }

        await delay(2);
        const connectStart = Date.now();
        await sendMessage(chatId, "connectStart", { time: connectStart });
        const nodeConnected = await bot.connectNode();
        await sendMessage(chatId, "connectDone", { time: Date.now(), duration: Date.now() - connectStart });
        if (nodeConnected) await sendMessage(chatId, "connectSuccess");

        await delay(2);
        const pointsStart = Date.now();
        await sendMessage(chatId, "pointsStart", { time: pointsStart });
        const points = await bot.checkPoints();
        await sendMessage(chatId, "pointsDone", { time: Date.now(), duration: Date.now() - pointsStart });
        if (points !== null) {
          await sendMessage(chatId, "pointsSuccess");
          await sendMessage(chatId, "pointsInfo", { address: bot.wallet.address, points });
          walletInfo.push({ address: bot.wallet.address, points });
        }

        await sendMessage(chatId, "accountSuccess", { current: i + 1, proxy: currentProxies[j] });
        break;
      } catch (error) {
        await sendMessage(chatId, "proxyFail", { proxy: currentProxies[j], error: error.message });
        if (j === Math.min(2, currentProxies.length - 1)) {
          await sendMessage(chatId, "allProxiesFail", { wallet: wallets[i].privateKey.slice(0, 10) });
        }
      }
    }

    if (!success) {
      await sendMessage(chatId, "skipAccount", { current: i + 1 });
    }
  }

  await saveWalletInfo(walletInfo);
  await sendMessage(chatId, "accountDivider");
  await sendMessage(chatId, "done", { count: accountCount, plural: accountCount > 1 ? "ها" : "" });
  await sendMessage(chatId, "runAgain");
}

async function createAndRunWallet(chatId) {
  await sendMessage(chatId, "newWallet");

  const randomEntropy = randomBytes(16);
  const newWallet = Wallet.createRandom({ extraEntropy: randomEntropy });
  const privateKey = newWallet.privateKey;
  const address = newWallet.address;

  await sendMessage(chatId, "walletCreated", { address });

  const wallets = await readWallets();
  wallets.push({ privateKey });
  const walletPath = path.join(__dirname, "wallets.json");
  await fs.writeFile(walletPath, JSON.stringify(wallets, null, 2), "utf8");
  await sendMessage(chatId, "walletAdded");

  const proxies = await readProxies();
  if (proxies.length === 0) {
    await sendMessage(chatId, "noProxies");
    return;
  }
  const proxy = proxies[Math.min(wallets.length - 1, proxies.length - 1)];
  const bot = new LayerEdgeBot(proxy, privateKey, REF_CODE);

  await sendMessage(chatId, "accountDivider");
  await sendMessage(chatId, "accountInfo", { current: 1, total: 1, wallet: privateKey.slice(0, 10) });

  const registered = await bot.registerWallet();
  if (registered) await sendMessage(chatId, "registerSuccess");

  await delay(2);
  const checkInResult = await bot.dailyCheckIn();
  if (checkInResult) {
    if (checkInResult.alreadyDone) {
      await sendMessage(chatId, "checkInAlready", { nextTime: checkInResult.nextTime });
    } else {
      await sendMessage(chatId, "checkInSuccess");
    }
  }

  await delay(2);
  const nodeConnected = await bot.connectNode();
  if (nodeConnected) await sendMessage(chatId, "connectSuccess");

  await delay(2);
  const points = await bot.checkPoints();
  if (points !== null) {
    await sendMessage(chatId, "pointsSuccess");
    await sendMessage(chatId, "pointsInfo", { address, points });
    const walletInfo = await readWalletInfo();
    walletInfo.push({ address, points });
    await saveWalletInfo(walletInfo);
  }

  await sendMessage(chatId, "accountSuccess", { current: 1, proxy });
}

async function showWalletInfo(chatId) {
  const walletInfo = await readWalletInfo();

  if (walletInfo.length === 0) {
    await sendMessage(chatId, "noWalletsInfo");
    return;
  }

  let details = "";
  walletInfo.forEach((wallet, index) => {
    details += `Wallet ${index + 1}:\nAddress: ${wallet.address}\nPoints: ${wallet.points}\n\n`;
  });

  await sendMessage(chatId, "info", { total: walletInfo.length, details });
}

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const lang = userLanguages.get(chatId) || "en";

  console.log(`Received message: ${text} from chatId: ${chatId}`);

  checkOwnership();

  if (!allowedChatId && text !== "/start") {
    await sendMessage(chatId, "startOnly");
    return;
  }

  if (awaitingPrivateKey && chatId === allowedChatId) {
    awaitingPrivateKey = false;
    await addPrivateKey(chatId, text);
    await bot.sendMessage(chatId, messages[lang].next, getMainMenu(lang));
    return;
  }

  switch (text) {
    case "/start":
      allowedChatId = chatId;
      await bot.sendMessage(chatId, messages[lang].langPrompt, languageMenu);
      break;
    case "English":
      if (chatId === allowedChatId) {
        userLanguages.set(chatId, "en");
        await bot.sendMessage(chatId, messages.en.welcome, getMainMenu("en"));
      }
      break;
    case "فارسی":
      if (chatId === allowedChatId) {
        userLanguages.set(chatId, "fa");
        await bot.sendMessage(chatId, messages.fa.welcome, getMainMenu("fa"));
      }
      break;
    case "Change Language":
    case "تغییر زبان":
      if (chatId === allowedChatId) {
        await bot.sendMessage(chatId, messages[lang].langPrompt, languageMenu);
      }
      break;
    case "Run LayerEdge Bot":
    case "اجرای ربات LayerEdge":
      if (chatId === allowedChatId) {
        await runLayerEdge(chatId);
        await bot.sendMessage(chatId, messages[lang].next, getMainMenu(lang));
      }
      break;
    case "Add Private Key":
    case "اضافه کردن کلید خصوصی":
      if (chatId === allowedChatId) {
        awaitingPrivateKey = true;
        await sendMessage(chatId, "privateKeyPrompt");
      }
      break;
    case "Load Proxies":
    case "بارگذاری پروکسی‌ها":
      if (chatId === allowedChatId) {
        console.log(`Starting Load Proxies for chatId: ${chatId}`);
        await loadProxiesFromProxyScrape(chatId);
        await bot.sendMessage(chatId, messages[lang].next, getMainMenu(lang));
      }
      break;
    case "Create New Wallet":
    case "ساخت کیف‌پول جدید":
      if (chatId === allowedChatId) {
        await createAndRunWallet(chatId);
        await bot.sendMessage(chatId, messages[lang].next, getMainMenu(lang));
      }
      break;
    case "Show Info":
    case "نمایش اطلاعات":
      if (chatId === allowedChatId) {
        await showWalletInfo(chatId);
        await bot.sendMessage(chatId, messages[lang].next, getMainMenu(lang));
      }
      break;
    case "Exit":
    case "خروج":
      if (chatId === allowedChatId) {
        await sendMessage(chatId, "goodbye");
        process.exit(0);
      }
      break;
    default:
      if (chatId === allowedChatId) {
        await bot.sendMessage(chatId, messages[lang].unknown, getMainMenu(lang));
      }
  }
});

console.log("Telegram Bot is running...");