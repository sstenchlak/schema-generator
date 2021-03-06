import React, {memo, ReactElement, useCallback, useRef, useState} from "react";
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    Divider,
    Fab,
    ListItemIcon,
    Menu,
    MenuItem
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {useToggle} from "../../hooks/useToggle";
import {uniqueId} from "lodash";
import {useTranslation} from "react-i18next";
import {GetBikeshedArtifact, GetPreviewBikeshedArtifact} from "./BikeshedArtifact";
import {getObjectModelArtifact, GetPreviewComponentObjectModelArtifact} from "./ObjectModelArtifact";
import {StoreContext} from "../App";
import {GetJsonSchemaArtifact, GetPreviewComponentJsonSchemaArtifact} from "./JsonSchemaArtifact";
import {DialogParameters} from "../dialog-parameters";
import {useDialog} from "../../hooks/useDialog";
import {GetPreviewComponentXsdArtifact, GetXsdArtifact} from "./XsdArtifact";
import FileSaver from "file-saver";
import {getNameForSchema} from "../../utils/getNameForSchema";
import copy from "copy-to-clipboard";
import {useSnackbar} from "notistack";
import {CoreResourceReader} from "model-driven-data/core";
import ContentCopyTwoToneIcon from '@mui/icons-material/ContentCopyTwoTone';
import DownloadTwoToneIcon from '@mui/icons-material/DownloadTwoTone';
import FindInPageTwoToneIcon from '@mui/icons-material/FindInPageTwoTone';
import {useAsyncMemo} from "../../hooks/useAsyncMemo";

const PreviewDialog: React.FC<DialogParameters & {content: Promise<ReactElement>}> = memo(({content, isOpen, close}) => {
    const {t} = useTranslation("artifacts");
    const component = useAsyncMemo(async () => {
        if (content) {
            try {
                return await content;
            } catch (error) {
                return <Alert severity="error"><strong>{t("error mdd")}</strong><br />{(error as Error).message}</Alert>;
            }
        }
        return null;
    }, [content]);

    return <Dialog open={isOpen} onClose={close} maxWidth="lg" fullWidth>
        <DialogContent>
            {component ?? null}
        </DialogContent>
        <DialogActions>
            <Button onClick={close}>{t("close")}</Button>
        </DialogActions>
    </Dialog>
});

function useCopyToClipboard(close: () => void) {
    const {psmSchemas, store} = React.useContext(StoreContext);
    const {enqueueSnackbar} = useSnackbar();
    const {t} = useTranslation("artifacts");
    return useCallback(async (getArtifact: (store: CoreResourceReader, schema: string) => Promise<string>) => {
        close();
        let value: string | undefined = undefined;
        try {
            value = await getArtifact(store, psmSchemas[0]);
        } catch (error) {
            enqueueSnackbar(<><strong>{t("error mdd")}</strong>: {(error as Error).message}</>, {variant: "error"});
        }
        if (value !== undefined) {
            if (copy(value)) {
                enqueueSnackbar(t("snackbar copied to clipboard.ok"), {variant: "success"});
            } else {
                enqueueSnackbar(t("snackbar copied to clipboard.failed"), {variant: "error"});
            }
        }
    }, [close, psmSchemas, store, enqueueSnackbar, t]);
}

function useSaveToFile(close: () => void) {
    const {psmSchemas, store} = React.useContext(StoreContext);
    const {i18n} = useTranslation("artifacts");
    const {t} = useTranslation("artifacts");
    const {enqueueSnackbar} = useSnackbar();
    return useCallback(async (getArtifact: (store: CoreResourceReader, schema: string) => Promise<string>, extension: string, mime: string) => {
        close();
        let artifact: string | undefined = undefined;
        try {
            artifact = await getArtifact(store, psmSchemas[0]);
        } catch (error) {
            enqueueSnackbar(<><strong>{t("error mdd")}</strong>: {(error as Error).message}</>, {variant: "error"});
        }
        if (artifact !== undefined) {
            const name = await getNameForSchema(store, psmSchemas[0], i18n.languages);
            const data = new Blob([artifact], {type: mime});
            FileSaver.saveAs(data, name + "." + extension, {autoBom: false});
        }
    }, [close, psmSchemas, store, enqueueSnackbar]);
}


