import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  IconButton,
  Typography,
  AppBar,
  Toolbar
} from '@mui/material';

import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
const API = process.env.REACT_APP_API_URL;

const drawerWidth = 350;

const Home = () => {
  const { currentUser, logout } = useAuth();
  const socket = useSocket();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);

useEffect(() => {
  const loadData = async () => {
    try {
      const chatsRes = await axios.get(`${API}/api/chats`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      setChats(chatsRes.data);

      const usersRes = await axios.get(`${API}/api/users`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  loadData();
}, [currentUser.token]);

  useEffect(() => {
    if (socket && selectedChat) {
      socket.emit('joinRoom', selectedChat._id);
      
      socket.on('receiveMessage', (message) => {
        if (message.chat === selectedChat._id) {
          setMessages(prev => [...prev, message]);
        }
      });
    }
  }, [socket, selectedChat]);

const fetchChats = async () => {
  try {
    const response = await axios.get(`${API}/api/chats`, {
      headers: { Authorization: `Bearer ${currentUser.token}` }
    });
    setChats(response.data);
  } catch (error) {
    console.error('Error fetching chats:', error);
  }
};


  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

const fetchMessages = async (chatId) => {
  try {
    const response = await axios.get(`${API}/api/messages/${chatId}`, {
      headers: { Authorization: `Bearer ${currentUser.token}` }
    });
    setMessages(response.data);
  } catch (error) {
    console.error('Error fetching messages:', error);
  }
};

  const startChat = async (userId) => {
  try {
    const response = await axios.post(`${API}/api/chats`, {
      participantId: userId
    }, {
      headers: { Authorization: `Bearer ${currentUser.token}` }
    });
    
    setChats(prev => [response.data, ...prev]);
    setSelectedChat(response.data);
    fetchMessages(response.data._id);
  } catch (error) {
    console.error('Error starting chat:', error);
  }
};


 const sendMessage = async () => {
  if (!newMessage.trim() || !selectedChat) return;

  try {
    const response = await axios.post(`${API}/api/messages`, {
      chatId: selectedChat._id,
      content: newMessage
    }, {
      headers: { Authorization: `Bearer ${currentUser.token}` }
    });

    const message = response.data;
    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    if (socket) {
      socket.emit('sendMessage', {
        chatId: selectedChat._id,
        ...message
      });
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
};


  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    fetchMessages(chat._id);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <AppBar position="static" color="primary">
          <Toolbar>
            <Avatar sx={{ mr: 2 }}>
              {currentUser?.name?.charAt(0)}
            </Avatar>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              WhatsApp Lite
            </Typography>
            <IconButton color="inherit" onClick={logout}>
              <MoreVertIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search or start new chat"
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Box>

        <List>
          {users.map((user) => (
            <ListItem 
              button 
              key={user._id}
              onClick={() => startChat(user._id)}
            >
              <ListItemAvatar>
                <Avatar>
                  {user.name?.charAt(0)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={user.name}
                secondary={user.status}
              />
            </ListItem>
          ))}
        </List>

        <Typography variant="subtitle1" sx={{ p: 2, fontWeight: 'bold' }}>
          Chats
        </Typography>
        
        <List>
          {chats.map((chat) => (
            <ListItem 
              button 
              key={chat._id}
              selected={selectedChat?._id === chat._id}
              onClick={() => handleChatSelect(chat)}
            >
              <ListItemAvatar>
                <Avatar>
                  {chat.isGroupChat ? 
                    'G' : 
                    chat.participants.find(p => p._id !== currentUser.id)?.name?.charAt(0)
                  }
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={chat.isGroupChat ? 
                  chat.groupName : 
                  chat.participants.find(p => p._id !== currentUser.id)?.name
                }
                secondary={chat.lastMessage?.content || 'No messages yet'}
              />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Chat Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <AppBar position="static" color="default" elevation={1}>
              <Toolbar>
                <ListItemAvatar>
                  <Avatar>
                    {selectedChat.isGroupChat ? 
                      'G' : 
                      selectedChat.participants.find(p => p._id !== currentUser.id)?.name?.charAt(0)
                    }
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={selectedChat.isGroupChat ? 
                    selectedChat.groupName : 
                    selectedChat.participants.find(p => p._id !== currentUser.id)?.name
                  }
                  secondary="Online"
                  sx={{ flexGrow: 1 }}
                />
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              </Toolbar>
            </AppBar>

            {/* Messages */}
            <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto', bgcolor: '#efeae2' }}>
              {messages.map((message) => (
                <Box
                  key={message._id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.sender._id === currentUser.id ? 'flex-end' : 'flex-start',
                    mb: 2
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: message.sender._id === currentUser.id ? '#dcf8c6' : 'white',
                      borderRadius: 2,
                      p: 2,
                      maxWidth: '60%',
                      boxShadow: 1
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {message.sender.name}
                    </Typography>
                    <Typography variant="body1">
                      {message.content}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'right' }}>
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Message Input */}
            <Box sx={{ p: 2, bgcolor: 'white', borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Type a message"
                  variant="outlined"
                  size="small"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <IconButton 
                  color="primary" 
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </>
        ) : (
          <Box sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            bgcolor: '#f0f2f5'
          }}>
            <Typography variant="h6" color="text.secondary">
              Select a chat to start messaging
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Home;