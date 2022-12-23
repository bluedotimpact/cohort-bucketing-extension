import { initializeBlock } from "@airtable/blocks/ui";
import React from "react";
import InputCollector from "./InputCollector";
import Runner from "./Runner";

const ParticipantBucketingApp = () => {
    return <div style={{ padding: "0 16px" }}>
        <h1>Participant Bucketing App</h1>
        <p>This app is for stage 1 of 2 of the cohort allocation process. It buckets participants by dimensions (e.g. career level or ML experience). The output of this application will then be in the input for stage 2 of 2, which splits these buckets into cohorts.</p>
        
        <InputCollector />
        <Runner />
    </div>;
}

initializeBlock(() => <ParticipantBucketingApp />);
