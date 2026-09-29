const WebSocket = require('ws');

exports.addDataToBiometric = (req, res) => {
  console.log(
    '********************************************************************************************************'
  );
  const users = req.body;

  if (!Array.isArray(users)) {
    return res
      .status(400)
      .send({ error: 'Request body should be an array of user objects' });
  }

  const results = [];
  let processedCount = 0;
  let responseSent = false;

  users.forEach((user, index) => {
    let { sn, UserName, enrollid } = user;

    if (!UserName || !enrollid || (!sn && !Array.isArray(sn))) {
      results[index] = {
        error:
          'sn (array or string), UserName, and enrollid are required fields',
      };
      processedCount++;
      if (processedCount === users.length) {
        if (!responseSent) {
          responseSent = true;
          res.status(400).send(results);
        }
      }
      return;
    }

    if (!Array.isArray(sn)) {
      sn = [sn]; // Convert single sn to array for uniform processing
    }

    sn.forEach((serialNumber, snIndex) => {
      console.log('sn number', serialNumber);
      console.log('User name', UserName);
      console.log('enroll id', enrollid);

      const ws = new WebSocket('ws://103.240.90.80:7788');

      ws.on('open', function open() {
        const message = {
          ret: 'setusername',
          sn: serialNumber,
          result: 'True',
          UserName: UserName,
          enrollid: enrollid,
        };
        ws.send(JSON.stringify(message));

        // Send response immediately after message is sent
        if (!responseSent) {
          responseSent = true;
          res
            .status(200)
            .send({ status: 200, message: 'Message sent successfully' });
        }
      });

      ws.on('message', function message(data) {
        console.log(`Received: ${data}`);
        results.push({ sn: serialNumber, received: data });
        ws.close();
        processedCount++;
        if (processedCount === users.length * sn.length) {
          if (!responseSent) {
            responseSent = true;
            res.send(results);
          }
        }
      });

      ws.on('error', function error(error) {
        console.error(`WebSocket Error: ${error.message}`);
        results.push({ sn: serialNumber, error: 'WebSocket error' });
        processedCount++;
        if (processedCount === users.length * sn.length) {
          if (!responseSent) {
            responseSent = true;
            res.status(500).send(results);
          }
        }
      });

      ws.on('close', function close() {
        console.log('WebSocket connection closed');
      });
    });
  });
};

