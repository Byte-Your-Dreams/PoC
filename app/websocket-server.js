const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

// Supabase 配置
const SUPABASE_URL = 'http://localhost:8000';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzM0NDc2NDAwLAogICJleHAiOiAxODkyMjQyODAwCn0.sAKa6ugHybSJQzPFpNyeglJdRBxHQ8l-A7Sj6fXH5X8';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 本地 LLM 调用函数（模拟流式返回）
async function generateAnswer(question, onChunk) {
  // 模拟流式回答
  const words = `This is the answer to: ${question}`.split(' ');
  for (const word of words) {
    onChunk(word); // 每个词作为一个流块发送
    await new Promise((resolve) => setTimeout(resolve, 200)); // 模拟延迟
  }
}

// WebSocket 服务器
const wss = new WebSocket.Server({ port: 3050 });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    console.log('Received from client:', message);
  });
});

supabase
  .channel('realtime:questions_answers') // 创建频道
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'questions_answers' }, // 监听 INSERT 事件
    async (payload) => {
      const question = payload.new.question;
      console.log('New question received:', question);

      // 通知所有 WebSocket 客户端
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          // 流式返回回答
          generateAnswer(question, (chunk) => {
            client.send(JSON.stringify({ answerChunk: chunk }));
          });
        }
      });
    }
  )
  .subscribe(); // 注意：v2 的订阅方法为 subscribe
console.log('WebSocket server running on ws://localhost:3050');
