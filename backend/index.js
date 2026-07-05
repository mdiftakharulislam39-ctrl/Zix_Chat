const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

app.get('/', (req, res) => {
  res.send('Zix_Chat server is running!');
});

io.on('connection', async (socket) => {
  console.log('A user connected:', socket.id);

  const { data: oldMessages, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error.message);
  } else {
    socket.emit('load_old_messages', oldMessages);
  }

  socket.on('send_message', async (data) => {
    const { error: insertError } = await supabase
      .from('messages')
      .insert([
        {
          sender_username: data.username,
          receiver_username: data.receiver || 'all',
          message_text: data.text
        }
      ]);

    if (insertError) {
      console.error('Error saving message:', insertError.message);
    }

    io.emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));