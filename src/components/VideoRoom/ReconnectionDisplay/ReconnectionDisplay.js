import Style from './ReconnectionDisplay.module.css';

const ReconnectionDisplay = ({triggerReconnection, reconnectionMessage, setReconnectionMessageText, setReconnectButtonIsOpen, setCallAttempts}) => {

    const handleReconnection = async () => {
        await setCallAttempts(0);
        triggerReconnection();
        setReconnectButtonIsOpen(false);
        setReconnectionMessageText('Connection was interrupted!');
    }

    return (  
        <div className={Style.ReconnectionContainer}>
                <div className={Style.ReconnectionMessage}>{reconnectionMessage}</div>
                <button className={Style.ReconnectButton} onClick={() => handleReconnection()}>CONNECT AGAIN</button>
        </div>
    );
}
 
export default ReconnectionDisplay;