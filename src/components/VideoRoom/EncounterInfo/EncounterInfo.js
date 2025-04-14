import Style from '../EncounterInfo/EncounterInfo.module.css';
import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { useEffect } from 'react';

import { Card } from 'primereact/card';


const EncounterInfo = (encounterId) => {
  const [encounterData, setEncounterData] = useState(null);
  const [encounterID, setEncounterID] = useState(encounterId.encounterId);
  const [subject, setSubject] = useState(null);
  const [practitioner, setPractitioner] = useState(null);
  const [startEncounter, setStartEncounter] = useState(null);
  const [endEncounter, setEndEncounter] = useState(null);

  console.log(encounterID);

  const fetchEncounterData = async () => {
    try {
      const response = await fetch(`http://localhost:8080/fhir/Encounter/${encounterID}`);
      if (response.ok) {
        const encounter = await response.json();
        console.log(encounter);
        setEncounterData(encounter);

      } else {
        console.error('Failed to fetch Encounter');
        //alert('Failed to fetch Encounter data');
      }
    } catch (error) {
      console.error('Error fetching Encounter:', error);
      //alert('Error occurred while fetching Encounter data');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    // Format the date as "Day Month Year" (e.g., "25 August 2024")
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Function to format the time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    // Format the time as "Hour:Minute AM/PM" (e.g., "04:00 PM")
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  useEffect(() => {
    if (encounterId) {
      fetchEncounterData();
    }
  }, [encounterId]);

  // This useEffect will run whenever encounterData is updated
  useEffect(() => {
    if (encounterData) {
      const { subject, participant, period } = encounterData;

      setSubject(subject?.display || "Unknown Patient");
      setPractitioner(participant?.[0]?.individual?.display || "Unknown Practitioner");
      setStartEncounter(period?.start || null);
      setEndEncounter(period?.end || null);
    }
  }, [encounterData]);


  //  console.log(encounterData);

  //    console.log(subject);
  //  console.log(participant);

  return (
    <div className={Style.Card}>
      <div className={Style.EncounterInfo}>

      <div className={Style.PersonInfo}>
      <div className={Style.PatientInfo}>
          <p className={Style.Label}>Patient :  </p>
          <p>{subject}</p>
        </div>
        <div className={Style.PractitionerInfo}>
          <p className={Style.Label}>Practitoner :</p>
          <p>{practitioner}</p>
        </div>
      </div>
        <div className={Style.Period}>
          <div className={Style.StartEncounter}>
            <p className={Style.Label}>Start :  </p>
            <p>{formatTime(startEncounter)}</p>
          </div>
          <div className={Style.EndEncounter}>
            <p className={Style.Label}>End :  </p>
            <p>{formatTime(endEncounter)}</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default EncounterInfo;