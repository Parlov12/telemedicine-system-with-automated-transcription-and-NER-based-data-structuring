import Style from './ConnectingAnimation.module.css'

const ConnectingAnimation = () => {
    return (
        <div className={Style.AnimationContainer}>
            <div className={Style.ConnectingText}>...connecting with practitioner...</div>
            <div className={Style.DotContainer}>
                <div className={Style.Dot}></div>
                <div className={Style.Dot}></div>
                <div className={Style.Dot}></div>
                <div className={Style.Dot}></div>
            </div>
        </div>
     );
}
 
export default ConnectingAnimation;