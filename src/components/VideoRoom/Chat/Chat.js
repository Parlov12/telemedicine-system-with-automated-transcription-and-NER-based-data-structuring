import React, { useState, useRef, useEffect } from 'react';
import Style from '../Chat/Chat.module.css';

// my component
import MessageSent from './MessageSent/MessageSent';
import MessageReceived from './MessageReceived/MessageReceived';
import { v4 as uuidv4 } from 'uuid';
import ConnectionDisplay from './ConnectionDisplay/ConnectionDisplay';



const Chat=({sendMessage, height, width, messages, setMessages, dataConnectionStatus})=> {
    
    // message state
    const [message, setMessage] = useState({
        type: 'sender',
        status: 'pending',
        content: '',
        time: '',
        id: uuidv4()
    });


    // message input - use case -> clear input after sending message
    const [inputValue, setInputValue] = useState('');

    
    // time
    const time = new Date();

    // reference to messages container
    const messagesContainer = useRef(null);

    // reference to message input
    const messageInputRef = useRef(null);

    
    // listen for messages and when a new message is received, scroll to the bottom
    // and remove duplicates
    useEffect(() => {
        // unique messages based on id - remove duplicates
        const uniqueMessages = messages.reduce((acc, current) => {
            acc.set(current.id, current);
            return acc;
        }, new Map());
    
        // convert map to array
        const filteredMessages = Array.from(uniqueMessages.values());
    
        // only update if duplicates were found and removed
        if (filteredMessages.length !== messages.length) {
            setMessages(filteredMessages);
        } else {
            // scroll to bottom to div ref 
            if (messagesContainer.current) {
                messagesContainer.current.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [messages]); 

    // use effect tha increases the height of the chat container
    useEffect(() => {
        if (messageInputRef.current) {
            messageInputRef.current.style.height = 'auto'; // Reset height
            messageInputRef.current.style.height = `${messageInputRef.current.scrollHeight}px`; // Set height based on scrollHeight
        }
    }, [inputValue]); // trigger it when input value changes
    

    // handle input change - update message content and input value
    const handleInputChange = (e) => {
        
        // set message content to input value
        setMessage(prevMessage => ({
            ...prevMessage,
            content: e.target.value
        }))
        
        // set input value
        setInputValue(e.target.value);
    }

    // handle sending message
    const handleSend = (message) => {
        // if message is empty, return
        if(message?.content === '' || message?.content === undefined) return;

        const time = new Date();
        
        // format time to HH:MM
        const formattedTime = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;

        const msg = {
            type: 'sender',
            status: 'pending',
            content: message.content,
            id: message.id,
            time: formattedTime
        }
        // add message to message list
        setMessages(prevMessages => [...prevMessages, msg]);

        // send message
        sendMessage({
            type: 'chat-message',
            msg
        });
        // clear input
        setInputValue('');
        // set new message id
        setMessage(prevMessage => ({
            ...prevMessage,
            content: '',
            id: uuidv4()
        }));
    }

    // handle key down - if enter is pressed, message is sent
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { // enter key without Shift key
            e.preventDefault(); // prevent default action (e.g., adding a new line in textarea)
            handleSend(message);
        }
    }


    return (
        <div className={Style.ChatContainer} style={{width:`${width}`, height:`${height}`}}>
            <div className={Style.MessagesContainer} >
                {messages.map((message, index) => {
                        if(message.type === 'sender') {
                            return(<MessageSent key={index} message={message} sendAgain={sendMessage}/>)
                        } else if(message.type === 'receiver') {
                            return(<MessageReceived key={index} message={message}/>)
                        } else {
                            console.log('Invalid message type')
                        }
                    }
                    )
                }
                <div ref={messagesContainer}></div>
                <ConnectionDisplay isConnected={dataConnectionStatus}/>
            </div>
            <div className={Style.MessageInputContainer}>
                <textarea 
                    value={inputValue} 
                    onChange={handleInputChange} 
                    className={Style.MessageInput} 
                    type="text" 
                    placeholder="type..." 
                    onKeyDown={handleKeyDown} 
                    ref={messageInputRef}
                />
                <button 
                    onClick={() => handleSend(message)} 
                    className={Style.MessageSendButton}
                >
                Send
                </button>
            </div>
        </div>
        );
}
export default Chat;