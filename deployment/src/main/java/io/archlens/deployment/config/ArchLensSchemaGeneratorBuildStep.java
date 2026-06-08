package io.archlens.deployment.config;

import com.fasterxml.classmate.ResolvedType;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.victools.jsonschema.generator.*;
import com.github.victools.jsonschema.module.jackson.JacksonModule;
import com.github.victools.jsonschema.module.jackson.JacksonOption;
import io.quarkus.deployment.IsDevelopment;
import io.quarkus.deployment.annotations.BuildProducer;
import io.quarkus.deployment.annotations.BuildStep;
import io.quarkus.deployment.builditem.GeneratedResourceBuildItem;
import io.quarkus.deployment.builditem.nativeimage.NativeImageResourceBuildItem;
import io.quarkus.deployment.pkg.builditem.OutputTargetBuildItem;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;

/**
 * Quarkus build step that auto-generates a JSON Schema (Draft-7) for
 * {@code archlens.yaml} directly from {@link ArchLensYamlConfig}.
 */
@Slf4j
public class ArchLensSchemaGeneratorBuildStep {

    static final String SCHEMA_RESOURCE_PATH = "META-INF/archlens-schema.json";
    private static final String SCHEMA_FILE_NAME = "archlens-schema.json";

    @BuildStep(onlyIf = IsDevelopment.class)
    void generateArchLensJsonSchema(
            OutputTargetBuildItem outputTarget,
            BuildProducer<GeneratedResourceBuildItem> generatedResources,
            BuildProducer<NativeImageResourceBuildItem> nativeImageResources) {

        byte[] schemaBytes = buildSchemaBytes();

        generatedResources.produce(
                new GeneratedResourceBuildItem(SCHEMA_RESOURCE_PATH, schemaBytes));

        nativeImageResources.produce(
                new NativeImageResourceBuildItem(SCHEMA_RESOURCE_PATH));

        writeToOutputDir(outputTarget.getOutputDirectory(), schemaBytes);
    }

    private byte[] buildSchemaBytes() {
        ObjectNode schemaNode = buildSchemaNode();
        try {
            return new ObjectMapper()
                    .writerWithDefaultPrettyPrinter()
                    .writeValueAsBytes(schemaNode);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(
                    "Failed to serialise ArchLens JSON schema to bytes", e);
        }
    }

    private ObjectNode buildSchemaNode() {
        JacksonModule jacksonModule = new JacksonModule(
                JacksonOption.RESPECT_JSONPROPERTY_REQUIRED,
                JacksonOption.FLATTENED_ENUMS_FROM_JSONVALUE);

        SchemaGeneratorConfigBuilder configBuilder = new SchemaGeneratorConfigBuilder(
                SchemaVersion.DRAFT_7, OptionPreset.PLAIN_JSON)
                .with(jacksonModule)
                .with(Option.DEFINITIONS_FOR_ALL_OBJECTS);

        configBuilder.forTypesInGeneral()
                .withAdditionalPropertiesResolver(scope -> {
                    ResolvedType type = scope.getType();
                    if (!type.isInstanceOf(Map.class)) {
                        return Void.class;
                    }
                    ResolvedType[] params = type.getTypeParameters().toArray(new ResolvedType[0]);
                    return params.length >= 2 ? params[1].getErasedType() : Object.class;
                });

        return new SchemaGenerator(configBuilder.build())
                .generateSchema(ArchLensYamlConfig.class);
    }

    private void writeToOutputDir(Path outputDir, byte[] schemaBytes) {
        Path schemaPath = outputDir.resolve(SCHEMA_FILE_NAME);
        try {
            Files.createDirectories(schemaPath.getParent());
            Files.write(schemaPath, schemaBytes);
            log.debug("ArchLens JSON schema written to: {}", schemaPath.toAbsolutePath());
        } catch (IOException e) {
            log.debug(
                    "Could not write ArchLens schema to '{}' (IDE tooling may be affected): {}",
                    schemaPath, e.getMessage());
        }
    }
}