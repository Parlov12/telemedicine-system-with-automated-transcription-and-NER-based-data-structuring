import Style from './EndCallButton.module.css'

const EndCallButton = ({ setEndCallModalIsVisible }) => {
    
    const handleEndCall = () => {
        setEndCallModalIsVisible(true);
    }

    return (
        <button className={Style.EndCallButton} onClick={handleEndCall}>
            <i className={`pi pi-phone ${Style.EndCallButtonIcon}`} onClick={handleEndCall}></i>
        </button>
     );
}
 
export default EndCallButton;