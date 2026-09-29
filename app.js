const express = require('express');

const app = express();

require('dotenv').config();
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const sequelize = require('./config/database');
require('./cron');
const { errorMessage } = require('./response_message/message');
const { statusCodes } = require('./utils/commonVars');
const UserMaster = require('./models/userMaster');
const UserChats = require('./models/userChats');
const { sendNotification } = require('./utils/commonUtilFunctions');
const { initialiseChatbotSocket } = require('./socket/chatbot');
const { verifyAuthForSocket } = require('./middleware/socketAuth');
const { changeOnlineStatus, sendNotificationToInactiveUser } = require('./socket/tracking.utils')
const {
  scheduleNotifications,
} = require('./controllers/punchInOutNotificationSchedule.controller');
const { scheduleMail } = require('./controllers/autoMailSchedule.controller');
const port = 3000;
const socketport = 3210;
// const port = 3500;
// const socketport = 3510;
const path = require('path');
const { ProjectName } = require('./utils/labelUtils');
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(bodyParser.json({ limit: '500mb' }));
app.use(express.json());
app.use(
  bodyParser.urlencoded({
    limit: '500mb',
    extended: true,
    parameterLimit: 50000,
  })
);
app.use(express.static('public'));
app.use(morgan('combined'));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});
app.use(
  '/bootstrap',
  express.static(`${__dirname}/node_modules/bootstrap/dist`)
);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/css', express.static(path.join(__dirname, 'css')));

app.use(
  '/.well-known/acme-challenge',
  express.static('.well-known/acme-challenge')
);

require('./router')(app);

app.use((error, req, res, next) => {
  console.log('Error in middleware ==>', error);
  const status = error.statusCode || statusCodes.INTERNAL_SERVER;
  const message = error.message || errorMessage.INTERNAL_SERVER_ERROR;
  return res.status(status).json({ status, message });
});

app.get('/', (req, res) => {
  res.json({ message: `'Welcome to ${ProjectName}` });
});

const clients = {};
const userListClients = {};
const trackingUserList = {};

sequelize
  .authenticate()
  //.sync()
  .then((result) => {
    app.listen(port);
    console.log(
      'Database connection is established and app is now running on port:',
      port
    );
  })
  .catch((err) => {
    console.log('error connecting to database', Date.now());
    console.log(err);
  });

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.use(verifyAuthForSocket).on('connection', (socket) => {
  console.log(socket.id, 'has joined');

  socket.on('register', async (user) => {
    console.log("User Added in tracking list :", user.userId, socket.id)

    const socketIds = Object.keys(trackingUserList).filter(
      key => trackingUserList[key] === user.userId
    );
    delete trackingUserList[socketIds];

    trackingUserList[socket.id] = user.userId;
    await changeOnlineStatus(user.userId, 1); // Update isOnline to 1
  });

  socket.on('punch_out', async (user) => {
    console.log("User Deleted from tracking list :", user.userId)
    delete trackingUserList[socket.id];
    await changeOnlineStatus(user.userId, 0);
  });

  socket.on('chatbot', async (message) =>
    initialiseChatbotSocket(socket, message)
  );

  socket.on('signin', (id) => {
    console.log(`Socket :: App.js :: socket.on('signin') :: In listening event with data (id : ${id})`);
    clients[id] = socket;
  });

  socket.on('listSignin', async (id) => {
    userListClients[id] = socket;
  });

  socket.on('deleteMessage', (msg) => {
    console.log(msg);
    const { targetId } = msg;
    if (clients[targetId]) {
      clients[(console.log('sending delete msg '), targetId)].emit(
        'deleteMessage',
        msg
      );
    }
  });

  socket.on('message', async (msg) => {
    console.log(msg);
    const { targetId } = msg;
    if (clients[targetId]) {
      clients[(console.log('sending msg '), targetId)].emit('message', msg);
      console.log('calling func', msg.senderId, targetId);
      const updatetoseen = async () => {
        await UserChats.update(
          {
            msgstatus: 2,
          },
          {
            where: {
              senderID: msg.senderId,
              receiverID: targetId,
            },
          }
        );
      };
      updatetoseen();
    } else if (userListClients[targetId]) {
      userListClients[(console.log('sending list msg '), targetId)].emit(
        'message',
        msg
      );

      const getSender = await UserMaster.findOne({
        raw: true,
        where: {
          userMasterID: msg.senderId,
          status: 1,
        },
      });
      let name = '';
      if (getSender) {
        name = getSender.displayName;
      }
      const notification = {
        title: name,
        body: msg.message,
        // // isScheduled:true,
        // scheduledTime: new Date().toISOString(),
      };
      const data = {
        screen: 'chat',
        senderID: msg.senderId.toString(),
        isScheduled: String(true),
        scheduledTime: new Date().toISOString(),
      };
      await sendNotification(targetId, notification, data);
    } else {
      const getSender = await UserMaster.findOne({
        raw: true,
        where: {
          userMasterID: msg.senderId,
          status: 1,
        },
      });
      let name = '';
      if (getSender) {
        name = getSender.displayName;
      }
      const notification = {
        title: name,
        body: msg.message,
        // // isScheduled:true,
        // scheduledTime: new Date().toISOString(),
      };
      const data = {
        screen: 'chat',
        senderID: msg.senderId.toString(),
        isScheduled: String(true),
        scheduledTime: new Date().toISOString(),
      };
      await sendNotification(targetId, notification, data);
    }
  });

  socket.on('listDisconnect', (id) => {
    console.log('got list event', id);
    const clientId = Object.keys(userListClients).find(
      (id) => userListClients[id] === socket
    );

    if (clientId) {
      delete userListClients[clientId];
      console.log('Client disconnected:', clientId);
    }
  });

  socket.on("disconnect", async () => {

    if (trackingUserList[socket.id]) {
      console.log("User Disconnect :", socket.id)
      const userId = trackingUserList[socket.id];
      delete trackingUserList[socket.id];
      const res = await changeOnlineStatus(userId, 0);
      if (res) {
        sendNotificationToInactiveUser(userId);
      }
    }

    const clientId = Object.keys(clients).find((id) => clients[id] === socket);
    if (clientId) {
      delete clients[clientId];
      console.log('Client disconnected:', clientId);
    }
  });
});

server.listen(socketport, '0.0.0.0', async () => {
  if (process.env.NODE_ENV === 'production') {
    await scheduleNotifications();
    await scheduleMail();
  }
  console.log(`server started on `, socketport);
  console.log(`Number of crons setup ${cron.getTasks().size}`);
  console.log('List of scheduled crons: ');
  cron.getTasks().forEach((e) => {
    console.log(e.options.name);
  });
});
