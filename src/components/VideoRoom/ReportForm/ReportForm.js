import React, { useState } from 'react';
import Style from '../ReportForm/ReportForm.module.css';
import { Button } from 'primereact/button';
import { useEffect } from 'react';

const ReportForm = (encounterId) => {
  const [reportText, setReportText] = useState('');
  const [encounterData, setEncounterData] = useState(null);
  const [encounterID,setEncounterID]=useState(encounterId.encounterId);


  const fetchEncounterData = async () => {
    try {
      const response = await fetch(`http://localhost:8080/fhir/Encounter/${encounterID}`);
      if (response.ok) {
        const encounter = await response.json();
        setEncounterData(encounter);
        console.log(encounter);
      } else {
        console.error('Failed to fetch Encounter');
        //alert('Failed to fetch Encounter data');
      }
    } catch (error) {
      console.error('Error fetching Encounter:', error);
      //alert('Error occurred while fetching Encounter data');
    }
  };

   useEffect(() => {
    if (encounterID) {
      //fetchEncounterData();
    }
  }, [encounterID]);

  

  const handleSubmitReport = async () => {
      
    if (!encounterData) {
      alert('Encounter data not loaded yet');
      return;
    }

    const { subject, participant } = encounterData;

    const diagnosticReport = {
      resourceType: "DiagnosticReport",
      id: "7171",  
      meta: {
        versionId: "1",
        lastUpdated: new Date().toISOString(), 
        source: "#143wqZe6XtGjNZcX"
      },
      status: "final",
      code: {
        coding: [{
          system: "http://loinc.org",
          code: "29544-4"
        }]
      },
      subject: {
        reference:subject?.reference,
        display: subject?.display || "Unknown Patient"
      },
      encounter: {
        reference: `Encounter/${encounterID}` 
      },
      issued: new Date().toISOString(), 
      performer: [{
        reference: participant && participant[0]?.individual?.reference,
        display: participant && participant[0]?.individual?.display || "Unknown Practitioner"
      }],
      conclusion: reportText 
    };

    console.log(diagnosticReport);

    try {
      const response = await fetch('http://localhost:8080/fhir/DiagnosticReport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(diagnosticReport)
      });

      if (response.ok) {
        //alert('DiagnosticReport successfully submitted!');
        setReportText('');
      } else {
        //alert('Failed to submit DiagnosticReport');
      }
    } catch (error) {
      console.error('Error submitting DiagnosticReport:', error);
      //alert('Error occurred while submitting DiagnosticReport');
    }
      
  };

  return (
    <div className={Style.ReportForm}>
      {/* <h3 className={Style.FormHeading}>Report Form</h3> */}
     
      <textarea
        className={Style.ReportInput}
        value={reportText}
        onChange={(e) => setReportText(e.target.value)} 
        placeholder="Enter your report conclusion here"
      ></textarea>
      <Button className={Style.SubmitFormButton} onClick={handleSubmitReport} label="Submit" />
    </div>
  );
};

export default ReportForm;