export const GenerateArtifacts: React.FC<{
    artifactPreview: ((store: CoreResourceReader, schema: string) => Promise<ReactElement>) | null,
    setArtifactPreview: (value: () => (((store: CoreResourceReader, schema: string) => Promise<ReactElement>) | null)) => void
}> = ({setArtifactPreview, artifactPreview}) => {
    const {isOpen, open, close} = useToggle();
    const [ id ] = useState(() => uniqueId());
    const ref = useRef(null);
    const {t} = useTranslation("artifacts");
    const {psmSchemas, store} = React.useContext(StoreContext);

    const Preview = useDialog(PreviewDialog, ["content"]);

    const copy = useCopyToClipboard(close);
    const save = useSaveToFile(close);

    return (
        <>
            <Fab aria-controls={id} aria-haspopup="true" variant="extended" size="medium" color="primary" onClick={open} ref={ref} disabled={psmSchemas.length === 0}>
                {t("button generate load artifacts")}
                <ExpandMoreIcon />
            </Fab>
            <Menu
                id={id}
                anchorEl={ref.current}
                keepMounted
                open={isOpen}
                onClose={close}
            >
                <MenuItem disabled style={{opacity: 1, fontWeight: "bold"}}>Bikeshed</MenuItem>
                <Box sx={{display: "flex"}}>
                    <MenuItem onClick={() => save(GetBikeshedArtifact, "bs", "text/bs;charset=utf-8")}>
                        <ListItemIcon><DownloadTwoToneIcon fontSize="small" /></ListItemIcon>
                        {t("download")}
                    </MenuItem>
                    <MenuItem onClick={() => {
                        close();
                        GetPreviewBikeshedArtifact(store, psmSchemas[0]);
                    }}><ListItemIcon><FindInPageTwoToneIcon fontSize="small" /></ListItemIcon>{t("preview")}</MenuItem>
                    <MenuItem onClick={() => copy(GetBikeshedArtifact)}>
                        <ListItemIcon><ContentCopyTwoToneIcon fontSize="small" /></ListItemIcon>
                        {t("copy")}
                    </MenuItem>
                </Box>

                <Divider />

                <MenuItem disabled style={{opacity: 1, fontWeight: "bold"}}>Object-model</MenuItem>
                <Box sx={{display: "flex"}}>
                    <MenuItem onClick={() => save(getObjectModelArtifact, "json", "text/json;charset=utf-8")}>
                        <ListItemIcon><DownloadTwoToneIcon fontSize="small" /></ListItemIcon>
                        {t("download")}
                    </MenuItem>
                    <MenuItem onClick={() => {
                        close();
                        Preview.open({content: GetPreviewComponentObjectModelArtifact(store, psmSchemas[0])});
                    }}><ListItemIcon><FindInPageTwoToneIcon fontSize="small" /></ListItemIcon>{t("preview")}</MenuItem>
                    <MenuItem onClick={() => copy(getObjectModelArtifact)}>
                        <ListItemIcon><ContentCopyTwoToneIcon fontSize="small" /></ListItemIcon>
                        {t("copy")}
                    </MenuItem>
                </Box>
                <MenuItem onClick={() => {
                    close();
                    setArtifactPreview(() => artifactPreview === GetPreviewComponentObjectModelArtifact ? null : GetPreviewComponentObjectModelArtifact);
                }}><ListItemIcon><FindInPageTwoToneIcon fontSize="small" /></ListItemIcon>{t("live preview")} (experimental)
                </MenuItem>

                <Divider />

                <MenuItem disabled style={{opacity: 1, fontWeight: "bold"}}>JSON schema</MenuItem>
                <Box sx={{display: "flex"}}>
                    <MenuItem onClick={() => save(GetJsonSchemaArtifact, "json", "text/json;charset=utf-8")}>
                        <ListItemIcon><DownloadTwoToneIcon fontSize="small" /></ListItemIcon>
                        {t("download")}
                    </MenuItem>
                    <MenuItem onClick={() => {
                        close();
                        Preview.open({content: GetPreviewComponentJsonSchemaArtifact(store, psmSchemas[0])});
                    }}><ListItemIcon><FindInPageTwoToneIcon fontSize="small" /></ListItemIcon>{t("preview")}</MenuItem>
                    <MenuItem onClick={() => copy(GetJsonSchemaArtifact)}>
                        <ListItemIcon><ContentCopyTwoToneIcon fontSize="small" /></ListItemIcon>
                        {t("copy")}
                    </MenuItem>
                </Box>
                <MenuItem onClick={() => {
                    close();
                    setArtifactPreview(() => artifactPreview === GetPreviewComponentJsonSchemaArtifact ? null : GetPreviewComponentJsonSchemaArtifact);
                }}><ListItemIcon><FindInPageTwoToneIcon fontSize="small" /></ListItemIcon>{t("live preview")} (experimental)</MenuItem>

                <Divider />

                <MenuItem disabled style={{opacity: 1, fontWeight: "bold"}}>XSD</MenuItem>
                <Box sx={{display: "flex"}}>
                    <MenuItem onClick={() => save(GetXsdArtifact, "xsd", "text/xml;charset=utf-8")}>
                        <ListItemIcon><DownloadTwoToneIcon fontSize="small" /></ListItemIcon>
                        {t("download")}
                    </MenuItem>
                    <MenuItem onClick={() => {
                        close();
                        Preview.open({content: GetPreviewComponentXsdArtifact(store, psmSchemas[0])});
                    }}><ListItemIcon><FindInPageTwoToneIcon fontSize="small" /></ListItemIcon>{t("preview")}</MenuItem>
                    <MenuItem onClick={() => copy(GetXsdArtifact)}>
                        <ListItemIcon><ContentCopyTwoToneIcon fontSize="small" /></ListItemIcon>
                        {t("copy")}
                    </MenuItem>
                </Box>
                <MenuItem onClick={() => {
                    close();
                    setArtifactPreview(() => artifactPreview === GetPreviewComponentXsdArtifact ? null : GetPreviewComponentXsdArtifact);
                }}><ListItemIcon><FindInPageTwoToneIcon fontSize="small" /></ListItemIcon>{t("live preview")} (experimental)</MenuItem>

            </Menu>

            <Preview.component />
        </>
    );
};
