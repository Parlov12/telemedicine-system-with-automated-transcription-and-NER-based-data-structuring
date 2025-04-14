// send data message
const sendData = (dataConnection, data) => {
    if (dataConnection && dataConnection.open) {
      try {
        dataConnection.send(data);
        console.log('Sent data: ', data);
      } catch (error) {
        console.log('Error while sending data message!\nError: ', error);
      }

    } else {
      console.log('Data connection is not open!');
    }
}

export { sendData }