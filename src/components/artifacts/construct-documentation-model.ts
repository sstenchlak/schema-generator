import {CoreResourceReader} from "model-driven-data/core";
import {coreResourcesToConceptualModel} from "model-driven-data/conceptual-model";
import {coreResourcesToStructuralModel} from "model-driven-data/structure-model";
import {createModelsToWebSpecificationConfiguration, DocumentationModel, modelsToWebSpecification} from "model-driven-data/documentation-model";

export async function constructDocumentationModel(reader: CoreResourceReader, fromSchema: string): Promise<DocumentationModel> {
    const conceptualModel = await coreResourcesToConceptualModel(reader, fromSchema);
    const structureModel = await coreResourcesToStructuralModel(reader, fromSchema);
    const modelsToWebSpecificationConfiguration = createModelsToWebSpecificationConfiguration();

    if (conceptualModel === null) {
        throw new Error("Empty conceptual model.");
    }

    if (structureModel === null) {
        throw new Error("Empty structural model.");
    }

    return modelsToWebSpecification(conceptualModel, [structureModel], modelsToWebSpecificationConfiguration);
}