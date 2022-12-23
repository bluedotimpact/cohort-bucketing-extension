import React from "react";
import { Button, FieldPickerSynced, Icon, Input, Label, TablePickerSynced, Tooltip, useBase, useGlobalConfig, ViewPickerSynced } from "@airtable/blocks/ui"
import { GCKey, get } from "./globalConfigHelpers";
import { FieldType } from "@airtable/blocks/models";

const InputCollector = () => {
    const globalConfig = useGlobalConfig();

    const base = useBase()
    const participantsTableId = get(globalConfig, GCKey.PARTICIPANTS_TABLE_ID, base.tables[0].id)
    const participantsTable = base.getTableByIdIfExists(participantsTableId)

    const dimensionsCount = parseInt(get(globalConfig, GCKey.DIMENSION_FIELD_IDS_COUNT, "2"))

    const addDimension = () => {
        globalConfig.setAsync(GCKey.DIMENSION_FIELD_IDS_COUNT, String(dimensionsCount + 1))
    }
    
    const removeDimension = (idx: number) => {
        const newDimensions = new Array(dimensionsCount).fill(0)
            .map((_, i) => get(globalConfig, `${GCKey.DIMENSION_FIELD_IDS_PREFIX}${i}`, null))
            .filter((_, i) => i !== idx);

        globalConfig.setAsync(GCKey.DIMENSION_FIELD_IDS_COUNT, String(newDimensions.length))
        globalConfig.setPathsAsync([
            { path: [GCKey.DIMENSION_FIELD_IDS_COUNT], value: String(newDimensions.length) },
            ...newDimensions.map((d, i) => ({ path: [`${GCKey.DIMENSION_FIELD_IDS_PREFIX}${i}`], value: d })),
            { path: [`${GCKey.DIMENSION_FIELD_IDS_PREFIX}${newDimensions.length}`], value: null },
        ])
    }

    return (<>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
                <Label htmlFor="participants-table-picker">
                    Participants table
                    <Tooltip
                        content="Table containing participants"
                        placementX={Tooltip.placements.CENTER}
                        placementY={Tooltip.placements.BOTTOM}>
                        <Icon name="help" size={12} style={{ marginLeft: "4px" }} />
                    </Tooltip>
                </Label>
                <TablePickerSynced
                    id="participants-table-picker"
                    placeholder="Pick the participants (input) table..."
                    globalConfigKey={GCKey.PARTICIPANTS_TABLE_ID}
                />
            </div>
            <div>
                <Label htmlFor="participants-view-picker">
                    Participants view
                    <Tooltip
                        content={"Participants in this view will be bucketed"}
                        placementX={Tooltip.placements.CENTER}
                        placementY={Tooltip.placements.BOTTOM}>
                        <Icon name="help" size={12} style={{ marginLeft: "4px" }} />
                    </Tooltip>
                </Label>
                <ViewPickerSynced
                    id="participants-view-picker"
                    placeholder="Pick the participants (input) view..."
                    table={participantsTable}
                    globalConfigKey={GCKey.PARTICIPANTS_VIEW_ID}
                />
            </div>
            <div>
                <Label htmlFor="buckets-table-picker">
                    Buckets table
                    <Tooltip
                        content="Table containing buckets"
                        placementX={Tooltip.placements.CENTER}
                        placementY={Tooltip.placements.BOTTOM}>
                        <Icon name="help" size={12} style={{ marginLeft: "4px" }} />
                    </Tooltip>
                </Label>
                <TablePickerSynced
                    id="buckets-table-picker"
                    placeholder="Pick the buckets (output) table..."
                    globalConfigKey={GCKey.BUCKETS_TABLE_ID}
                />
            </div>
            <div>
                <Label htmlFor="buckets-field-picker">
                    Participant bucket field
                    <Tooltip
                        content="Field on the participant that links to bucket"
                        placementX={Tooltip.placements.CENTER}
                        placementY={Tooltip.placements.BOTTOM}>
                        <Icon name="help" size={12} style={{ marginLeft: "4px" }} />
                    </Tooltip>
                </Label>
                <FieldPickerSynced
                    id="buckets-field-picker"
                    placeholder="Pick the participant bucket field..."
                    table={participantsTable}
                    allowedTypes={[FieldType.MULTIPLE_RECORD_LINKS]}
                    globalConfigKey={GCKey.BUCKET_FIELD_ID}
                />
            </div>
            <div>
                <Label htmlFor="bucket-size-input">
                    Target bucket size
                    <Tooltip
                        content="Target number of participants per bucket"
                        placementX={Tooltip.placements.CENTER}
                        placementY={Tooltip.placements.BOTTOM}>
                        <Icon name="help" size={12} style={{ marginLeft: "4px" }} />
                    </Tooltip>
                </Label>
                <Input
                    id="bucket-size-input"
                    placeholder="Bucket size"
                    value={get(globalConfig, GCKey.BUCKET_SIZE, "50")}
                    type="number"
                    step="1"
                    min="1"
                    onChange={e => globalConfig.setAsync(GCKey.BUCKET_SIZE, e.target.value)}
                />
            </div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
            <h2 style={{ flex: "1" }}>
                Dimensions
                <Tooltip
                    content="The features to group participants by"
                    placementX={Tooltip.placements.CENTER}
                    placementY={Tooltip.placements.BOTTOM}>
                    <Icon name="help" size={12} style={{ marginLeft: "4px" }} fillColor="#757575" />
                </Tooltip>
            </h2>
            <Button size="small" icon="plus" onClick={addDimension}>Add</Button>
        </div>
        <div style={{ display: "grid", gap: "4px" }}>
            {new Array(dimensionsCount).fill(0).map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <FieldPickerSynced
                        placeholder="Pick a dimension field..."
                        table={participantsTable}
                        allowedTypes={[FieldType.NUMBER, FieldType.PERCENT]}
                        globalConfigKey={`${GCKey.DIMENSION_FIELD_IDS_PREFIX}${i}`}
                    />
                    <Button
                        icon="trash"
                        aria-label="Remove field"
                        onClick={() => removeDimension(i)}
                    />
                </div>
            ))}
        </div>
    </>)
}

export default InputCollector;
