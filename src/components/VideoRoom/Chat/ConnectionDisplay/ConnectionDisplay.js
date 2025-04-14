import Style from './ConnectionDisplay.module.css';

const ConnectionDisplay = ({isConnected}) => {

    return (  
        <div className={Style.Container}>
            {
                isConnected ? (
                    <div className={Style.ConnectedContainer}>
                        <div className={Style.ConnectedCircle}/>
                        <div>connected</div>
                    </div>
                ) : (
                    <div className={Style.DisconnectedContainer}>
                        <div className={Style.DisconnectedCircle}/>
                        <div>disconnected</div>
                    </div>
                )
            }
        </div>
    );
}
 
export default ConnectionDisplay;