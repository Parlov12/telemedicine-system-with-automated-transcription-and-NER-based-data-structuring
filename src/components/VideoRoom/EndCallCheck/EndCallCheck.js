import Style from './EndCallCheck.module.css';

const EndCallCheck = ({endCall, setModalVisible, finishCall, isPractitioner}) => {

    const handleYes = () => {
        endCall();
        setModalVisible(false); // change to close tab
        if(!isPractitioner) {
            finishCall(true)
        }
        
    }

    const handleNo = () => {
        setModalVisible(false);
    }

    return (  
        <div className={Style.Container}>
            <div className={Style.Modal}>
                <div className={Style.Content}>
                    <div className={Style.Message}>Are you sure?</div>
                    <div className={Style.ButtonsContainer}>
                        <button className={Style.YesButton} onClick={handleYes}>Yes</button>
                        <button className={Style.NoButton} onClick={handleNo}>No</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
 
export default EndCallCheck;