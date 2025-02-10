const puppeteer = require("puppeteer");
const { test, describe, expect, beforeAll, afterAll } = require('@jest/globals');
const TIMEOUT = 3000;

// si potrebbe fare un dizionario con i selettori per non ripeterli


function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve("done")
        }, ms)
    })
}

async function getTotalConversations(page){ // CHECK CON LE MODIFICHE DI YIXIN
    let conversations = await page.$$('li.chat_conversationItem__NC6TC');
    return conversations.length;
}; 

async function doesConversationExist(page, type, index){ // CHECK CON LE MODIFICHE DI YIXIN
    try {
        const response = await page.goto(`${type}_${index}`, { waitUntil: 'networkidle2' });
        if (response.status() === 200) {
            return true;
        };
    } catch (error) {
        console.error('Error checking URL:', error);
        return false;
    }
};

async function goToConversation(page, type, index){ // CHECK CON LE MODIFICHE DI YIXIN
    await page.goto(`${type}_${index}`, { waitUntil: 'networkidle2' });
    return;
}; 

async function sendMessage(page, msg){ // TODO
    if (msg == "") {
        throw new Error('Empty message');
    }
    if (msg.length > 1000) {
        throw new Error('Message too long');
    }


};

async function getTotalMessagesIn(page, type, index){   // CHECK CON LE MODIFICHE DI YIXIN
    await page.goto(`${type}_${index}`, { waitUntil: 'networkidle2' });
    let messages = await page.$$('body > div > div > div.chat_chatMessages__qIU_S > div');
    return messages.length;
}

async function checkConversationTitle(page, type, index){
    await page.goto(`${type}_${index}`, { waitUntil: 'networkidle2' });
    await page.waitForSelector(`li.chat_conversationItem__NC6TC:nth-child(${index}) > div > h3`);
    let title = await getText(page, `li.chat_conversationItem__NC6TC:nth-child(${index}) > div > h3`);
    return title;
};

async function checkIfMessageIsSent(page, type, index){
    let tot = await getTotalMessagesIn(page, type, index);
    await page.waitForSelector(`body > div > div > div.chat_chatMessages__qIU_S > div:nth-child(${tot - 1})`);
    let message = await getText(page, `body > div > div > div.chat_chatMessages__qIU_S > div:nth-child(${tot - 1})`);
    return message;
};

async function getIfMessageIsNotPlaceholder(page, index){ // CHECK CON LE MODIFICHE DI YIXIN
    await page.waitForSelector(`body > div > div > div.chat_chatMessages__qIU_S > div:nth-child(${index * 2})`); 
    let placeholder = await getText(page, `body > div > div > div.chat_chatMessages__qIU_S > div:nth-child(${index * 2})`);
    return placeholder;
}; 

async function createConversation(page){ // CHECK CON LE MODIFICHE DI YIXIN
    await page.waitForSelector('body > div > nav > button');
    await clickBySelector(page, 'body > div > nav > button');
    await delay(3000);
};

async function clickBySelector(page, selector) {
    await page.waitForSelector(selector);
    await page.click(selector);
}

async function typeText(page, selector, text) {
    await page.waitForSelector(selector);
    await page.type(selector, text);
}

async function getText(page, selector) {
    await page.waitForSelector(selector);
    let text = await page.$eval(selector, el => el.textContent.trim()); 
    return text;
}

async function amIlogged(page) {
    try {
        await page.waitForSelector('body > nav > ul > li:nth-child(3) > button', { timeout: 10000 });
        let loggedElement = await getText(page, 'body > nav > ul > li:nth-child(3) > button');

        console.log(`Found button with text: ${loggedElement}`);

        if (!loggedElement) {
            throw new Error('Button element not found');
        } else if (loggedElement.trim().includes("Sign In")) {
            console.log("you're NOT logged");
            return false;
        } else if (loggedElement.trim().includes("Sign Out")) {
            console.log("you're logged");
            return true;
        } else {
            throw new Error(`Unexpected button text: ${loggedElement}`);
        }
    } catch (error) {
        console.error('Error in amIlogged:', error);
        throw error;
    }
}

async function login(page, username, password) {
    if (await amIlogged(page)) {
        console.log('Already logged');
        return;
    } else {
        //Click on the Sign In button
        await clickBySelector(page, 'body > nav > ul > li:nth-child(3) > a > button');
        await delay(5000);

        //Type the login credentials
        await typeText(page, 'body > div > form > input:nth-child(2)', username);
        await delay(3000);
        await typeText(page, 'body > div > form > input:nth-child(3)', password);
        await delay(3000);

        //Click on the login button
        await clickBySelector(page, 'body > div > form > button');
        await delay(3000);
    }
}

