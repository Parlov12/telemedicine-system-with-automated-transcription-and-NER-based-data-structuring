// style
import Style from './ErrorMessageDisplay.module.css'

const ErrorMessageDisplay = ({handleErrorMessage, errorText}) => {
    return (  
        <div className={Style.ErrorMessageContainer}>
            <div className={Style.ErrorMessage}>{errorText}</div>
            <button className={Style.ErrorYesButton} onClick={() => handleErrorMessage()}>U REDU</button> 
        </div>
    );
}
 
export default ErrorMessageDisplay;