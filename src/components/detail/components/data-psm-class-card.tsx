import React, {memo} from "react";
import {Grid} from "@mui/material";
import {InDifferentLanguages} from "./InDifferentLanguages";
import {RightPanel} from "./right-panel";
import {useDataPsmAndInterpretedPim} from "../../../hooks/useDataPsmAndInterpretedPim";
import {DataPsmClass} from "model-driven-data/data-psm/model";
import {PimClass} from "model-driven-data/pim/model";
import {useLabelAndDescription} from "../../../hooks/use-label-and-description";

export const DataPsmClassCard: React.FC<{ iri: string, onClose: () => void  }> = memo(({iri, onClose}) => {
    const resources = useDataPsmAndInterpretedPim<DataPsmClass, PimClass>(iri);
    const [label, description] = useLabelAndDescription(resources.dataPsmResource, resources.pimResource);

    return <Grid container spacing={5} sx={{pt: 3}}>
        <Grid item xs={6}>
            <InDifferentLanguages label={label} description={description} iri={iri} resourceType="dataPsm"/>
        </Grid>
        <Grid item xs={6}>
            <RightPanel iri={iri} close={onClose}/>
        </Grid>
    </Grid>
});
