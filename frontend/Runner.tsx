import { Field, FieldType, Table, View } from "@airtable/blocks/models";
import { Button, ProgressBar, useBase, useGlobalConfig } from "@airtable/blocks/ui";
import React, { useState } from "react";
import { cluster } from "../lib/clustering";
import { GCKey, get } from "./globalConfigHelpers";

const Runner = () => {
    const base = useBase();

    const globalConfig = useGlobalConfig();

    const [error, setError] = useState<string | undefined>()
    const [progress, setProgress] = useState<number | undefined>()

    const onSubmit = async () => {
        try {
            setError(undefined)
            setProgress(0)

            const participantsTableId = get(globalConfig, GCKey.PARTICIPANTS_TABLE_ID, base.tables[0].id)
            const participantsTable = base.getTableByIdIfExists(participantsTableId)

            const bucketsTableId = get(globalConfig, GCKey.BUCKETS_TABLE_ID, base.tables[0].id)
            const bucketsTable = base.getTableByIdIfExists(bucketsTableId)

            if (!participantsTable) {
                throw new Error("Participants table not selected. Please select the appropriate table.")
            }

            const participantsViewId = get(globalConfig, GCKey.PARTICIPANTS_VIEW_ID, base.tables[0].views[0].id)
            const participantsView = participantsTable.getViewByIdIfExists(participantsViewId)

            if (!participantsView) {
                throw new Error("Participants view not selected. Please select the appropriate view.")
            }

            if (!bucketsTable) {
                throw new Error("Buckets table not selected. Please select the appropriate table.")
            }

            if (participantsTable.id === bucketsTable.id) {
                throw new Error("Participants and buckets tables should be different. Please select the appropriate tables.")
            }

            const bucketField = participantsTable.getFieldByIdIfExists(get(globalConfig, GCKey.BUCKET_FIELD_ID, ""))

            if (!bucketField) {
                throw new Error("Bucket field not found. Ensure you've selected the right column on the participants table that identifies the participant's bucket.")
            }

            const bucketSizeParsed = parseInt(get(globalConfig, GCKey.BUCKET_SIZE, "50"))

            if (!Number.isInteger(bucketSizeParsed)) {
                throw new Error("Bucket size is not an integer. Ensure it's valid.")
            }

            if (bucketSizeParsed <= 0) {
                throw new Error("Bucket size is not positive. Ensure it's greater than 0.")
            }

            const dimensionsCount = parseInt(get(globalConfig, GCKey.DIMENSION_FIELD_IDS_COUNT, "2"))

            if (!Number.isInteger(dimensionsCount)) {
                throw new Error("Dimensions count is not an integer. Ensure it's valid.")
            }

            const dimensionFieldIds = new Array(dimensionsCount).fill(0).map((_, i) => get(globalConfig, `${GCKey.DIMENSION_FIELD_IDS_PREFIX}${i}`, null)).filter(v => !!v) as string[]

            if (!dimensionFieldIds.length) {
                alert("No dimensions selected. Please select at least one dimension.")
                return;
            }

            const dimensionFields = dimensionFieldIds.map((fieldId) => participantsTable?.getFieldByIdIfExists(fieldId)).filter(v => !!v) as Field[]

            if (dimensionFields.length < dimensionFieldIds.length) {
                alert("Invalid dimension selected for participants table. Ensure you've selected valid dimensions for the participants (input) table.")
                return;
            }

            const nonNumericFields = dimensionFields.filter(f => f.type !== FieldType.NUMBER && f.type !== FieldType.PERCENT)
            if (nonNumericFields.length) {
                alert(`Invalid dimensions selected for participants table (${nonNumericFields.map(f => f.name).join(", ")}). Ensure you've selected numeric dimensions for the participants (input) table.`)
                return;
            }

            await runBucketing(
                participantsTable,
                participantsView,
                bucketsTable,
                dimensionFields,
                bucketField,
                bucketSizeParsed,
                setProgress,
            )
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
        } finally {
            setProgress(undefined)
        }
    }

    return (<>
        <div style={{ display: "flex", marginTop: "8px", gap: "4px" }}>
            <p style={{ flex: "1", margin: "0", fontWeight: "bold", color: "#D21404" }}>{error && `Error: ${error}`}</p>
            <Button
                variant="primary"
                icon="play"
                onClick={onSubmit}
                disabled={progress !== undefined}
            >
                Run
            </Button>
        </div>
        {progress !== undefined && <ProgressBar progress={progress} style={{ marginTop: "8px" }} />}
    </>)
}


const runBucketing = async (
    participants: Table,
    participantsView: View,
    buckets: Table,
    dimensionFields: Field[],
    bucketField: Field,
    bucketSize: number,
    setProgress: (p: number) => void,
) => {
    // 1. Get participants records
    const query = await participantsView.selectRecordsAsync();
    const participantElements = query.records.map(r => {
        const e = { id: r.id, values: {} as Record<string, number> }
        dimensionFields.forEach(f => e.values[f.id] = r.getCellValue(f) as number)
        return e;
    });
    query.unloadData();
    setProgress(0.05)

    // 2. Cluster into buckets
    const results = cluster({
        clusterSize: bucketSize,
        elements: participantElements,
        keys: dimensionFields.map(f => f.id),
    })
    setProgress(0.1)

    // 3. Create the buckets in AirTable
    const bucketIds = await buckets.createRecordsAsync(new Array(results.count).fill(0).map((_, i) => ({
        fields: { [buckets.primaryField.id]: `Bucket ${i + 1}` }
    })))
    setProgress(0.25)

    // 4. Link the participants to their assigned bucket
    // Rate limiting requires us to only update 50 records at a time
    const allUpdates = results.assignments.map(a => ({
        id: a.id,
        fields: { [bucketField.id]: [{ id: bucketIds[a.cluster] }] }
    }));
    for (let i = 0; i < allUpdates.length; i += 50) {
        await participants.updateRecordsAsync(allUpdates.slice(i, i + 50))
        setProgress(0.25 + 0.75 * (i / allUpdates.length))
    }
    setProgress(1)
}

export default Runner;
