import Style from './InternetConnectionStatusDisplay.module.css'

const InternetConnectionStatusDisplay = () => {
    return (
        <div className={Style.DisplayContainer}>
            <div className={Style.DisplayMessage}>No internet connection! Please check internet connection and then continue!</div>
        </div>
     );
}
 
export default InternetConnectionStatusDisplay;