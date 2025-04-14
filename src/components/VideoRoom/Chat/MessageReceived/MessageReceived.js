// style
import Style from './MessageReceived.module.css';

const MessageReceived = ({message}) => {
    return (  
        <div className={Style.MessageContainer}>
            <div className={Style.MessageContent}>
                <div className={Style.MessageText}>{message.content}</div>
                <div className={Style.MessageStatusBar}>
                    <div className={Style.MessageTime}>{message.time}</div>
                </div>
            </div>
        </div>
    );
}
 
export default MessageReceived;