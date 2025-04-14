// stlye
import Style from 'EndCallModal.module.css'

const EndCallModal = () => {
    return (  
        <div className={Style.Container}>
            <button className={Style.YesButton}>YES</button>
            <button className={Style.NoButton}>NO</button>
        </div>
    );
}
 
export default EndCallModal;