// npm run test:e2e
describe('End-to-End Test', () => {
    let browser;
    let page;

    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--disable-web-security', '--no-sandbox', '--disable-setuid-sandbox']
        });

        page = await browser.newPage();
        await page.setViewport({ width: 0, height: 0 });
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36");

        await page.goto('http://localhost:3000', {
            waitUntil: "networkidle0",
        });

        console.log('browser connected');
    }, TIMEOUT);

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });
    
    test('should get total conversations', async () => {
        let totalConversations = await getTotalConversations(page);
        expect(totalConversations).toBeGreaterThan(0);
    }, TIMEOUT);

    test('should go to conversation', async () => { // CHECK CON LE MODIFICHE DI YIXIN
        await goToConversation(page, 'Libera', 1);
        let title = await checkConversationTitle(page, 'Libera', 1);
        expect(title).toBe('Libera 1');
    }, TIMEOUT);

    test('should send a message', async () => { 
        await sendMessage(page, 'Hello, World!');
        let message = await checkIfMessageIsSent(page, 'Libera', 1);
        expect(message).toBe('Hello, World!');
    }, TIMEOUT);

    test('should get total messages in conversation', async () => {
        let totalMessages = await getTotalMessagesIn(page, 'Libera', 1);
        expect(totalMessages).toBeGreaterThan(0);
    }, TIMEOUT);

    test('should check if message is not placeholder', async () => {
        let placeholder = await getIfMessageIsNotPlaceholder(page, 1);
        expect(placeholder).not.toBe('Inserisci un messaggio...');
    }, TIMEOUT);

    test('should display the logo image', async () => {
        console.log('starting test');
        await page.waitForSelector('img.Navigator_logoImage__XobIg');
        const imgAlt = await page.$eval('img.Navigator_logoImage__XobIg', el => el.alt);
        const imgSrc = await page.$eval('img.Navigator_logoImage__XobIg', el => el.src);
        console.log(`imgAlt: ${imgAlt}`);
        console.log(`imgSrc: ${imgSrc}`);
        expect(imgAlt).toBe("Logo");
        expect(imgSrc).toContain("/images/logos/vimar-neg.svg");
    }, TIMEOUT);

    test('should display the Dashboard link', async () => {
        console.log('starting test');
        await page.waitForSelector('a.Navigator_navLink__3oRrq[href="/login"]');
        const dashboardLinkText = await page.$eval('a.Navigator_navLink__3oRrq[href="/login"]', el => el.textContent.trim());
        const dashboardLinkHref = await page.$eval('a.Navigator_navLink__3oRrq[href="/login"]', el => el.href);
        console.log(`dashboardLinkText: ${dashboardLinkText}`);
        console.log(`dashboardLinkHref: ${dashboardLinkHref}`);
        expect(dashboardLinkText).toBe("Dashboard");
        expect(dashboardLinkHref).toContain("/login");
    }, TIMEOUT);

    test('should display the Sign In button', async () => {
        await page.waitForSelector('button.Navigator_loginButton__9IIom');
        const signOutButtonText = await page.$eval('button.Navigator_loginButton__9IIom', el => el.textContent.trim());
        expect(signOutButtonText).toBe("Sign In");
    }, TIMEOUT);

    test('should display the new conversation button', async () => {
        await page.waitForSelector('button.chat_newConversationButton__rCG0I');
        const newConversationButtonText = await page.$eval('button.chat_newConversationButton__rCG0I', el => el.textContent.trim());
        expect(newConversationButtonText).toBe("Nuova Conversazione");
    }, TIMEOUT);

    test('should display the active conversation', async () => {
        await page.waitForSelector('li.chat_conversationItem__NC6TC');
        const activeConversationText = await page.$eval('li.chat_conversationItem__NC6TC', el => el.textContent.trim());
        expect(activeConversationText).toBe("Libera 1");
    }, TIMEOUT);

    test('should display the input field with placeholder', async () => {
        await page.waitForSelector('input.chat_inputField__HurbO');
        const inputPlaceholder = await page.$eval('input.chat_inputField__HurbO', el => el.placeholder);
        expect(inputPlaceholder).toBe("Inserisci un messaggio...");
    }, TIMEOUT);

    test('should display the send button', async () => {
        await page.waitForSelector('button.chat_sendButton___VlaD');
        const sendButtonText = await page.$eval('button.chat_sendButton___VlaD', el => el.textContent.trim());
        expect(sendButtonText).toBe("Invia");
    }, TIMEOUT);
    
    test('should create a new conversation', async () => {

        let conversationCounterBefore = await getTotalConversations(page);
        await createConversation(page);
        let conversationCounterAfter = await getTotalConversations(page);

        if(conversationCounterBefore == conversationCounterAfter){
            throw new Error('Conversation not created');
        }

        expect(conversationCounterAfter).toBe(conversationCounterBefore + 1);
    }, TIMEOUT);

    test('should check if Libera 1 conversation exists', async () => {  // DOVREBBE FUNZIONARE CON LE MODIFICHE DI YIXIN
        let conversationExists = await doesConversationExist(page, 'Libera', 1);
        expect(conversationExists).toBe(true);
    }, TIMEOUT);

    test('should Log In', async () => {         // DA MODIFICARE UNA VOLTA COLLEGATO IL DB
        if (await amIlogged(page)) {
            console.log('Already logged');
            return;
        } else {
            try {
                await login(page, 'admin', '1234567');
                await delay(3000);
                expect(await amIlogged(page)).toBe(true);
            } catch (error) {
                console.error('Error in login:', error);
                throw error;
            }
        }
    }, TIMEOUT);
});
