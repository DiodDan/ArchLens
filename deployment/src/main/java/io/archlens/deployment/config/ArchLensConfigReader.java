package io.archlens.deployment.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import java.io.IOException;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;

/**
 * Reads and parses {@code archlens.yaml}.
 */
@Slf4j
public class ArchLensConfigReader {

    private static final ObjectMapper MAPPER = new ObjectMapper(new YAMLFactory())
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    private ArchLensConfigReader() {
    }

    /**
     * Reads and parses {@code archlens.yaml}.
     */
    public static ArchLensYamlConfig read(Path configPath) throws IOException {
        ArchLensYamlConfig config = MAPPER.readValue(configPath.toFile(), ArchLensYamlConfig.class);
        if (config == null || config.getSystem() == null) {
            throw new IOException("archlens.yaml must have a top-level 'system:' block.");
        }
        validate(config, configPath);
        return config;
    }

    private static void validate(ArchLensYamlConfig config, Path configPath) {
        if (config.getSystem().getId() == null || config.getSystem().getId().isBlank()) {
            throw new IllegalStateException("system.id is required in " + configPath);
        }

        Set<String> declaredNotDefined = new HashSet<>(config.getSubsystems().keySet());
        Set<String> definedNotDeclared = new HashSet<>(config.getSubsystemDefinitions().keySet());
        declaredNotDefined.removeAll(config.getSubsystemDefinitions().keySet());
        definedNotDeclared.removeAll(config.getSubsystems().keySet());

        if (!declaredNotDefined.isEmpty()) {
            throw new IllegalStateException(
                    "subsystems contains '" + declaredNotDefined + "' but it is not defined in subsystem-defs:");
        }

        if (!definedNotDeclared.isEmpty()) {
            throw new IllegalStateException(
                    "subsystem-defs contains '" + definedNotDeclared + "' but it is not declared in subsystems:");
        }


        Set<String> sharedIds = config.getSharedLayers().keySet();

        Set<String> usedSharedIds = config.getSubsystemDefinitions().values().stream()
                .flatMap(s -> s.getSharedLayerRefs().stream())
                .collect(java.util.stream.Collectors.toSet());
        Set<String> usedInLayersSharedIds = config.getSubsystemDefinitions().values().stream()
                .flatMap(s -> s.getLayers().values().stream())
                .flatMap(l -> l.getAllowedDependencies().getSharedLayers().stream())
                .collect(java.util.stream.Collectors.toSet());

        usedSharedIds.addAll(usedInLayersSharedIds);
        usedSharedIds.removeAll(sharedIds);
        if (!usedSharedIds.isEmpty()) {
            throw new IllegalStateException(
                    "subsystem-defs references shared-layers '" + usedSharedIds + "' that are not defined in shared-layers:"
            );
        }
    }
}
