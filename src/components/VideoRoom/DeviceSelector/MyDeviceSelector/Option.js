import React, { useEffect, useState } from 'react';

// style
import Style from './MyDeviceSelector.module.css'

const Option = ({deviceId, selectedDevice, setSelectedDevice, label, setOptionsAreOpen, switchDevice}) => {

    const[isSelected, setIsSelected] = useState(true);

    // track if selected device has changed
    useEffect(() => {

    }, [])

    // track if selected device has changed
    useEffect(() => {
        if(selectedDevice === deviceId) {
            setIsSelected(true);
        } else {
            setIsSelected(false);
        }
    }, [selectedDevice])

    const handleSelection = () => {
        setSelectedDevice(deviceId);
        setOptionsAreOpen(false);
        switchDevice(deviceId);
    }

    return (  
        <div className={`${isSelected ? Style.OptionContainerSelected : Style.OptionContainer}`} onClick={() => handleSelection()}>
            <div className={Style.Option}>{label}</div>
        </div>
    );
}
 
export default Option;