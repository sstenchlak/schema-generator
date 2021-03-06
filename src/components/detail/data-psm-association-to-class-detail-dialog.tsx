import React, {memo, useMemo} from "react";
import {Box, Dialog, DialogContent, DialogContentText, DialogTitle, Tab, Tabs, Typography} from "@mui/material";
import {useTranslation} from "react-i18next";
import {DataPsmAssociationEnd, DataPsmClass} from "model-driven-data/data-psm/model";
import {PimAssociationEnd, PimClass} from "model-driven-data/pim/model";
import {useDataPsmAndInterpretedPim} from "../../hooks/useDataPsmAndInterpretedPim";
import {selectLanguage} from "../../utils/selectLanguage";
import {usePimAssociationFromPimAssociationEnd} from "../dataPsm/use-pim-association-from-pim-association-end";
import RemoveIcon from '@mui/icons-material/Remove';
import {LanguageStringFallback} from "../helper/LanguageStringComponents";
import {DataPsmAssociationEndCard} from "./components/data-psm-association-end-card";
import {DataPsmClassCard} from "./components/data-psm-class-card";
import {ResourceInStore} from "./components/resource-in-store";
import {DialogParameters} from "../dialog-parameters";
import {useLabelAndDescription} from "../../hooks/use-label-and-description";
import {CimLinks} from "./components/cim-links";
import {CloseDialogButton} from "./components/close-dialog-button";
import {Show} from "../helper/Show";

export const DataPsmAssociationToClassDetailDialog: React.FC<{parentIri: string, iri: string} & DialogParameters> = memo(({parentIri, iri, isOpen, close}) => {
    const associationEnd = useDataPsmAndInterpretedPim<DataPsmAssociationEnd, PimAssociationEnd>(iri);
    const association = usePimAssociationFromPimAssociationEnd(associationEnd.dataPsmResource?.dataPsmInterpretation ?? null);
    const childClass = useDataPsmAndInterpretedPim<DataPsmClass, PimClass>(associationEnd?.dataPsmResource?.dataPsmPart ?? null);

    const [associationEndLabel, associationEndDescription] = useLabelAndDescription(associationEnd.dataPsmResource, associationEnd.pimResource);
    const wholeAssociationLabel = useMemo(() => ({...association.resource?.pimHumanLabel, ...associationEndLabel}), [association.resource?.pimHumanLabel, associationEndLabel]);
    const wholeAssociationDescription = useMemo(() => ({...association.resource?.pimHumanDescription, ...associationEndDescription}), [association.resource?.pimHumanDescription, associationEndDescription]);
    const [childClassLabel, childClassDescription] = useLabelAndDescription(childClass.dataPsmResource, childClass.pimResource);

    const [tab, setTab] = React.useState(0);
    const [storeTab, setStoreTab] = React.useState("dataPsmAssociationEnd");
    let currentStoreTabIri: string | null = null;
    switch (storeTab) {
        case "dataPsmAssociationEnd": currentStoreTabIri = associationEnd?.dataPsmResource?.iri ?? null; break;
        case "pimAssociationEnd": currentStoreTabIri = associationEnd?.pimResource?.iri ?? null; break;
        case "pimAssociation": currentStoreTabIri = association?.resource?.iri ?? null; break;
        case "dataPsmChild": currentStoreTabIri = childClass?.dataPsmResource?.iri ?? null; break;
        case "pimChild": currentStoreTabIri = childClass?.pimResource?.iri ?? null; break;
    }

    const {t, i18n} = useTranslation("detail");

    return (
        <Dialog open={isOpen} onClose={close} maxWidth="md" fullWidth>
            <DialogTitle>
                {selectLanguage(wholeAssociationLabel, i18n.languages) ?? <i>parent</i>}
                {association.resource?.pimInterpretation && <CimLinks iri={association.resource.pimInterpretation}/>}

                <RemoveIcon sx={{mx: 5, verticalAlign: "middle"}} />

                {selectLanguage(childClassLabel, i18n.languages) ?? <i>parent</i>}
                {childClass.pimResource?.pimInterpretation && <CimLinks iri={childClass.pimResource.pimInterpretation}/>}

                <CloseDialogButton onClick={close} />
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    <LanguageStringFallback from={wholeAssociationDescription} fallback={<i>no description for association</i>}/>
                    <RemoveIcon sx={{mx: 1, verticalAlign: "top"}}/>
                    <LanguageStringFallback from={childClassDescription} fallback={<i>no description for range class</i>}/>
                </DialogContentText>

                <Tabs centered value={tab} onChange={(e, ch) => setTab(ch)}>
                    <Tab label={t('tab association')} />
                    <Tab label={t('tab range class')} />
                    <Tab label={t('tab store')} />
                </Tabs>

                <Show when={tab === 0}><DataPsmAssociationEndCard iri={iri} onClose={close} /></Show>
                <Show when={tab === 1}>{associationEnd?.dataPsmResource?.dataPsmPart && <DataPsmClassCard iri={associationEnd?.dataPsmResource?.dataPsmPart as string} onClose={close} />}</Show>
                {tab === 2 && <>
                    <Box sx={{my: 3}}>
                        <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                            <Typography variant={"subtitle1"} sx={{fontWeight: "bold", mr: 2}}>
                                {t('tab title association')}
                            </Typography>
                            <Tabs value={storeTab} onChange={(e, ch) => setStoreTab(ch)}>
                                <Tab label={t('tab data psm association end')} value={"dataPsmAssociationEnd"} />
                                <Tab label={t('tab pim association end')} value={"pimAssociationEnd"} />
                                <Tab label={t('tab pim association')} value={"pimAssociation"} />
                            </Tabs>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                            <Typography variant={"subtitle1"} sx={{fontWeight: "bold", mr: 2}}>
                                {t('tab title range class')}
                            </Typography>
                            <Tabs value={storeTab} onChange={(e, ch) => setStoreTab(ch)}>
                                <Tab label={t('tab data psm child')} value={"dataPsmChild"} />
                                <Tab label={t('tab pim child')} value={"pimChild"} />
                            </Tabs>
                        </Box>
                    </Box>

                    {currentStoreTabIri && <ResourceInStore iri={currentStoreTabIri}/>}
                </>}
            </DialogContent>
        </Dialog>
    );
});
