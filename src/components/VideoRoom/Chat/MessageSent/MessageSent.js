// style
import { useEffect, useRef, useState } from 'react';
import Style from './MessageSent.module.css';

// prime icons
import { PrimeIcons } from 'primereact/api';

import 'primeicons/primeicons.css';


const MessageSent = ({message, sendAgain}) => {

    const messageId = message.id;
    const messageContent = message.content;

    // reference to message status
    const messageStatusRef = useRef(message.status);

    // couldn't send message aler
    const [showAlert, setShowAlert] = useState(false);

    // track message status
    useEffect(() => {
        messageStatusRef.current = message.status;
    }, [message.status]);

    useEffect(() => {
        // when component mounts aka when message is created and sent

        let elapsedTime = 0;

        // resending message

        // settings - interval and timeout
        let interval = 2000;
        let timeout = 20000;

        // initial wait time before resending message
        setTimeout(() => {
        }, 2000);
        // if message is pending, resend message each [interval] seconds during [timeout] seconds
        if (message.status === 'pending') {
            const intervalId =  setInterval(() => {
                
                // increment elapsed time
                elapsedTime += 2000;

                // if message is still pending, resend message
                if (messageStatusRef.current === 'pending') {
                    console.log('resending message...');
                    handleSendAgain();
                }
                
                // if message is delivered or timeout is reached, stop resending message
                if(elapsedTime >= timeout || messageStatusRef.current === 'delivered') {
                    clearInterval(intervalId);
                    if(elapsedTime >= timeout) {
                        setShowAlert(true);
                        console.log('failed to deliver message');
                    }
                    if(messageStatusRef.current === 'delivered') {
                        setShowAlert(false);
                        console.log('message delivered successfully');
                    }
                }
            }, interval);
        }
    }, []);

    // handle sending message
    const handleSendAgain = () => {
        const time = new Date();
        
        // format time to HH:MM
        const formattedTime = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;

        const msg = {
            type: 'sender',
            status: 'pending',
            content: messageContent,
            id: messageId, 
            time: formattedTime
        }

        // send message
        sendAgain({
            type: 'chat-message',
            msg
        });
    }

    return (  
        <div className={Style.MessageContainer}>
            {showAlert && <i className={`pi pi-exclamation-circle ${Style.AlertCustom}`} />}
            <div className={Style.MessageContent}>
                <div className={Style.MessageText}>{message.content}</div>
                <div className={Style.MessageStatusBar}>
                    <div className={Style.MessageStatus}>{message.status}</div>
                    <div className={Style.MessageTime}>{message.time}</div>
                </div>
            </div>
        </div>
    );
}
 
export default MessageSent;